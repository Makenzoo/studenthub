const loginDialog = document.querySelector('#loginDialog');
const loginForm = document.querySelector('#loginForm');
const loginStatus = document.querySelector('#loginStatus');
const loginTrigger = document.querySelector('#profileTrigger');
const loginEmail = document.querySelector('#loginEmail');
const loginPassword = document.querySelector('#loginPassword');
const registrationFields = loginDialog.querySelectorAll('.registration-only');
const registerName = document.querySelector('#registerName');
const registerPasswordConfirm = document.querySelector('#registerPasswordConfirm');
const authTitle = document.querySelector('#loginTitle');
const authSubtitle = document.querySelector('#authSubtitle');
const authSubmit = document.querySelector('#authSubmit');
const socialDividerText = document.querySelector('#socialDividerText');
const authQuestion = document.querySelector('#authQuestion');
const authModeToggle = loginDialog.querySelector('[data-auth-mode-toggle]');
const authEyebrow = document.querySelector('#authEyebrow');
const authAvatar = document.querySelector('#authAvatar');
const authTabs = loginDialog.querySelectorAll('[data-auth-tab]');
let registrationMode = false;

async function authRequest(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Не удалось выполнить запрос.');
  return payload;
}

function setSignedIn(user) {
  const initial = (user.display_name || user.email || 'С').trim().charAt(0).toUpperCase();
  document.querySelector('#profileInitial').textContent = initial;
  loginTrigger.querySelector('span:last-child').textContent = 'Мой кабинет';
  loginTrigger.dataset.signedIn = 'true';
}

async function restoreSession() {
  try {
    const response = await fetch('/api/auth/session');
    const payload = await response.json();
    if (payload.user) setSignedIn(payload.user);
  } catch (_) { /* Static previews do not have the PHP API. */ }
}

function setAuthMode(registering) {
  registrationMode = registering;
  registrationFields.forEach((field) => {
    field.hidden = !registering;
    const input = field.querySelector('input');
    if (input) input.disabled = !registering;
  });
  authTabs.forEach((tab) => {
    const selected = tab.dataset.authTab === (registering ? 'register' : 'login');
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
  });
  authEyebrow.textContent = registering ? 'НОВЫЙ ЛИЧНЫЙ КАБИНЕТ' : 'ВХОД В ЛИЧНЫЙ КАБИНЕТ';
  authAvatar.textContent = registering ? '+' : 'S';
  authTitle.textContent = registering ? 'Создать аккаунт' : 'Войти в StudentHub KZ';
  authSubtitle.textContent = registering ? 'Заполните данные, чтобы зарегистрироваться.' : 'Введите email и пароль, чтобы продолжить.';
  authSubmit.innerHTML = `${registering ? 'Зарегистрироваться' : 'Войти'} <span>→</span>`;
  socialDividerText.textContent = registering ? 'или зарегистрируйтесь через' : 'или войдите через';
  authQuestion.textContent = registering ? 'Уже есть аккаунт?' : 'Нет аккаунта?';
  authModeToggle.textContent = registering ? 'Войти' : 'Зарегистрироваться';
  loginPassword.autocomplete = registering ? 'new-password' : 'current-password';
  registerPasswordConfirm.autocomplete = 'new-password';
  loginStatus.textContent = registrationMode ? 'Пароль хранится на сервере только в защищённом виде.' : 'Введите данные своего аккаунта.';
  if (registering) registerName.focus(); else loginEmail.focus();
}

function openLogin() { loginDialog.hidden = false; document.body.style.overflow = 'hidden'; loginEmail.focus(); }
function closeLogin() { loginDialog.hidden = true; document.body.style.overflow = ''; }

loginTrigger.addEventListener('click', () => {
  if (loginTrigger.dataset.signedIn === 'true') window.location.href = 'profile.html';
  else openLogin();
});
loginDialog.querySelectorAll('[data-close-login]').forEach((element) => element.addEventListener('click', closeLogin));

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (registrationMode && loginPassword.value !== registerPasswordConfirm.value) {
    loginStatus.textContent = 'Пароли не совпадают. Проверьте их и попробуйте снова.';
    registerPasswordConfirm.focus();
    return;
  }
  authSubmit.disabled = true;
  loginStatus.textContent = 'Проверяем данные…';
  try {
    const body = { email: loginEmail.value.trim(), password: loginPassword.value };
    if (registrationMode) body.displayName = registerName.value.trim();
    const result = await authRequest(registrationMode ? '/api/auth/register' : '/api/auth/login', body);
    setSignedIn(result.user);
    loginStatus.textContent = registrationMode ? 'Аккаунт создан.' : 'Вы вошли в аккаунт.';
    loginForm.reset();
    setTimeout(closeLogin, 500);
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

loginDialog.querySelectorAll('[data-login-provider]').forEach((button) => {
  button.addEventListener('click', () => { loginStatus.textContent = `Вход через ${button.dataset.loginProvider} будет добавлен после настройки OAuth-ключей на сервере.`; });
});

authModeToggle.addEventListener('click', () => setAuthMode(!registrationMode));
authTabs.forEach((tab) => tab.addEventListener('click', () => setAuthMode(tab.dataset.authTab === 'register')));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !loginDialog.hidden) closeLogin(); });
setAuthMode(false);
restoreSession();
if (new URLSearchParams(window.location.search).get('login') === '1') openLogin();
