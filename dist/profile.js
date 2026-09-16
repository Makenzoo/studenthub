const profileKey = 'studenthub.profile.v1';
const dialog = document.querySelector('#profileDialog');
const trigger = document.querySelector('#profileTrigger');
const form = document.querySelector('#profileForm');
const status = document.querySelector('#profileStatus');

function setSelectValue(selector, value) {
  const select = document.querySelector(selector);
  if ([...select.options].some(option => option.value === value)) select.value = value;
}

function applyProfile(profile) {
  if (!profile) return;
  document.querySelector('#profileName').value = profile.name || 'Данияр';
  setSelectValue('#profileCity', profile.city);
  setSelectValue('#profileUniversity', profile.university);
  setSelectValue('#profileSpecialty', profile.specialty);
  setSelectValue('#profileCourse', profile.course);
  document.querySelectorAll('input[name="interest"]').forEach(input => {
    input.checked = profile.interests?.includes(input.value) || false;
  });
  const initial = (profile.name || 'Д').trim().charAt(0).toUpperCase() || 'Д';
  document.querySelector('#profileInitial').textContent = initial;
  document.querySelector('#profileLargeInitial').textContent = initial;
  const greeting = document.querySelector('.welcome strong');
  if (greeting) greeting.textContent = `Добро пожаловать, ${profile.name || 'Данияр'}`;
  setSelectValue('#city', profile.city);
  setSelectValue('#specialty', profile.specialty);
  const result = document.querySelector('#filterResult');
  if (profile.city && profile.specialty) result.textContent = `Подбираем возможности для направления «${profile.specialty}» в городе ${profile.city}`;
}

function openProfile() { dialog.hidden = false; document.body.style.overflow = 'hidden'; document.querySelector('#profileName').focus(); }
function closeProfile() { dialog.hidden = true; document.body.style.overflow = ''; }

trigger.addEventListener('click', openProfile);
dialog.querySelectorAll('[data-close-profile]').forEach(button => button.addEventListener('click', closeProfile));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.hidden) closeProfile(); });

form.addEventListener('submit', event => {
  event.preventDefault();
  const values = new FormData(form);
  const profile = {
    name: values.get('name').trim(), city: values.get('city'), university: values.get('university'),
    specialty: values.get('specialty'), course: values.get('course'), interests: values.getAll('interest')
  };
  localStorage.setItem(profileKey, JSON.stringify(profile));
  applyProfile(profile);
  status.textContent = 'Профиль сохранён. Подборка обновлена.';
  setTimeout(closeProfile, 850);
});

try { applyProfile(JSON.parse(localStorage.getItem(profileKey))); } catch { localStorage.removeItem(profileKey); }
