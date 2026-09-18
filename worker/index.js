import { legacyAssets } from "./legacy-assets.js";

const text = (value, fallback = "") => typeof value === "string" ? value.trim() : fallback;
const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders } });
const error = (message, status = 400) => json({ error: message }, status);
const today = () => new Date().toISOString().slice(0, 10);

function identity(request) {
  const id = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");
  return id && email ? { id, email, name: request.headers.get("oai-authenticated-user-full-name") || email } : null;
}

function requireDb(env) {
  if (!env.DB) throw new Error("База данных ещё не подключена.");
  return env.DB;
}

function configuredAdminEmails(env) {
  return text(env.ADMIN_EMAILS).split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

const encoder = new TextEncoder();
let emailAuthTables;

function base64(bytes) {
  let output = "";
  for (const byte of bytes) output += String.fromCharCode(byte);
  return btoa(output);
}

function base64url(bytes) {
  return base64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function bytesFromBase64(value) {
  const raw = atob(value);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function sha256(value) {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function passwordHash(password, salt, iterations = 210000) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytesFromBase64(salt), iterations }, key, 256);
  return base64(new Uint8Array(bits));
}

function sameValue(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function emailFrom(value) {
  const email = text(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Укажите корректный email.");
  return email;
}

function passwordFrom(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) throw new Error("Пароль должен содержать от 8 до 128 символов.");
  return value;
}

function readCookie(request, name) {
  const match = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`));
  return match ? match[1] : null;
}

async function ensureEmailAuthTables(db) {
  emailAuthTables ||= db.exec(`
    CREATE TABLE IF NOT EXISTS password_credentials (
      user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      iterations INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS email_sessions (
      token_hash TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_email_sessions_expiry ON email_sessions(expires_at);
  `);
  return emailAuthTables;
}

async function sessionUser(env, request) {
  const token = readCookie(request, "studenthub_auth");
  if (!token) return null;
  const db = requireDb(env);
  await ensureEmailAuthTables(db);
  return db.prepare("SELECT u.id,u.email,u.display_name,u.role FROM email_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? LIMIT 1").bind(await sha256(token), new Date().toISOString()).first();
}

async function issueSession(env, userId) {
  const db = requireDb(env);
  await ensureEmailAuthTables(db);
  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  await db.prepare("INSERT INTO email_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)").bind(await sha256(token), userId, expiresAt).run();
  return `studenthub_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

async function userFor(env, request) {
  const person = identity(request);
  if (person) {
    const db = requireDb(env);
    const row = await db.prepare("SELECT id, email, display_name, role FROM users WHERE id = ?").bind(person.id).first();
    return row ? { ...row, authenticated: true } : { ...person, role: null, authenticated: true, registered: false };
  }
  const user = await sessionUser(env, request);
  return user ? { ...user, authenticated: true } : null;
}

async function requireRegistered(env, request) {
  const user = await userFor(env, request);
  if (!user?.role) return null;
  return user;
}

async function requireAdmin(env, request) {
  const person = identity(request);
  if (person && configuredAdminEmails(env).includes(person.email.toLowerCase())) {
    const db = requireDb(env);
    await db.prepare("INSERT INTO users (id,email,display_name,role) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,role='admin',updated_at=CURRENT_TIMESTAMP").bind(person.id, person.email, person.name.slice(0, 80), "admin").run();
    return { ...person, role: "admin", authenticated: true };
  }
  const user = await requireRegistered(env, request);
  return user?.role === "admin" ? user : null;
}

function safeUrl(value) {
  const url = text(value);
  if (!/^https:\/\//i.test(url)) throw new Error("Укажите безопасную ссылку HTTPS.");
  return url;
}

function safeDate(value, label) {
  const date = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${label}: укажите дату.`);
  return date;
}

function safeSlug(value) {
  const slug = text(value).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug: используйте латинские буквы, цифры и дефисы.");
  return slug;
}

async function catalog(env, type, request) {
  const db = requireDb(env); const url = new URL(request.url); const q = text(url.searchParams.get("q")).toLowerCase(); const city = text(url.searchParams.get("city"));
  const table = type === "university" ? "universities" : "grants";
  const title = type === "university" ? "name" : "title";
  let sql = `SELECT * FROM ${table} WHERE is_published = 1`; const params = [];
  if (city) { sql += " AND city = ?"; params.push(city); }
  if (q) { sql += type === "university" ? " AND (lower(name) LIKE ? OR lower(city) LIKE ?)" : " AND (lower(title) LIKE ? OR lower(provider_name) LIKE ? OR lower(specialty) LIKE ?)"; const term = `%${q}%`; params.push(...(type === "university" ? [term, term] : [term, term, term])); }
  sql += ` ORDER BY ${type === "grant" ? "deadline ASC" : `${title} COLLATE NOCASE ASC`}`;
  const result = await db.prepare(sql).bind(...params).all(); return json({ items: result.results || [] });
}

async function detail(env, type, slug) {
  const db = requireDb(env); const table = type === "university" ? "universities" : "grants";
  const item = await db.prepare(`SELECT * FROM ${table} WHERE slug = ? AND is_published = 1`).bind(slug).first();
  return item ? json({ item }) : error("Запись не найдена.", 404);
}

async function emailRegister(env, request) {
  const db = requireDb(env);
  await ensureEmailAuthTables(db);
  const body = await request.json();
  const email = emailFrom(body.email);
  const password = passwordFrom(body.password);
  const displayName = text(body.displayName, email).slice(0, 80) || email;
  const existing = await db.prepare("SELECT id FROM users WHERE email=? LIMIT 1").bind(email).first();
  if (existing) return error("Аккаунт с этим email уже существует. Войдите в него.", 409);
  const id = crypto.randomUUID();
  const salt = base64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await passwordHash(password, salt);
  const role = configuredAdminEmails(env).includes(email) ? "admin" : "student";
  await db.prepare("INSERT INTO users (id,email,display_name,role) VALUES (?,?,?,?)").bind(id, email, displayName, role).run();
  await db.prepare("INSERT INTO password_credentials (user_id,password_salt,password_hash,iterations) VALUES (?,?,?,?)").bind(id, salt, hash, 210000).run();
  await db.prepare("INSERT INTO student_profiles (user_id,city,specialty,study_year) VALUES (?,?,?,?)").bind(id, text(body.city), text(body.specialty), Number(body.studyYear) || null).run();
  return json({ ok: true, user: { id, email, display_name: displayName, role } }, 201, { "set-cookie": await issueSession(env, id) });
}

async function emailLogin(env, request) {
  const db = requireDb(env);
  await ensureEmailAuthTables(db);
  const body = await request.json();
  const email = emailFrom(body.email);
  const password = passwordFrom(body.password);
  const account = await db.prepare("SELECT u.id,u.email,u.display_name,u.role,c.password_salt,c.password_hash,c.iterations FROM users u JOIN password_credentials c ON c.user_id=u.id WHERE u.email=? LIMIT 1").bind(email).first();
  if (!account) return error("Неверный email или пароль.", 401);
  const candidate = await passwordHash(password, account.password_salt, account.iterations);
  if (!sameValue(candidate, account.password_hash)) return error("Неверный email или пароль.", 401);
  return json({ ok: true, user: { id: account.id, email: account.email, display_name: account.display_name, role: account.role } }, 200, { "set-cookie": await issueSession(env, account.id) });
}

async function emailLogout(env, request) {
  const token = readCookie(request, "studenthub_auth");
  if (token) {
    const db = requireDb(env);
    await ensureEmailAuthTables(db);
    await db.prepare("DELETE FROM email_sessions WHERE token_hash=?").bind(await sha256(token)).run();
  }
  return json({ ok: true }, 200, { "set-cookie": "studenthub_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
}

async function authSession(env, request) {
  return json({ user: await userFor(env, request) });
}

async function stats(env) {
  const count = await requireDb(env).prepare("SELECT COUNT(*) AS count FROM users").first();
  return json({ registeredUsers: Number(count?.count || 0) });
}

async function register(env, request) {
  const person = identity(request); if (!person) return error("Войдите через ChatGPT, чтобы создать профиль.", 401);
  const db = requireDb(env); const body = await request.json(); const displayName = text(body.displayName, person.name).slice(0, 80) || person.email;
  const configuredAdmins = configuredAdminEmails(env);
  const role = configuredAdmins.includes(person.email.toLowerCase()) ? "admin" : "student";
  await db.prepare("INSERT INTO users (id,email,display_name,role) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, role=CASE WHEN users.role='admin' THEN 'admin' ELSE excluded.role END, updated_at=CURRENT_TIMESTAMP").bind(person.id, person.email, displayName, role).run();
  await db.prepare("INSERT INTO student_profiles (user_id,city,specialty,study_year) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET city=excluded.city,specialty=excluded.specialty,study_year=excluded.study_year,updated_at=CURRENT_TIMESTAMP").bind(person.id, text(body.city), text(body.specialty), Number(body.studyYear) || null).run();
  return json({ ok: true, role });
}

async function profile(env, request) {
  const user = await requireRegistered(env, request); if (!user) return error("Сначала зарегистрируйте профиль.", 401);
  const db = requireDb(env);
  if (request.method === "GET") { const profile = await db.prepare("SELECT u.id,u.email,u.display_name,u.role,p.city,p.specialty,p.study_year FROM users u LEFT JOIN student_profiles p ON p.user_id=u.id WHERE u.id=?").bind(user.id).first(); return json({ profile }); }
  const body = await request.json(); await db.prepare("UPDATE users SET display_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(text(body.displayName).slice(0,80),user.id).run(); await db.prepare("INSERT INTO student_profiles (user_id,city,specialty,study_year) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET city=excluded.city,specialty=excluded.specialty,study_year=excluded.study_year,updated_at=CURRENT_TIMESTAMP").bind(user.id,text(body.city),text(body.specialty),Number(body.studyYear)||null).run(); return json({ ok:true });
}

async function favorite(env, request) {
  const user = await requireRegistered(env, request); if (!user) return error("Сначала зарегистрируйте профиль.", 401); const db=requireDb(env); const body=await request.json(); const type=text(body.type); const id=Number(body.id); if(!["university","grant"].includes(type)||!Number.isInteger(id)) return error("Некорректная запись.");
  const exists=await db.prepare("SELECT 1 FROM favorites WHERE user_id=? AND item_type=? AND item_id=?").bind(user.id,type,id).first(); if(exists){await db.prepare("DELETE FROM favorites WHERE user_id=? AND item_type=? AND item_id=?").bind(user.id,type,id).run();return json({saved:false});} await db.prepare("INSERT INTO favorites (user_id,item_type,item_id) VALUES (?,?,?)").bind(user.id,type,id).run();return json({saved:true});
}

async function favorites(env, request) {
  const user=await requireRegistered(env,request);if(!user)return error("Сначала зарегистрируйте профиль.",401);const db=requireDb(env);const result=await db.prepare("SELECT f.item_type,f.item_id,u.slug,u.name AS title,u.city,u.source_url,u.checked_at,g.title AS grant_title,g.slug AS grant_slug,g.provider_name,g.deadline,g.source_url AS grant_source_url,g.checked_at AS grant_checked_at FROM favorites f LEFT JOIN universities u ON f.item_type='university' AND u.id=f.item_id LEFT JOIN grants g ON f.item_type='grant' AND g.id=f.item_id WHERE f.user_id=? ORDER BY f.created_at DESC").bind(user.id).all();return json({items:result.results||[]});
}

async function adminCatalog(env, request) { const admin=await requireAdmin(env,request);if(!admin)return error("Доступ только для администратора.",403);const db=requireDb(env);const universities=await db.prepare("SELECT * FROM universities ORDER BY updated_at DESC").all();const grants=await db.prepare("SELECT * FROM grants ORDER BY updated_at DESC").all();return json({universities:universities.results||[],grants:grants.results||[]}); }

async function saveAdmin(env, request, type) {
  const admin=await requireAdmin(env,request);if(!admin)return error("Доступ только для администратора.",403);const db=requireDb(env);const b=await request.json();try{const checkedAt=safeDate(b.checkedAt||today(),"Дата проверки");const source=safeUrl(b.sourceUrl);const id=Number(b.id)||null;
    if(type==="university"){const values=[safeSlug(b.slug),text(b.name),text(b.city),text(b.kind),text(b.websiteUrl),text(b.description),source,checkedAt,b.published===false?0:1,admin.id];if(values.slice(0,3).some(v=>!v))return error("Заполните название, slug и город.");if(id)await db.prepare("UPDATE universities SET slug=?,name=?,city=?,type=?,website_url=?,description=?,source_url=?,checked_at=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(...values.slice(0,9),id).run();else{const r=await db.prepare("INSERT INTO universities (slug,name,city,type,website_url,description,source_url,checked_at,is_published,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(...values).run();id=r.meta.last_row_id;}}
    else {const values=[safeSlug(b.slug),text(b.title),text(b.providerName),text(b.city),text(b.specialty),text(b.amountDescription),text(b.eligibility),safeDate(b.deadline,"Дедлайн"),text(b.applicationUrl)?safeUrl(b.applicationUrl):null,source,checkedAt,b.published===false?0:1,admin.id];if(values.slice(0,3).some(v=>!v)||!values[6])return error("Заполните название, источник, организацию и условия.");if(id)await db.prepare("UPDATE grants SET slug=?,title=?,provider_name=?,city=?,specialty=?,amount_description=?,eligibility=?,deadline=?,application_url=?,source_url=?,checked_at=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(...values.slice(0,12),id).run();else{const r=await db.prepare("INSERT INTO grants (slug,title,provider_name,city,specialty,amount_description,eligibility,deadline,application_url,source_url,checked_at,is_published,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(...values).run();id=r.meta.last_row_id;}}
    await db.prepare("INSERT INTO audit_log (actor_id,entity_type,entity_id,action) VALUES (?,?,?,?)").bind(admin.id,type,id,Number(b.id)?"updated":"created").run();return json({ok:true,id});
  }catch(e){return error(e instanceof Error?e.message:"Не удалось сохранить запись.");}}

const styles=`:root{--bg:#090810;--panel:#12111d;--line:#2d2940;--text:#f6f4ff;--muted:#aaa6b9;--violet:#8b6cf0;--cyan:#69dcff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 90% 0,#221143,transparent 30%),var(--bg);color:var(--text);font:500 16px/1.5 Arial,sans-serif}a{color:inherit;text-decoration:none}.bar,.wrap{max-width:1180px;margin:auto;padding:0 24px}.bar{height:74px;display:flex;gap:24px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-weight:800;font-size:18px}.brand b{color:#a98dff}.nav{display:flex;gap:18px;color:var(--muted);font-size:14px}.nav a:hover{color:#fff}.wrap{padding-top:52px;padding-bottom:80px}.eyebrow{color:var(--cyan);font-size:12px;font-weight:800;letter-spacing:.12em}.hero{display:flex;justify-content:space-between;gap:30px;align-items:end}.hero h1{font-size:clamp(32px,6vw,56px);line-height:1.08;margin:10px 0}.hero p{max-width:690px;color:var(--muted)}.button,button{border:0;border-radius:11px;padding:11px 15px;background:var(--violet);color:#fff;font-weight:800;cursor:pointer}.button.secondary,button.secondary{background:#1b1827;border:1px solid #403b56}.filters{display:flex;gap:10px;flex-wrap:wrap;margin:30px 0}.filters input,.filters select,.form input,.form textarea,.form select{min-height:42px;border:1px solid #3a354e;border-radius:9px;padding:9px 11px;background:#11101a;color:#fff;font:inherit}.filters input{min-width:240px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{border:1px solid var(--line);border-radius:16px;padding:20px;background:var(--panel)}.card h2{font-size:18px;margin:7px 0}.card p,.meta{color:var(--muted);font-size:14px}.meta{display:grid;gap:5px;margin-top:16px}.meta a{color:var(--cyan)}.empty{border:1px dashed #3c3753;border-radius:16px;padding:28px;color:var(--muted)}.notice{padding:13px 15px;border:1px solid #33425d;border-radius:12px;background:#101827;color:#bfeaff;margin:18px 0}.form{display:grid;gap:12px;max-width:720px}.form label{display:grid;gap:5px;color:var(--muted);font-size:13px}.form textarea{min-height:96px}.admin-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:22px}.list{display:grid;gap:10px}.list button{width:100%;text-align:left;background:#171523}.hidden{display:none}@media(max-width:760px){.bar{height:auto;min-height:74px;flex-wrap:wrap;padding-top:16px;padding-bottom:16px}.nav{order:3;width:100%;overflow:auto}.hero,.admin-layout{display:block}.grid{grid-template-columns:1fr}.wrap{padding:35px 18px}.bar{padding-left:18px;padding-right:18px}}`;

const client=`const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));const api=async(u,o)=>{const r=await fetch(u,o);const d=await r.json();if(!r.ok)throw Error(d.error||'Ошибка');return d};const card=(x,t)=>'<article class="card"><small>'+esc(t==='university'?'УНИВЕРСИТЕТ':'ГРАНТ')+'</small><h2>'+esc(t==='university'?x.name:x.title)+'</h2><p>'+esc(t==='university'?x.city:(x.provider_name||'')+(x.amount_description?' · '+x.amount_description:''))+'</p><div class="meta">'+(t==='grant'?'<span>Дедлайн: '+esc(x.deadline)+'</span>':'')+'<span>Проверено: '+esc(x.checked_at)+'</span><a href="'+esc(t==='university'?'/universities/'+x.slug:'/grants/'+x.slug)+'">Подробнее →</a></div></article>';async function catalog(type){const q=$('#q'),city=$('#city'),grid=$('#grid');const load=async()=>{grid.innerHTML='<p class="meta">Загрузка…</p>';try{const d=await api('/api/catalog/'+type+'?q='+encodeURIComponent(q?.value||'')+'&city='+encodeURIComponent(city?.value||''));grid.innerHTML=d.items.length?d.items.map(x=>card(x,type)).join(''):'<div class="empty">Записей пока нет. Каталог наполняет только администратор после проверки источника.</div>'}catch(e){grid.innerHTML='<div class="empty">'+esc(e.message)+'</div>'}};q?.addEventListener('input',load);city?.addEventListener('input',load);load()}async function detail(type,slug){try{const d=await api('/api/catalog/'+type+'/'+slug);const x=d.item;$('#detail').innerHTML=card(x,type)+'<p class="notice">Источник: <a href="'+esc(x.source_url)+'" target="_blank" rel="noreferrer">официальная страница</a></p><button id="fav">Сохранить в избранное</button>';$('#fav').onclick=async()=>{try{const r=await api('/api/favorites',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,id:x.id})});$('#fav').textContent=r.saved?'Сохранено':'Удалено из избранного'}catch(e){alert(e.message)}}}catch(e){$('#detail').textContent=e.message}}async function profile(){const root=$('#profile');try{let d=await api('/api/profile');const p=d.profile;root.innerHTML=form(p);bindProfile()}catch{root.innerHTML='<div class="notice">Чтобы зарегистрироваться, войдите через ChatGPT.</div><a class="button" href="/signin-with-chatgpt?return_to=%2Fprofile" target="_top">Войти через ChatGPT</a>'}}function form(p={}){return '<form class="form" id="profileForm"><label>Имя<input name="displayName" value="'+esc(p.display_name||'')+'" required></label><label>Город<input name="city" value="'+esc(p.city||'')+'"></label><label>Направление<input name="specialty" value="'+esc(p.specialty||'')+'"></label><label>Курс<input name="studyYear" type="number" min="1" max="8" value="'+esc(p.study_year||'')+'"></label><button>Сохранить профиль</button><p class="meta" id="status"></p></form>'}function bindProfile(){$('#profileForm').onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.target));try{await api('/api/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});$('#status').textContent='Профиль сохранён.'}catch(e){$('#status').textContent=e.message}}}async function favorites(){const root=$('#favorites');try{const d=await api('/api/favorites');root.innerHTML=d.items.length?'<div class="grid">'+d.items.map(x=>card({name:x.title||x.grant_title,slug:x.slug||x.grant_slug,city:x.city,provider_name:x.provider_name,deadline:x.deadline,amount_description:''},x.item_type)).join('')+'</div>':'<div class="empty">В избранном пока нет записей.</div>'}catch(e){root.innerHTML='<div class="notice">'+esc(e.message)+'</div>'}}async function admin(){const root=$('#admin');try{const d=await api('/api/admin/catalog');root.innerHTML='<div class="admin-layout"><div><h2>Университеты</h2><div class="list" id="unilist">'+d.universities.map(x=>'<button data-type="university" data-id="'+x.id+'">'+esc(x.name)+' · '+esc(x.city)+'</button>').join('')+'<h2>Гранты</h2>'+d.grants.map(x=>'<button data-type="grant" data-id="'+x.id+'">'+esc(x.title)+' · '+esc(x.deadline)+'</button>').join('')+'</div></div><div><h2 id="formTitle">Новая запись</h2><div class="filters"><button id="newUni">Университет</button><button id="newGrant" class="secondary">Грант</button></div><form class="form" id="adminForm"></form><p class="meta" id="adminStatus"></p></div></div>';let type='university',current={};const draw=()=>{$('#formTitle').textContent=(current.id?'Редактировать: ':'Новая запись: ')+(type==='university'?'университет':'грант');$('#adminForm').innerHTML=adminFields(type,current);$('#adminForm').onsubmit=save;document.querySelectorAll('#unilist button').forEach(b=>b.onclick=()=>{const all=b.dataset.type==='university'?d.universities:d.grants;type=b.dataset.type;current=all.find(x=>x.id==b.dataset.id);draw()});$('#newUni').onclick=()=>{type='university';current={checked_at:'${today()}'};draw()};$('#newGrant').onclick=()=>{type='grant';current={checked_at:'${today()}'};draw()}};const save=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target));body.id=current.id;body.checkedAt=body.checked_at;body.sourceUrl=body.source_url;body.websiteUrl=body.website_url;body.providerName=body.provider_name;body.amountDescription=body.amount_description;body.applicationUrl=body.application_url;try{await api('/api/admin/'+type,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});$('#adminStatus').textContent='Сохранено. Обновите страницу, чтобы увидеть карточку в списке.'}catch(e){$('#adminStatus').textContent=e.message}};draw()}catch(e){root.innerHTML='<div class="notice">'+esc(e.message)+'</div>'}}function adminFields(t,x){const common='<label>Slug<input name="slug" value="'+esc(x.slug||'')+'" required></label><label>Источник (HTTPS)<input name="source_url" value="'+esc(x.source_url||'')+'" required></label><label>Дата проверки<input name="checked_at" type="date" value="'+esc(x.checked_at||'${today()}')+'" required></label>';return t==='university'?'<label>Название<input name="name" value="'+esc(x.name||'')+'" required></label><label>Город<input name="city" value="'+esc(x.city||'')+'" required></label><label>Тип<input name="kind" value="'+esc(x.type||'')+'"></label><label>Сайт (HTTPS)<input name="website_url" value="'+esc(x.website_url||'')+'"></label><label>Описание<textarea name="description" required>'+esc(x.description||'')+'</textarea></label>'+common+'<button>Сохранить университет</button>':'<label>Название<input name="title" value="'+esc(x.title||'')+'" required></label><label>Организация<input name="provider_name" value="'+esc(x.provider_name||'')+'" required></label><label>Город<input name="city" value="'+esc(x.city||'')+'"></label><label>Направление<input name="specialty" value="'+esc(x.specialty||'')+'"></label><label>Сумма / условия финансирования<input name="amount_description" value="'+esc(x.amount_description||'')+'"></label><label>Условия участия<textarea name="eligibility" required>'+esc(x.eligibility||'')+'</textarea></label><label>Дедлайн<input name="deadline" type="date" value="'+esc(x.deadline||'')+'" required></label><label>Ссылка на заявку (HTTPS)<input name="application_url" value="'+esc(x.application_url||'')+'"></label>'+common+'<button>Сохранить грант</button>'}const parts=location.pathname.split('/').filter(Boolean);const route=parts[0]||'home';if(route==='universities')parts[1]?detail('university',parts[1]):catalog('university');if(route==='grants')parts[1]?detail('grant',parts[1]):catalog('grant');if(route==='profile')profile();if(route==='favorites')favorites();if(route==='admin')admin();`;

function documentPage(path) { const section = path.startsWith("/universities") ? "universities" : path.startsWith("/grants") ? "grants" : path.slice(1) || "home"; const title={home:"StudentHub KZ",universities:"Университеты",grants:"Гранты",profile:"Профиль",favorites:"Избранное",admin:"Администрирование"}[section]||"StudentHub KZ";const body=section==="home"?'<section class="hero"><div><p class="eyebrow">ПОРТАЛ ДЛЯ СТУДЕНТОВ КАЗАХСТАНА</p><h1>Проверенные возможности для студента.</h1><p>Университеты и гранты публикуются только после проверки источника. Добавляйте профиль, сохраняйте подходящие записи и возвращайтесь к ним позже.</p></div><a class="button" href="/universities">Открыть каталог</a></section><div class="grid" style="margin-top:35px"><a class="card" href="/universities"><h2>Университеты</h2><p>Каталог вузов с источниками и датой проверки.</p></a><a class="card" href="/grants"><h2>Гранты</h2><p>Сроки, условия и официальные ссылки.</p></a><a class="card" href="/favorites"><h2>Избранное</h2><p>Сохранённые вами записи.</p></a></div>':section==="universities"||section==="grants"?(path.split('/').filter(Boolean).length>1?'<section id="detail"></section>':'<section class="hero"><div><p class="eyebrow">КАТАЛОГ</p><h1>'+title+'</h1><p>Показываем только записи с указанным источником и датой проверки.</p></div></section><div class="filters"><input id="q" type="search" placeholder="Поиск"><input id="city" placeholder="Город"></div><div class="grid" id="grid"></div>'):section==="profile"?'<p class="eyebrow">АККАУНТ</p><h1>Ваш профиль</h1><div id="profile"></div>':section==="favorites"?'<p class="eyebrow">СОХРАНЁННОЕ</p><h1>Избранное</h1><div id="favorites"></div>':'<p class="eyebrow">ДОСТУП ПО РОЛИ</p><h1>Администрирование каталога</h1><p class="lead">Только администратор может создавать и редактировать записи.</p><div id="admin"></div>';return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — StudentHub KZ</title><style>${styles}</style></head><body><header class="bar"><a class="brand" href="/">StudentHub <b>KZ</b></a><nav class="nav"><a href="/universities">Университеты</a><a href="/grants">Гранты</a><a href="/favorites">Избранное</a><a href="/profile">Профиль</a><a href="/admin">Админ</a></nav></header><main class="wrap">${body}</main><script>${client}</script></body></html>`; }

function serveStaticAsset(request) {
  const url = new URL(request.url);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  const asset = legacyAssets[path];
  if (!asset) return null;
  const binary = atob(asset.content);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Response(bytes, { headers: { "content-type": asset.contentType } });
}

export default { async fetch(request, env) { const url=new URL(request.url); try { if(url.pathname==="/api/session") return json({user:await userFor(env,request)}); if(url.pathname==="/api/auth/session") return authSession(env,request); if(url.pathname==="/api/auth/register"&&request.method==="POST") return emailRegister(env,request); if(url.pathname==="/api/auth/login"&&request.method==="POST") return emailLogin(env,request); if(url.pathname==="/api/auth/logout"&&request.method==="POST") return emailLogout(env,request); if(url.pathname==="/api/stats") return stats(env); if(url.pathname==="/api/register"&&request.method==="POST") return register(env,request); if(url.pathname==="/api/profile") return profile(env,request); if(url.pathname==="/api/favorites"&&request.method==="GET") return favorites(env,request); if(url.pathname==="/api/favorites"&&request.method==="POST") return favorite(env,request); const m=url.pathname.match(/^\/api\/catalog\/(universities|university|grants|grant)(?:\/([a-z0-9-]+))?$/); if(m&&request.method==="GET"){const type=m[1].startsWith("university")?"university":"grant";return m[2]?detail(env,type,m[2]):catalog(env,type,request);} if(url.pathname==="/api/admin/catalog") return adminCatalog(env,request); const a=url.pathname.match(/^\/api\/admin\/(university|grant)$/); if(a&&request.method==="POST") return saveAdmin(env,request,a[1]); if(request.method!=="GET") return error("Не найдено.",404); const asset=serveStaticAsset(request); if(asset) return asset; return new Response(documentPage(url.pathname),{headers:{"content-type":"text/html; charset=utf-8"}}); } catch(e) { return error(e instanceof Error?e.message:"Сервис временно недоступен.",503); } } };
