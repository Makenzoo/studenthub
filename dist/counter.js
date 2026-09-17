const registeredUsers = document.querySelector('#registeredUsers');
const registeredUsersLabel = document.querySelector('#registeredUsersLabel');
let registeredCount = 0;

function renderRegisteredUsers() {
  registeredUsers.textContent = String(registeredCount);
  registeredUsersLabel.textContent = document.documentElement.lang === 'kz'
    ? 'тіркелген пайдаланушы'
    : 'зарегистрированных пользователей';
}

async function loadRegisteredUsers() {
  try {
    const response = await fetch('/api/stats');
    const payload = await response.json();
    if (response.ok && Number.isInteger(payload.registeredUsers)) registeredCount = payload.registeredUsers;
  } catch (_) { registeredCount = 0; }
  renderRegisteredUsers();
}

loadRegisteredUsers();
document.querySelector('.lang-toggle').addEventListener('click', renderRegisteredUsers);
