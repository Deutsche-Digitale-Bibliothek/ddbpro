const fadeScroll = () => {
  const filters = document.querySelector('.view-ddb-glossary__filters');
  const container = document.querySelector('.view-ddb-glossary__filters-container');

  if (!filters) return;

  filters.addEventListener('scroll', () => {
    if (filters.scrollLeft === 0) {
      container.classList.add('scroll--start');
      container.classList.remove('scroll--end');
    } else {
      if (filters.offsetWidth + filters.scrollLeft === filters.scrollWidth) {
        container.classList.add('scroll--end');
        container.classList.remove('scroll--start');
      } else {
        container.classList.add('scroll--end', 'scroll--start');
      }
    }
  });
};

const scrollToActive = () => {
  const letter = document.querySelector('.view-ddb-glossary__filter-link--active');

  // scroll to active element
  if (letter) {
    letter.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
};

(() => {
  fadeScroll();
  scrollToActive();
})();
