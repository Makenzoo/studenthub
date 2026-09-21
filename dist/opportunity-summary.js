const summaryCards = document.querySelectorAll('[data-summary-type]');

function humanDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date);
}

async function loadOpportunitySummary() {
  if (!summaryCards.length) return;
  try {
    const response = await fetch('/api/home-summary');
    if (!response.ok) throw new Error('Summary unavailable');
    const { items } = await response.json();
    summaryCards.forEach((card) => {
      const item = items?.[card.dataset.summaryType];
      const summary = card.querySelector('.live-summary');
      if (!summary || !item) return;
      if (!item.count) {
        summary.textContent = 'Новые записи появятся после проверки';
        return;
      }
      const label = card.dataset.summaryType === 'jobs' ? 'проверенных вакансий' : card.dataset.summaryType === 'grants' ? 'актуальных программ' : 'проверенных объявлений';
      const checked = humanDate(item.checkedAt);
      summary.textContent = checked ? `${item.count} ${label} · обновлено ${checked}` : `${item.count} ${label}`;
    });
  } catch {
    summaryCards.forEach((card) => {
      const summary = card.querySelector('.live-summary');
      if (summary) summary.textContent = 'Откройте раздел, чтобы посмотреть каталог';
    });
  }
}

loadOpportunitySummary();
