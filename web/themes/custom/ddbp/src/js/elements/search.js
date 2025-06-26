import scrollLock from '../helpers/scroll-lock';
import overlay from '../helpers/overlay';
import { isMobile } from '../helpers/is-mobile';

const $ = jQuery;

const contentContainer = document.querySelector('.content-main');
const searchForm = document.querySelectorAll('.search-form');
const searchTrigger = [...document.querySelectorAll('.search-toggle')];

let open = false;

const searchOpen = (target) => {
  const input = target.nextElementSibling.querySelector('input');

  $('.sub-menu-items').removeClass('sub-menu-items--active');
  $('.menu-item__search .sub-menu-items').addClass('sub-menu-items--active');
  $('.main-menu > .menu-items > .menu-item:not(.menu-item__search)').addClass('inactive');
  $('.main-menu').addClass('main-menu--open');
  contentContainer.classList.add('content-main--search-open');

  searchForm.forEach((e) => e.classList.add('search-form--open'));

  overlay.fadeIn();
  scrollLock.lock();

  open = true;
  input.setAttribute('tabindex', 0);
  input.focus();
};

const searchClose = (isMenuItem = false, keepMenuOpen = false) => {
  const searchContainer = isMobile() ? '.header' : '.main-menu';
  const sidebarSearchInput = document.querySelector(`${searchContainer} .search-form input`);
  const sidebarSearchButton = document.querySelector(`${searchContainer} .search-toggle`);

  searchForm.forEach((e) => e.classList.remove('search-form--open'));
  contentContainer.classList.remove('content-main--search-open');

  if (!keepMenuOpen) {
    $('#main-menu > .menu-items > .menu-item').removeClass('inactive');
    $('#main-menu').removeClass('main-menu--open');
  }

  if (!isMenuItem || !keepMenuOpen) {
    overlay.fadeOut();
    scrollLock.unlock();
  }

  open = false;
  sidebarSearchInput?.setAttribute('tabindex', -1);
  sidebarSearchButton?.focus();
};

const searchInit = () => {
  const searchContainer = isMobile() ? '.header' : '.main-menu';
  const sidebarSearchInput = document.querySelector(`${searchContainer} .search-form input`);

  sidebarSearchInput?.setAttribute('tabindex', -1);

  searchTrigger.forEach((trigger) => {
    trigger.addEventListener('click', ({ target }) => {
      open ? searchClose() : searchOpen(target);

    });
  });

  searchClear();
};

const searchClear = () => {
  searchForm.forEach((form) => {
    const input = form.querySelector('input');
    const reset = input.nextElementSibling;

    // show the reset when start typing
    input.addEventListener('input', ({ target }) => {
      const hasValue = target.value !== '';
      reset.style.display = hasValue ? 'block' : 'none';
    });

    // reset the form if clicked on reset
    reset.addEventListener('click', () => {
      input.value = '';
      input.focus();
    });
  });
};

(() => {
  if (searchForm.length > 0) {
    searchInit();
  }
})();

searchForm &&
  window.addEventListener('keyup', ({ key }) => {
    if (open) {
      if (key === 'Escape' || key === 'Esc') {
        searchClose();
      } else if (key === 'Tab') {
        const focusWithinSearchContainer = $('.search-form :focus').length !== 0;

        if (!focusWithinSearchContainer) {
          searchClose();
        }
      }
    }
  });

searchForm &&
  window.addEventListener('click', ({ target }) => {
    const isMenuItem = target.closest('.main-menu');
    const isToggle = target.classList.contains('search-toggle');

    const mobileSearchContainer = $(searchForm[0]).parent().parent()[0];
    const searchContainer = $(searchForm[1]).parent()[0];

    if (open && !isToggle && !mobileSearchContainer.contains(target) && !searchContainer.contains(target)) {
      const keepMenuOpen = target.classList.contains('menu-item__link');
      searchClose(isMenuItem, keepMenuOpen);
    }
  });
