const stableLink = document.querySelector('.stable-link');
const stableLinkToggle = document.querySelector('.stable-link__toggle');
const stableLinkTooltip = document.querySelector('.stable-link__tooltip');
const stableLinkContent = document.querySelector('.stable-link__tooltip-content');
const copyBtn = document.querySelector('.stable-link__tooltip-copy');
const stableLinkPlaceholder = document.querySelector('.stable-link__placeholder');

const showClass = 'stable-link--show';
const copiedClass = 'stable-link__tooltip-copy--copied';
let open = false;

const addUrl = () => {
  const location = stableLinkPlaceholder
    ? `${window.location.origin}${stableLinkPlaceholder.textContent}`
    : window.location;
  stableLinkContent.value = location;
  stableLinkContent.parentNode.dataset.value = location;
};

const copyOnClick = () => {
  copyBtn.addEventListener('click', () => {
    stableLinkContent.select();
    stableLinkContent.setSelectionRange(0, 99999);
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(stableLinkContent.value);

      copyBtn.classList.add(copiedClass);

      setTimeout(() => {
        copyBtn.classList.remove(copiedClass);
      }, 1100);
    } else {
      console.error('Navigator clipboard api needs a secure context (https)!');
    }
  });
};

const show = () => {
  addUrl();

  stableLink.classList.add(showClass);
  stableLinkToggle.setAttribute('aria-expanded', true);
  stableLinkTooltip.setAttribute('aria-hidden', false);

  open = true;
};

const hide = () => {
  stableLink.classList.remove(showClass);
  stableLinkToggle.setAttribute('aria-expanded', false);
  stableLinkTooltip.setAttribute('aria-hidden', true);

  open = false;
};

const toggleDisplay = () => {
  stableLinkToggle.addEventListener('click', () => {
    open ? hide() : show();
  });
};

(() => {
  if (stableLink) {
    addUrl();
    copyOnClick();
    toggleDisplay();
  }
})();

if (stableLink) {
  window.addEventListener('keyup', ({ key }) => {
    if (open && (key === 'Escape' || key === 'Esc')) {
      hide();
    }
  });

  document.addEventListener('click', ({ target }) => {
    if (!stableLink.contains(target)) {
      hide();
    }
  });
}
