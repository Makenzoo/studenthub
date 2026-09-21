const assistantDialog = document.querySelector('#aiAssistantDialog');
const assistantTrigger = document.querySelector('#aiAssistantTrigger');
const assistantForm = document.querySelector('#aiAssistantForm');
const assistantInput = document.querySelector('#aiAssistantInput');
const assistantMessages = document.querySelector('#aiMessages');
const assistantStatus = document.querySelector('#aiStatus');
const assistantHistory = [];

function scrollMessages() {
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function appendMessage(role, content, action) {
  const message = document.createElement('article');
  message.className = `ai-message ai-message-${role}`;
  const sender = document.createElement('b');
  sender.textContent = role === 'user' ? 'Вы' : 'StudentHub AI';
  const text = document.createElement('p');
  text.textContent = content;
  message.append(sender, text);
  if (action?.href && action?.label) {
    const link = document.createElement('a');
    link.href = action.href;
    link.textContent = `${action.label} →`;
    message.append(link);
  }
  assistantMessages.append(message);
  scrollMessages();
}

function setTyping(visible) {
  let indicator = assistantMessages.querySelector('.ai-typing');
  if (!visible) return indicator?.remove();
  if (indicator) return;
  indicator = document.createElement('div');
  indicator.className = 'ai-typing';
  indicator.setAttribute('aria-label', 'Ассистент печатает');
  indicator.innerHTML = '<i></i><i></i><i></i>';
  assistantMessages.append(indicator);
  scrollMessages();
}

function setBusy(busy) {
  assistantInput.disabled = busy;
  assistantForm.querySelector('button').disabled = busy;
  if (busy) assistantStatus.innerHTML = '<span class="ai-online">●</span> Подбираю ответ…';
}

async function respond(question) {
  appendMessage('user', question);
  assistantHistory.push({ role: 'user', content: question });
  setBusy(true);
  setTyping(true);
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: assistantHistory.slice(-8) }),
    });
    if (!response.ok) throw new Error('Assistant unavailable');
    const answer = await response.json();
    appendMessage('bot', answer.reply, answer.action);
    assistantHistory.push({ role: 'assistant', content: answer.reply });
    assistantStatus.innerHTML = `<span class="ai-online">●</span> ${answer.mode === 'ai' ? 'AI-помощник в диалоге' : 'Помощник по разделам StudentHub'}`;
  } catch {
    const fallback = 'Сейчас не удалось связаться с помощником. Попробуйте ещё раз или откройте нужный раздел — там есть проверенные источники.';
    appendMessage('bot', fallback);
    assistantHistory.push({ role: 'assistant', content: fallback });
    assistantStatus.innerHTML = '<span class="ai-online">●</span> Доступна навигация по разделам';
  } finally {
    setTyping(false);
    setBusy(false);
    assistantInput.focus();
  }
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
  if (!question || assistantInput.disabled) return;
  assistantInput.value = '';
  assistantInput.style.height = '';
  respond(question);
});
assistantInput.addEventListener('input', () => {
  assistantInput.style.height = '';
  assistantInput.style.height = `${Math.min(assistantInput.scrollHeight, 100)}px`;
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
