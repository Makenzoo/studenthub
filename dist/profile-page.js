const $ = (selector) => document.querySelector(selector);
const api = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Не удалось выполнить запрос.');
  return payload;
};

function setProfile(profile) {
  $('#displayName').value = profile.display_name || '';
  $('#profileCity').value = profile.city || '';
  $('#profileSpecialty').value = profile.specialty || '';
  $('#studyYear').value = profile.study_year || '';
  const name = profile.display_name || profile.email || 'Студент';
  $('#cabinetGreeting').textContent = `Здравствуйте, ${name}`;
  $('#cabinetEmail').textContent = profile.email || '';
  $('#profileAvatar').textContent = name.trim().charAt(0).toUpperCase();
  $('#adminLink').hidden = profile.role !== 'admin';
}

function showFavorites(items) {
  $('#favoritesCount').textContent = items.length;
  const preview = $('#favoritesPreview');
  if (!items.length) {
    preview.innerHTML = '<p>Здесь появятся университеты и гранты, которые вы сохраните.</p>';
    return;
  }
  preview.innerHTML = items.slice(0, 3).map((item) => {
    const title = item.title || item.university_name || item.grant_title || 'Сохранённая запись';
    return `<div class="favorite-item"><b>${escapeHtml(title)}</b><small>${item.city || item.provider_name || 'StudentHub KZ'}</small></div>`;
  }).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function loadCabinet() {
  try {
    const { profile } = await api('/api/profile');
    setProfile(profile);
    const favorites = await api('/api/favorites');
    showFavorites(favorites.items || []);
  } catch (_) {
    window.location.replace('index.html?login=1');
  }
}

$('#cabinetForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const status = $('#profileStatus');
  button.disabled = true;
  status.textContent = 'Сохраняем…';
  try {
    const body = Object.fromEntries(new FormData(event.currentTarget));
    await api('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    status.textContent = 'Изменения сохранены';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$('#logoutButton').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST' }); } finally { window.location.replace('index.html'); }
});

loadCabinet();
