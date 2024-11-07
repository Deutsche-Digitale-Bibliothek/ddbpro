const accordionWrapper = [...document.querySelectorAll('.accordion-wrapper')];
const openAll = [...document.querySelectorAll('.accordion__open-all:not(.accordions__expand-all)')];
const expandAll = document.querySelector('.accordions__expand-all');
const allAccordions = [...document.querySelectorAll('.accordion')];

const accordionHeader = '.accordion__header';
const accordionContent = '.accordion__content';
const accordionOpenClass = 'accordion--open';
const accordionTopOpen = 'accordion__open-all--open';
const accordionsExpandAll = 'accordions__expand-all--open';

export const initAccordion = (wrapper = accordionWrapper) => {
  wrapper.forEach((item) => {
    const accordions = [...item.querySelectorAll('.accordion')];

    accordions.forEach((accordion) => {
      const heading = accordion.querySelector('.accordion__header');
      const content = accordion.querySelector('.accordion__content');

      setAccordionContentFocusable(content, false);

      heading.addEventListener('click', () => {
        toggleAccordion(accordion);
      });
    });
  });
  if (expandAll !== null) {
    expandAll.setAttribute("aria-expanded", "false");
  }
};

const openAccordion = (accordion) => {
  const header = accordion.querySelector(accordionHeader);
  const content = accordion.querySelector(accordionContent);

  accordion.classList.add(accordionOpenClass);
  header.setAttribute('aria-expanded', true);
  content.setAttribute('aria-hidden', false);

  setAccordionContentFocusable(content, true);

  content.style.maxHeight = `${content.scrollHeight}px`;
};

const closeAccordion = (accordion) => {
  const header = accordion.querySelector(accordionHeader);
  const content = accordion.querySelector(accordionContent);

  accordion.classList.remove(accordionOpenClass);
  header.setAttribute('aria-expanded', false);
  content.setAttribute('aria-hidden', true);

  setAccordionContentFocusable(content, false);

  content.style.maxHeight = `0px`;
};

const toggleAccordion = (accordion, open) => {
  const isOpen = accordion.classList.contains(accordionOpenClass);

  if(open === undefined && !isOpen) {
    openAccordion(accordion);
  } else if(open === undefined && isOpen) {
    closeAccordion(accordion);
  } else if(!open && !isOpen) {
    openAccordion(accordion);
  } else if(open && isOpen) {
    closeAccordion(accordion);
  }
};

const toggleAll = (event) => {
  event.preventDefault();
  const target = event.target;
  const openAllWrapper = target.closest('.accordion__open-all');
  const accordions = [...target.closest('.accordion-wrapper').querySelectorAll('.accordion')];

  const shouldOpen = !target.classList.contains('accordion__open-all--open');

  if (shouldOpen) {
    accordions.forEach((accordion) => {
      openAccordion(accordion);
    });

    openAllWrapper.classList.add(accordionTopOpen);
  } else {
    accordions.forEach((accordion) => {
      closeAccordion(accordion);
    });

    openAllWrapper.classList.remove(accordionTopOpen);
  }
};

const setAccordionContentFocusable = (el, focusable) => {
  // set tabindex of all "el" anchors and buttons to -1 or 0
  const elements = el.querySelectorAll('a,button');
  elements.forEach((e) => e.setAttribute('tabindex', focusable ? 0 : -1));
};

const expandAllOnPage = () => {
  expandAll.addEventListener('click', ({ target }) => {
    const isExpanded = target.classList.contains(accordionsExpandAll);

    isExpanded
      ? target.classList.remove(accordionTopOpen, accordionsExpandAll)
      : target.classList.add(accordionTopOpen, accordionsExpandAll);

    isExpanded
      ? target.setAttribute("aria-expanded", "false")
      : target.setAttribute("aria-expanded", "true");

    allAccordions.forEach((accordion) => {
      toggleAccordion(accordion, isExpanded);
    });

  });
};

(() => {
  accordionWrapper.length > 0 && initAccordion();
  expandAll && expandAllOnPage();
})();

accordionWrapper &&
  openAll.forEach((acc) => {
    acc.addEventListener('click', toggleAll);
  });
