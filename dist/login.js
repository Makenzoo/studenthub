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
let registrationMode = false;

function setAuthMode(registering) {
  registrationMode = registering;
  registrationFields.forEach((field) => {
    field.hidden = !registering;
    field.querySelector('input').disabled = !registering;
  });
  authTitle.textContent = registering ? 'Создать аккаунт' : 'Войти в StudentHub KZ';
  authSubtitle.textContent = registering ? 'Заполните данные, чтобы зарегистрироваться.' : 'Введите email и пароль, чтобы продолжить.';
  authSubmit.innerHTML = `${registering ? 'Зарегистрироваться' : 'Войти'} <span>→</span>`;
  socialDividerText.textContent = registering ? 'или зарегистрируйтесь через' : 'или войдите через';
  authQuestion.textContent = registering ? 'Уже есть аккаунт?' : 'Нет аккаунта?';
  authModeToggle.textContent = registering ? 'Войти' : 'Зарегистрироваться';
  loginPassword.autocomplete = registering ? 'new-password' : 'current-password';
  loginStatus.textContent = registering ? 'Создайте аккаунт за несколько шагов.' : 'Данные входа не сохраняются на этом этапе.';
  if (registering) registerName.focus(); else loginEmail.focus();
}

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
  if (registrationMode && loginPassword.value !== registerPasswordConfirm.value) {
    loginStatus.textContent = 'Пароли не совпадают. Проверьте их и попробуйте снова.';
    registerPasswordConfirm.focus();
    return;
  }
  loginStatus.textContent = registrationMode
    ? 'Регистрация будет доступна после подключения базы данных.'
    : 'Вход станет доступен после подключения базы данных.';
  loginPassword.value = '';
  registerPasswordConfirm.value = '';
});

loginDialog.querySelectorAll('[data-login-provider]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = registrationMode ? 'Регистрация' : 'Вход';
    loginStatus.textContent = `${action} через ${button.dataset.loginProvider} станет доступен после подключения авторизации.`;
  });
});

authModeToggle.addEventListener('click', () => {
  setAuthMode(!registrationMode);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !loginDialog.hidden) closeLogin();
});
