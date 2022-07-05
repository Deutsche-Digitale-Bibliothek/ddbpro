const filterAccordionOpenClass = 'filters-accordion--open';
let accordionButtons = document.querySelectorAll('.filters-header__button');
let accordions = document.querySelectorAll('.filters-accordion');

let lastModifiedCheckbox = null;
let lastUsedInputType = null; // 0 = keyboard, 1 = mouse

const initFilterAccordions = () => {
  // Add event listeners for tracking user input.
  document.addEventListener('keypress', (_) => {
    lastUsedInputType = 0;
  });
  document.addEventListener('mousedown', (_) => {
    lastUsedInputType = 1;
  });
  // Add event listeners to accordion buttons.
  accordionButtons.forEach((button) => {
    const elSelector = button.getAttribute('aria-controls');
    const el = document.querySelector(`#${elSelector}`);

    if (el) {
      // Expand/collapse event listener.
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = el.classList.contains(filterAccordionOpenClass);

        if (isOpen) {
          close(button, el);
        } else {
          // Close any open accordions before expanding the active one.
          accordions.forEach((item) => {
            const btn = document.querySelector(`[aria-controls=${item.id}]`);
            close(btn, item);
          });
          open(button, el, e);
        }
      });

      // Update filter count.
      handleFilterCount(button, el);

      // Event listener for checkbox items.
      const checkboxes = el.querySelectorAll('input[type=checkbox]');
      checkboxes.forEach((item) => {
        item.addEventListener('change', ({ target }) => {
          lastModifiedCheckbox = target.id;
        });
      });
    }
  });
};

// Collapse accordion.
const close = (btn, el) => {
  btn.setAttribute('aria-expanded', false);
  el.classList.remove(filterAccordionOpenClass);
  el.setAttribute('aria-hidden', true);
  el.style.maxHeight = '0px';

  const checkboxes = el.querySelectorAll('input[type=checkbox]');
  checkboxes.forEach((item) => item.setAttribute('tabindex', -1));
  accordionButtons.forEach((button) => button.classList.remove('filters-header__button--inactive'));
};

// Expand accordion.
const open = (btn, el, event) => {
  btn.setAttribute('aria-expanded', true);
  el.classList.add(filterAccordionOpenClass);
  el.setAttribute('aria-hidden', false);
  el.style.maxHeight = `${el.scrollHeight}px`;

  const checkboxes = el.querySelectorAll('input[type=checkbox]');
  // Only focus first checkbox when opened by keyboard (tab).
  // event.detail is always 0 when emitted by keyboard interaction.
  if (checkboxes.length && (!event || event.detail === 0)) {
    checkboxes[0].focus();
  }

  checkboxes.forEach((item) => item.setAttribute('tabindex', 0));
  accordionButtons.forEach((button) => button.classList.add('filters-header__button--inactive'));
  btn.classList.remove('filters-header__button--inactive');
};

// Display amount of selected checkboxes for the filter.
const handleFilterCount = (btn, el) => {
  const checkboxes = [...el.querySelectorAll('input[type=checkbox]')];
  const countEl = btn.querySelector('.count');
  const count = checkboxes.filter((a) => a.checked).length;

  countEl.innerHTML = count > 0 ? count : '';
  count > 0
      ? btn.classList.add('filters-header__button--selected')
      : btn.classList.remove('filters-header__button--selected');
};

(($) => {
  if (accordionButtons.length) {
    initFilterAccordions();
  }
  // Hook into AJAX callback every time new content is loaded on page.
  $(document).ajaxComplete(function (event, xhr, settings) {
    if (!settings.extraData) return;

    const filterableViews = ['aggregators', 'latest_events', 'past_events', 'team', 'documents', 'search'];
    const currentView = settings.extraData.view_name;

    if (filterableViews.includes(currentView)) {
      // Update DOM node lists after AJAX has loaded the new markup.
      accordionButtons = document.querySelectorAll('.filters-header__button');
      accordions = document.querySelectorAll('.filters-accordion');
      // Re-initialize accordions.
      initFilterAccordions();

      // Get last modified checkbox element.
      const checkbox = document.querySelector(`*[id^=${lastModifiedCheckbox.split('--')[0]}]`);
      if (checkbox) {
        // Find the accordion with the parent accordion.
        const accordion = checkbox.closest('.filters-accordion');
        // Then find its header.
        const btn = document.querySelector(`*[aria-controls^=${accordion.id.split('--')[0]}]`);

        // Open accordion containing last modified checkbox.
        open(btn, accordion, accordionButtons);

        const checkboxes = [...accordion.querySelectorAll('input[type=checkbox]')];
        // Grey out checkboxes only if any of them are checked.
        if (checkboxes.some(item => item.checked)) {
          checkboxes.forEach((checkbox) => checkbox.nextElementSibling.classList.add('option--other-selected'));
        }
        // If the last modified checkbox is checked, remove greyed out look from its label.
        if (checkbox.checked) {
          checkbox.nextElementSibling.classList.remove('option--other-selected');
        }

        // Focus last modified checkbox only when user modified it by keyboard.
        if (lastUsedInputType === 0) {
          checkbox.focus();
        } else {
          document.activeElement.blur();
        }
      }
    }
  });

})(jQuery);
