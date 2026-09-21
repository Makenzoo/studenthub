const notificationsDialog = document.querySelector('#notificationsDialog');
const notificationsTrigger = document.querySelector('#notificationsTrigger');
const notificationsList = document.querySelector('#notificationsList');
const notificationsBadge = document.querySelector('#notificationsBadge');

function clearNotifications() {
  notificationsList.replaceChildren();
}

function addEmptyNotification(text, href, label) {
  const message = document.createElement('p');
  message.className = 'notification-empty';
  message.textContent = text;
  notificationsList.append(message);
  if (href && label) {
    const link = document.createElement('a');
    link.className = 'notification-action';
    link.href = href;
    link.textContent = label;
    if (href === '#profileDialog') {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        closeNotifications();
        const profileDialog = document.querySelector('#profileDialog');
        profileDialog.hidden = false;
        document.body.style.overflow = 'hidden';
        document.querySelector('#profileName').focus();
      });
    }
    notificationsList.append(link);
  }
}

function dateLabel(value) {
  if (!value) return 'скоро';
  const target = new Date(`${value}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const days = Math.round((target - now) / 86400000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  if (days > 1 && days <= 3) return `через ${days} дня`;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(target);
}

function renderNotification(item) {
  const card = document.createElement('a');
  card.className = `notification-card notification-${item.kind}`;
  card.href = item.href;
  const icon = document.createElement('span');
  icon.className = 'notification-mark';
  icon.textContent = item.kind === 'deadline' ? '!' : '✦';
  const copy = document.createElement('span');
  const title = document.createElement('b');
  title.textContent = item.kind === 'deadline' ? `Дедлайн ${dateLabel(item.deadline)}` : 'Появился грант по вашему направлению';
  const description = document.createElement('small');
  description.textContent = item.title;
  copy.append(title, description);
  card.append(icon, copy);
  notificationsList.append(card);
}

async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications');
    if (!response.ok) throw new Error('notifications unavailable');
    const data = await response.json();
    clearNotifications();
    if (data.loginRequired) addEmptyNotification('Войдите, чтобы получать уведомления по вашему профилю.', 'index.html?login=1', 'Войти в StudentHub →');
    else if (!data.profileReady) addEmptyNotification('Укажите направление в профиле — тогда мы покажем подходящие гранты и дедлайны.', '#profileDialog', 'Настроить профиль →');
    else if (!data.items.length) addEmptyNotification('Сейчас нет новых грантов или дедлайнов в ближайшие 3 дня. Мы проверим их снова при следующем визите.');
    else data.items.forEach(renderNotification);
    notificationsBadge.hidden = !data.items?.length;
    notificationsBadge.textContent = String(data.items?.length || 0);
  } catch {
    clearNotifications();
    addEmptyNotification('Не удалось загрузить уведомления. Попробуйте ещё раз через несколько секунд.');
  }
}

function openNotifications() {
  notificationsDialog.hidden = false;
  document.body.style.overflow = 'hidden';
  loadNotifications();
}

function closeNotifications() {
  notificationsDialog.hidden = true;
  document.body.style.overflow = '';
}

notificationsTrigger.addEventListener('click', openNotifications);
notificationsDialog.querySelectorAll('[data-close-notifications]').forEach((button) => button.addEventListener('click', closeNotifications));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !notificationsDialog.hidden) closeNotifications();
});
loadNotifications();
