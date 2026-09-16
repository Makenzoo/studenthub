const loginDialog = document.querySelector('#loginDialog');
const loginForm = document.querySelector('#loginForm');
const loginStatus = document.querySelector('#loginStatus');
const loginTrigger = document.querySelector('#profileTrigger');
const loginEmail = document.querySelector('#loginEmail');
const loginPassword = document.querySelector('#loginPassword');

function openLogin() {
  loginDialog.hidden = false;
  document.body.style.overflow = 'hidden';
  loginEmail.focus();
}

function closeLogin() {
  loginDialog.hidden = true;
  document.body.style.overflow = '';
}

loginTrigger.addEventListener('click', openLogin);
loginDialog.querySelectorAll('[data-close-login]').forEach((element) => element.addEventListener('click', closeLogin));

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Вход станет доступен после подключения базы данных.';
  loginPassword.value = '';
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !loginDialog.hidden) closeLogin();
});
