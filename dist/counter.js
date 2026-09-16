const registeredUsers = document.querySelector('#registeredUsers');
const registeredUsersLabel = document.querySelector('#registeredUsersLabel');

function renderRegisteredUsers() {
  registeredUsers.textContent = '0';
  registeredUsersLabel.textContent = document.documentElement.lang === 'kz'
    ? 'тіркелген пайдаланушы'
    : 'зарегистрированных пользователей';
}

renderRegisteredUsers();
document.querySelector('.lang-toggle').addEventListener('click', renderRegisteredUsers);
