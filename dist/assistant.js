const assistantDialog = document.querySelector('#aiAssistantDialog');
const assistantTrigger = document.querySelector('#aiAssistantTrigger');
const assistantForm = document.querySelector('#aiAssistantForm');
const assistantInput = document.querySelector('#aiAssistantInput');
const assistantMessages = document.querySelector('#aiMessages');

const assistantTopics = [
  { words: ['стаж', 'работ', 'ваканс', 'резюме'], text: 'Для первого опыта посмотрите стажировки и вакансии для студентов. Укажите город и направление в подборке, чтобы сузить поиск.', link: 'jobs.html', label: 'Открыть вакансии' },
  { words: ['грант', 'стипенд', 'финанс', 'дедлайн'], text: 'В разделе грантов собраны стипендии, программы и дедлайны. Перед подачей проверьте требования и список документов.', link: 'grants.html', label: 'Открыть гранты' },
  { words: ['жиль', 'общежит', 'комнат', 'сосед', 'аренд'], text: 'В разделе жилья можно посмотреть общежития, комнаты и объявления о совместной аренде.', link: 'housing.html', label: 'Открыть жильё' },
  { words: ['меропр', 'хакат', 'олимпиад', 'конферен', 'событ'], text: 'Откройте мероприятия, чтобы выбрать хакатоны, олимпиады и конференции. Смотрите даты и формат участия.', link: 'events.html', label: 'Открыть события' },
  { words: ['учёб', 'учеб', 'конспект', 'курс', 'материал', 'репетитор'], text: 'В разделе учёбы доступны конспекты, курсы, учебные материалы и поиск репетитора.', link: 'study.html', label: 'Открыть учёбу' },
  { words: ['универс', 'город', 'направлен', 'специальност'], text: 'Выберите город, университет и направление в персональной подборке на главной. После этого сайт покажет более подходящие варианты.', link: '#finder', label: 'Настроить подборку' }
];

function appendMessage(role, text, link) {
  const message = document.createElement('article');
  message.className = `ai-message ai-message-${role}`;
  const sender = document.createElement('b');
  sender.textContent = role === 'user' ? 'Вы' : 'StudentHub AI';
  const content = document.createElement('p');
  content.textContent = text;
  message.append(sender, content);
  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link.link;
    anchor.textContent = `${link.label} →`;
    message.append(anchor);
  }
  assistantMessages.append(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function respond(question) {
  appendMessage('user', question);
  const normalized = question.toLowerCase();
  const topic = assistantTopics.find((item) => item.words.some((word) => normalized.includes(word)));
  if (topic) {
    appendMessage('bot', topic.text, topic);
    return;
  }
  const city = document.querySelector('#city')?.value || 'вашем городе';
  appendMessage('bot', `Я помогу с учебой, работой, жильём, грантами и событиями. Сейчас для вас выбран город ${city}. Попробуйте спросить, например: «Найди стажировку» или «Какие есть гранты?»`);
}

function openAssistant() {
  assistantDialog.hidden = false;
  document.body.style.overflow = 'hidden';
  assistantInput.focus();
}

function closeAssistant() {
  assistantDialog.hidden = true;
  document.body.style.overflow = '';
}

assistantTrigger.addEventListener('click', openAssistant);
assistantDialog.querySelectorAll('[data-close-ai]').forEach((button) => button.addEventListener('click', closeAssistant));
assistantDialog.querySelectorAll('[data-ai-prompt]').forEach((button) => button.addEventListener('click', () => respond(button.dataset.aiPrompt)));
assistantForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = assistantInput.value.trim();
  if (!question) return;
  respond(question);
  assistantInput.value = '';
});
assistantInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    assistantForm.requestSubmit();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !assistantDialog.hidden) closeAssistant();
});
