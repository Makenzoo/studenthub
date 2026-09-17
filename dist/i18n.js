(() => {
  const kz = {
    navOpportunities: 'Мүмкіндіктер', navFeed: 'Топтамалар', navCommunity: 'Қауымдастық', eyebrow: 'ҚАЗАҚСТАН СТУДЕНТТЕРІНЕ АРНАЛҒАН ПЛАТФОРМА',
    title: 'Студенттік өмірге қажеттінің бәрі — <em>бір жерде.</em>', intro: 'Оқу, алғашқы жұмыс, баспана, гранттар мен іс-шаралар — өзіңізге керегін табыңыз.',
    find: 'Өзіңізге табу <span>→</span>', howItWorks: 'Қалай жұмыс істейді', today: 'Бүгін сіз үшін', welcome: 'Қош келдіңіз, Данияр',
    complete: 'Профильді 70% толтырыңыз', closest: 'Жақын іс-шара', eventTitle: 'TECH DISCOVERY', sep: 'қыркүйек · Түркістан', newForYou: 'Сізге арналған жаңа',
    personal: 'ЖЕКЕ ҰСЫНЫСТАР', finderTitle: 'Өзіңіздің StudentHub-ыңызды құрыңыз', cityLabel: 'Қала', universityLabel: 'Университет', specialtyLabel: 'Бағыт', show: 'Көрсету',
    everything: 'БӘРІ ОСЫНДА', opportunitiesTitle: 'Өз жолыңызды таңдаңыз', allSections: 'Барлық бөлімдер <span>→</span>', study: 'Оқу', studyText: 'Конспектілер, курстар, материалдар және репетиторлар.',
    materials: 'материал', jobs: 'Жұмыс', jobsText: 'Алғашқы тәжірибеге арналған вакансиялар мен тағылымдамалар.', vacancies: 'вакансия', housing: 'Тұрғын үй', housingText: 'Жатақхана, бөлмелер және көрші іздеу.',
    listings: 'хабарландыру', events: 'Іс-шаралар', eventsText: 'Хакатондар, олимпиадалар және конференциялар.', thisMonth: 'осы айда', grants: 'Гранттар', grantsText: 'Стипендиялар, бағдарламалар және дедлайндар.',
    open: 'ашық', market: 'Айырбас', marketText: 'Студенттерден кітаптар, техника және заттар.', offers: 'ұсыныс', now: 'ҚАЗІР', feedTitle: 'Сізге арналған жаңа мүмкіндіктер',
    filters: 'Сүзгілер', tabJobs: 'Вакансиялар', tabEvents: 'Оқиғалар', tabGrants: 'Гранттар', tabHousing: 'Тұрғын үй', communityLabel: 'ҚАУЫМДАСТЫҚ',
    communityTitle: 'Мәселелерді бірге шешіңіз', communityText: 'Осы жолдан өткендерге сұрақ қойыңыз. Тәжірибе алмасыңыз және өз ортаңызды табыңыз.', communityAction: 'Қауымдастықты ашу <span>→</span>',
    question: '«2-курстан кейін жақсы тағылымдаманы қайдан табуға болады?»', online: 'қазір желіде', answers: 'жауап', newReplies: 'жаңа', footer: 'Қазақстан студенттері үшін жасалған',
  };
  const labels = {
    ru: { signIn: 'Войти', registered: 'зарегистрированных пользователей', source: 'Данные проверены 16 сентября 2026 года. Карточки ведут на официальные страницы и живые каталоги.', job: 'Стажировки на hh.kz', jobNote: 'Актуальные объявления', profile: 'Настройте свой профиль', profileNote: 'Это поможет показывать подходящие возможности.', name: 'Ваше имя', course: 'Курс', interests: 'Что вам интересно', save: 'Сохранить профиль →', login: 'Войти в StudentHub KZ', loginNote: 'Введите email и пароль, чтобы продолжить.', password: 'Пароль', assistant: 'AI Ассистент', assistantTitle: 'Чем помочь?', assistantNote: 'Онлайн · ответы не сохраняются', assistantGreeting: 'Помогу найти стажировку, грант, жильё, мероприятие или учебные материалы. С чего начнём?', placeholder: 'Напишите вопрос…', filterTitle: 'Фильтры возможностей', filterNote: 'Настройте список под свою задачу.', reset: 'Сбросить' },
    kz: { signIn: 'Кіру', registered: 'тіркелген пайдаланушы', source: 'Деректер 2026 жылғы 16 қыркүйекте тексерілді. Карточкалар ресми беттер мен белсенді каталогтарға апарады.', job: 'hh.kz тағылымдамалары', jobNote: 'Өзекті хабарландырулар', profile: 'Профильді баптаңыз', profileNote: 'Бұл сізге лайық мүмкіндіктерді көрсетуге көмектеседі.', name: 'Атыңыз', course: 'Курс', interests: 'Сізді не қызықтырады', save: 'Профильді сақтау →', login: 'StudentHub KZ жүйесіне кіру', loginNote: 'Жалғастыру үшін email және құпиясөзді енгізіңіз.', password: 'Құпиясөз', assistant: 'AI Көмекші', assistantTitle: 'Қалай көмектесейін?', assistantNote: 'Желіде · жауаптар сақталмайды', assistantGreeting: 'Тағылымдаманы, грантты, баспананы, іс-шараны немесе оқу материалдарын табуға көмектесемін. Неден бастаймыз?', placeholder: 'Сұрағыңызды жазыңыз…', filterTitle: 'Мүмкіндіктер сүзгілері', filterNote: 'Тізімді мақсатыңызға сай баптаңыз.', reset: 'Тазарту' },
  };
  const translatedCards = {
    jobs: [['◈','Тағылымдама және практика','hh.kz','Студенттерге арналған вакансияларды белсенді іздеу','Каталогты ашу','#b49fff','https://hh.kz/search/vacancy?text=%D1%81%D1%82%D0%B0%D0%B6%D0%B5%D1%80'],['</>','IT вакансиялары','Astana Hub','Технопарк компанияларының вакансиялары','Каталогты ашу','#65d9ff','https://astanahub.com/ru/vacancy/'],['✦','Студенттерге жұмыс','Enbek.kz','Ұлттық еңбек биржасы','Іздеуді ашу','#ff9ec4','https://www.enbek.kz/ru/search/vacancy']],
    events: [['✦','TECH DISCOVERY','16 қыркүйек, 11:00','Turkistan Hub · IT бағыттары','Astana Hub тіркелу','#65d9ff','https://astanahub.com/ru/event/'],['◉','AI Agentic Skills','16 қыркүйек, 10:00','Павлодар · Торайғыров университеті','Astana Hub тіркелу','#b49fff','https://astanahub.com/ru/event/'],['◈','CodeMasters Hackathon 7.0','2026 жылғы 15–22 қыркүйек','Өскемен · жүлде қоры 1 млн ₸','Astana Hub тіркелу','#85e0b1','https://astanahub.com/ru/event/']],
    grants: [['₸','Мемлекеттік гранттар 2026–2027','ҚР ҒЖБМ','Конкурс нәтижелері жарияланды','Ақпаратты тексеру','#b49fff','https://www.gov.kz/memleket/entities/sci/press/news/details/1270585?lang=ru'],['★','Болашақ 2026','16 қазанға дейін','Құжаттарды eGov.kz арқылы қабылдау','Шарттарды білу','#65d9ff','https://www.gov.kz/memleket/entities/sci/press/news/details/1182110?lang=ru'],['✦','Студенттерге арналған Erasmus+','университеттің халықаралық кеңсесі арқылы','Шетелдегі алмасу және тағылымдамалар','Тәртібін білу','#85e0b1','https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/studying-abroad']],
    housing: [['⌂','Жалға берілетін бөлмелер','Krisha.kz','Қазақстан бойынша белсенді хабарландырулар','Каталогты ашу','#ff9ec4','https://krisha.kz/arenda/komnaty/'],['⌂','Тұрғын үйді жалға алу','Krisha.kz','Қала бойынша пәтерлер мен бөлмелерді іздеу','Каталогты ашу','#65d9ff','https://krisha.kz/arenda/'],['⌂','Университет жатақханасы','Қабылдау комиссиясы','Орындар мен қоныстану ережелерін нақтылаңыз','Университетті табу','#85e0b1','https://www.gov.kz/memleket/entities/sci?lang=ru']],
  };
  const language = () => document.documentElement.lang === 'kz' ? 'kz' : 'ru';
  const set = (selector, value, html = false) => document.querySelectorAll(selector).forEach((node) => { if (html) node.innerHTML = value; else node.textContent = value; });
  const setLeadingLabel = (selector, value) => document.querySelectorAll(selector).forEach((node) => { if (node.childNodes[0]?.nodeType === Node.TEXT_NODE) node.childNodes[0].nodeValue = value; });
  const updateFinder = () => {
    const city = document.querySelector('#city')?.value || '';
    const specialty = document.querySelector('#specialty')?.selectedOptions[0]?.textContent || '';
    const result = document.querySelector('#filterResult');
    if (result) result.textContent = language() === 'kz' ? `${city} қаласындағы ${specialty} студенттеріне арналған мүмкіндіктерді көрсетеміз` : `Подбираем возможности для студентов ${specialty} в городе ${city}`;
  };
  const renderKzCards = () => {
    if (language() !== 'kz') return;
    const tab = document.querySelector('.feed-tabs .active')?.dataset.tab || 'jobs';
    const grid = document.querySelector('#listingGrid');
    if (!grid || !translatedCards[tab]) return;
    const tag = { jobs: 'каталог', events: 'қазір', grants: 'тексерілген', housing: 'белсенді деректер' }[tab];
    grid.innerHTML = translatedCards[tab].map((item) => `<a class="listing" href="${item[6]}" target="_blank" rel="noopener noreferrer"><div class="listing-top"><div class="listing-icon" style="background:${item[5]}20;color:${item[5]}">${item[0]}</div><span class="listing-tag">${tag}</span></div><h3>${item[1]}</h3><p>${item[2]}<br>${item[3]}</p><div class="listing-bottom"><b>${item[4]}</b><span>Ашу →</span></div></a>`).join('');
  };
  const update = () => {
    const isKz = language() === 'kz';
    document.title = isKz ? 'StudentHub KZ — студенттік өмірге қажеттінің бәрі' : 'StudentHub KZ — всё для студенческой жизни';
    document.querySelectorAll('[data-i18n]').forEach((node) => { const value = isKz ? kz[node.dataset.i18n] : null; if (value) node.innerHTML = value; });
    const l = labels[language()];
    set('#profileTrigger span:last-child', l.signIn); set('#registeredUsersLabel', l.registered); set('.source-note', l.source);
    set('.mini-card.job strong', l.job); set('.mini-card.job small:not([data-i18n])', l.jobNote);
    set('.profile-panel:not(.login-panel):not(.filter-panel) h2', l.profile); set('.profile-panel:not(.login-panel):not(.filter-panel) .profile-panel-head p:not(.section-label)', l.profileNote);
    setLeadingLabel('#profileForm label:nth-child(1)', l.name); setLeadingLabel('#profileForm label:nth-child(5)', l.course); set('#profileForm legend', l.interests); set('#profileForm .profile-save button', l.save);
    set('#loginTitle', l.login); set('#authSubtitle', l.loginNote); setLeadingLabel('#loginForm label:nth-child(3)', l.password);
    set('#feedFilterTitle', l.filterTitle); set('#feedFilterTitle + p', l.filterNote); set('#resetFeedFilters', l.reset);
    set('#aiAssistantTrigger span:last-child', l.assistant); set('#aiAssistantTitle', l.assistantTitle); set('.ai-head p:not(.section-label)', l.assistantNote); set('#aiMessages .ai-message-bot:first-child p', l.assistantGreeting);
    const input = document.querySelector('#aiAssistantInput'); if (input) input.placeholder = l.placeholder;
    document.querySelectorAll('#specialty option, #profileSpecialty option').forEach((option) => { const map = { 'IT и технологии': isKz ? 'IT және технологиялар' : 'IT и технологии', 'Бизнес и экономика': isKz ? 'Бизнес және экономика' : 'Бизнес и экономика', 'Дизайн': 'Дизайн', 'Педагогика': 'Педагогика', 'Право': isKz ? 'Құқық' : 'Право' }; option.textContent = map[option.value] || option.value; });
    updateFinder();
    if (isKz) renderKzCards();
    else document.querySelector('.feed-tabs .active')?.click();
  };
  window.studentHubI18n = { get language() { return language(); }, update };
  document.querySelector('.lang-toggle')?.addEventListener('click', () => window.setTimeout(() => { update(); document.dispatchEvent(new CustomEvent('studenthub:languagechange', { detail: { language: language() } })); }));
  document.querySelector('#city')?.addEventListener('change', () => window.setTimeout(updateFinder));
  document.querySelector('#specialty')?.addEventListener('change', () => window.setTimeout(updateFinder));
  document.querySelectorAll('.feed-tabs button').forEach((button) => button.addEventListener('click', () => window.setTimeout(renderKzCards)));
  update();
})();
