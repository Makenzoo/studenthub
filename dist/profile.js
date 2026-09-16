const profileKey = 'studenthub.profile.v1';
const dialog = document.querySelector('#profileDialog');
const trigger = document.querySelector('#profileTrigger');
const form = document.querySelector('#profileForm');
const status = document.querySelector('#profileStatus');

const kazakhstanCities = ['Туркестан','Астана','Алматы','Шымкент','Актобе','Актау','Атырау','Караганда','Каскелен','Кокшетау','Костанай','Кызылорда','Павлодар','Петропавловск','Семей','Талдыкорган','Тараз','Уральск','Усть-Каменогорск','Жезказган'];
const universitiesByCity = {
  'Туркестан': ['Международный казахско-турецкий университет им. Х. А. Ясави', 'Международный университет туризма и гостеприимства'],
  'Алматы': ['КазНУ им. аль-Фараби', 'Satbayev University', 'Международный университет информационных технологий', 'КБТУ'],
  'Астана': ['Astana IT University', 'ЕНУ им. Л. Н. Гумилёва', 'Nazarbayev University', 'Казахский агротехнический исследовательский университет'],
  'Шымкент': ['Южно-Казахстанский университет им. М. Ауэзова', 'Южно-Казахстанский педагогический университет', 'Университет «Мирас»'],
  'Караганда': ['Карагандинский университет им. Е. А. Букетова', 'Карагандинский технический университет', 'Медицинский университет Караганды'],
  'Каскелен': ['Университет имени Сулеймана Демиреля'],
  'Павлодар': ['Торайгыров университет'],
  'Костанай': ['Костанайский региональный университет им. А. Байтурсынова'],
  'Кызылорда': ['Кызылординский университет им. Коркыт Ата'],
  'Тараз': ['Таразский региональный университет им. М. Х. Дулати'],
  'Усть-Каменогорск': ['Восточно-Казахстанский технический университет им. Д. Серикбаева', 'Восточно-Казахстанский университет им. С. Аманжолова'],
  'Семей': ['Университет им. Шакарима'],
  'Актобе': ['Актюбинский региональный университет им. К. Жубанова', 'Западно-Казахстанский медицинский университет им. М. Оспанова'],
  'Атырау': ['Атырауский университет нефти и газа им. С. Утебаева'],
  'Актау': ['Каспийский университет технологий и инжиниринга им. Ш. Есенова'],
  'Уральск': ['Западно-Казахстанский университет им. М. Утемисова'],
  'Кокшетау': ['Кокшетауский университет им. Ш. Уалиханова'],
  'Талдыкорган': ['Жетысуский университет им. И. Жансугурова'],
  'Петропавловск': ['Северо-Казахстанский университет им. М. Козыбаева'],
  'Жезказган': ['Жезказганский университет им. О. А. Байконурова']
};

function fillUniversities(citySelect, universitySelect, preferred) {
  const universities = universitiesByCity[citySelect.value] || ['Вузы для города не добавлены'];
  universitySelect.innerHTML = universities.map(name => `<option value="${name}">${name}</option>`).join('');
  if (preferred && universities.includes(preferred)) universitySelect.value = preferred;
}

function configureLocationSelectors() {
  const savedCity = document.querySelector('#city').value;
  const savedProfileCity = document.querySelector('#profileCity').value;
  [document.querySelector('#city'), document.querySelector('#profileCity')].forEach(select => {
    select.innerHTML = kazakhstanCities.map(city => `<option value="${city}">${city}</option>`).join('');
  });
  setSelectValue('#city', savedCity);
  setSelectValue('#profileCity', savedProfileCity);
  fillUniversities(document.querySelector('#city'), document.querySelector('#university'));
  fillUniversities(document.querySelector('#profileCity'), document.querySelector('#profileUniversity'));
  document.querySelector('#city').addEventListener('change', event => fillUniversities(event.currentTarget, document.querySelector('#university')));
  document.querySelector('#profileCity').addEventListener('change', event => fillUniversities(event.currentTarget, document.querySelector('#profileUniversity')));
}

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

configureLocationSelectors();
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
