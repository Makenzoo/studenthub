(() => {
  const key = 'studenthub.plan.v1';
  const steps = [...document.querySelectorAll('[data-plan-step]')];
  const progress = document.querySelector('#planProgressValue');
  const bar = document.querySelector('#planProgressBar');
  const saved = new Set(JSON.parse(localStorage.getItem(key) || '[]'));

  function update() {
    const completed = steps.filter((step) => step.checked).map((step) => step.dataset.planStep);
    localStorage.setItem(key, JSON.stringify(completed));
    progress.textContent = `${completed.length}/${steps.length}`;
    bar.style.width = `${(completed.length / steps.length) * 100}%`;
  }

  steps.forEach((step) => {
    step.checked = saved.has(step.dataset.planStep);
    step.addEventListener('change', update);
  });
  update();
})();
