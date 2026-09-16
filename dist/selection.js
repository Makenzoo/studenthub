const selectionCity = document.querySelector('#city');
const selectionSpecialty = document.querySelector('#specialty');
const filterResult = document.querySelector('#filterResult');

function refreshSelectionText() {
  filterResult.textContent = `Подбираем возможности для студентов ${selectionSpecialty.value} в городе ${selectionCity.value}`;
}

selectionCity.addEventListener('change', refreshSelectionText);
selectionSpecialty.addEventListener('change', refreshSelectionText);
