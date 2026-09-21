const topics = {
  internship: {
    title: 'Где найти хорошую стажировку после 2 курса?',
    category: 'STUDENT TALKS',
    meta: '24 ответа · 67 реакций',
    replies: [
      { author: 'Айгерим · 3 курс', text: 'Проверь карьерный центр вуза и сайты компаний. На стажировку лучше откликаться с коротким резюме и несколькими учебными проектами.' },
      { author: 'Руслан · выпускник', text: 'Я начинал с хакатонов и открытых дней компаний: после них проще понять, какие команды действительно берут студентов.' },
    ],
  },
  housing: {
    title: 'Кто ищет соседа для аренды в Алматы?',
    category: 'ЖИЛЬЁ',
    meta: '12 ответов · 31 реакция',
    replies: [
      { author: 'Сания · 2 курс', text: 'При поиске обязательно обсудите бюджет, район, график и правила квартиры до заселения.' },
      { author: 'Дамир · 4 курс', text: 'Не переводите предоплату до просмотра квартиры и проверки договора или контакта владельца.' },
    ],
  },
  erasmus: {
    title: 'Как подготовиться к Erasmus+?',
    category: 'ОБМЕН',
    meta: '18 ответов · 44 реакции',
    replies: [
      { author: 'Мадина · 3 курс', text: 'Начните с международного отдела своего вуза: там уточнят партнёрские университеты и внутренний дедлайн.' },
      { author: 'Арман · магистратура', text: 'Заранее подготовьте выписку оценок, языковой сертификат и черновик мотивационного письма.' },
    ],
  },
};

const topicList = document.querySelector('#topics');
const dialog = document.querySelector('#topicDialog');
const dialogTitle = document.querySelector('#topicDialogTitle');
const dialogCategory = document.querySelector('#topicDialogCategory');
const dialogMeta = document.querySelector('#topicDialogMeta');
const repliesRoot = document.querySelector('#topicReplies');
const replyForm = document.querySelector('#replyForm');
const replyInput = document.querySelector('#replyInput');
let activeTopic = null;

function renderReplies() {
  const topic = topics[activeTopic];
  repliesRoot.replaceChildren();
  topic.replies.forEach((reply) => {
    const article = document.createElement('article');
    article.className = 'reply';
    const author = document.createElement('b');
    author.textContent = reply.author;
    const text = document.createElement('p');
    text.textContent = reply.text;
    article.append(author, text);
    repliesRoot.append(article);
  });
}

function openTopic(id) {
  const topic = topics[id];
  if (!topic) return;
  activeTopic = id;
  dialogCategory.textContent = topic.category;
  dialogTitle.textContent = topic.title;
  dialogMeta.textContent = topic.meta;
  renderReplies();
  dialog.hidden = false;
  document.body.style.overflow = 'hidden';
  replyInput.focus();
}

function closeTopic() {
  dialog.hidden = true;
  document.body.style.overflow = '';
}

topicList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-topic]');
  if (button) openTopic(button.dataset.topic);
});

document.querySelector('#discussionForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#discussionInput');
  const title = input.value.trim();
  if (!title) return;
  const id = `topic-${Date.now()}`;
  topics[id] = { title, category: 'STUDENT TALKS', meta: 'Новая тема · 0 ответов', replies: [] };
  const button = document.createElement('button');
  button.className = 'topic';
  button.type = 'button';
  button.dataset.topic = id;
  const heading = document.createElement('b');
  heading.textContent = title;
  const meta = document.createElement('p');
  meta.textContent = 'Новая тема · 0 ответов · Student Talks';
  button.append(heading, meta);
  topicList.prepend(button);
  input.value = '';
  openTopic(id);
});

replyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = replyInput.value.trim();
  if (!text || !activeTopic) return;
  topics[activeTopic].replies.push({ author: 'Вы · только что', text });
  const total = topics[activeTopic].replies.length;
  topics[activeTopic].meta = `${total} ${total === 1 ? 'ответ' : 'ответов'} · обсуждение активно`;
  dialogMeta.textContent = topics[activeTopic].meta;
  replyInput.value = '';
  renderReplies();
});

dialog.querySelectorAll('[data-close-topic]').forEach((button) => button.addEventListener('click', closeTopic));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !dialog.hidden) closeTopic();
});
