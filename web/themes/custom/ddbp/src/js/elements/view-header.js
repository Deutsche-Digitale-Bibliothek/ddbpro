const viewHeaderLinkWrapper = document.querySelector('.view-header__link-wrapper');
const viewHeaderLink = document.querySelector('.view-header__link');
const viewHeaderButton = viewHeaderLink && viewHeaderLink.querySelector('button');
const viewHeaderSelect = viewHeaderLink && viewHeaderLink.querySelector('.view-header__link-select');
const viewHeaderSelectLink = viewHeaderSelect && viewHeaderSelect.querySelector('a');

const linkOpenClass = 'view-header__link--open';
let open = false;

const toggleDisplay = () => {
  if (open) {
    hide();
  } else {
    show();
  }
};

const hide = () => {
  viewHeaderLink.style.height = `${viewHeaderSelect.scrollHeight}px`;

  viewHeaderButton.setAttribute('aria-expanded', false);
  viewHeaderSelect.setAttribute('aria-hidden', true);
  viewHeaderLink.classList.remove(linkOpenClass);

  viewHeaderSelectLink.setAttribute('tabindex', -1);
  open = false;
};

const show = () => {
  viewHeaderLink.style.height = `${viewHeaderSelect.scrollHeight * 2}px`;

  viewHeaderButton.setAttribute('aria-expanded', true);
  viewHeaderSelect.setAttribute('aria-hidden', false);
  viewHeaderLink.classList.add(linkOpenClass);

  viewHeaderSelectLink.setAttribute('tabindex', 0);
  open = true;

  viewHeaderLinkWrapper.addEventListener('focusout', function close(e)  {
    if (e.relatedTarget !== viewHeaderSelectLink) {
      hide();
      viewHeaderLinkWrapper.removeEventListener('focusout', close);
    }
  });
};

if (viewHeaderLink) {
  viewHeaderSelectLink.setAttribute('tabindex', -1);

  viewHeaderLink.addEventListener('click', toggleDisplay);

  window.addEventListener('keyup', ({ key }) => {
    if (open && (key === 'Escape' || key === 'Esc')) {
      hide();
    }
  });

  document.addEventListener('click', ({ target }) => {
    if (!viewHeaderLink.contains(target)) {
      hide();
    }
  });
}
