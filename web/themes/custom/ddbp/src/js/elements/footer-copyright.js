const allImages = [...document.querySelectorAll('.main-content .responsive-image__copyright')];

const copyFooter = document.querySelector('.footer__copyright');
const copySection = copyFooter && copyFooter.querySelector('.copyright__items');
const copy = document.querySelector('.copyright');
const copyHeader = copy && copy.querySelector('.copyright__header');
const copyContent = copy && copy.querySelector('.copyright__content');

const copyOpenClass = 'copyright--open';
const anchors = [];
let open = false;
let images = {};

const addToCopy = () => {
  if (copySection) {
    allImages.forEach((image) => {
      const imgUrl = image
        .querySelector('.responsive-image__copyright-image')
        .style
        .backgroundImage;
      images[imgUrl] = image;
    });

    if (allImages.length) {
      appendToHtml(images);

      // display section if there are any items
      copyFooter.style.display = 'block';
    }
  }
  anchors.forEach((a) => a.setAttribute('tabindex', -1));
};

const appendToHtml = (images) => {
  Object.values(images).forEach((image) => {
    const href = image.dataset.link;
    let titleSpan = image.querySelector('.responsive-image__copyright-text-title');

    // wrap in link if exists
    if (href && titleSpan) {
      
      // Neuen Link erstellen
      let link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.className = 'responsive-image__copyright-link';
      link.innerHTML = titleSpan.innerHTML;
      
      // Das ursprüngliche span durch den Link ersetzen
      titleSpan.parentNode.replaceChild(link, titleSpan);
    }
    
    let textSpan = image.querySelector('.responsive-image__copyright-text');

    if (textSpan) {
      // Alle <span>-Elemente mit data-link innerhalb von titleSpan suchen
      let spans = textSpan.querySelectorAll('span[data-link]');
  
      spans.forEach(span => {
          let link = span.getAttribute("data-link");
          let content = span.innerHTML;
  
          // Neues <a>-Element erstellen
          let anchor = document.createElement("a");
          anchor.href = link;
          anchor.target = "_blank";
          anchor.innerHTML = content;
  
          // Den Inhalt des <span> ersetzen
          span.innerHTML = "";
          span.appendChild(anchor);
      });
    }

    image.classList.add('copyright__item');
    copySection.appendChild(image);
    const anchor = image.querySelector('a');
    
    if (anchor) {
      anchors.push(anchor);
    }
  });
};

const toggleDisplay = () => {
  copyHeader.addEventListener('click', () => {
    if (open) {
      copy.classList.remove(copyOpenClass);
      copyHeader.setAttribute('aria-expanded', false);
      copyContent.setAttribute('aria-hidden', true);

      anchors.forEach((a) => a.setAttribute('tabindex', -1));

      copyContent.style.maxHeight = `0px`;
      open = false;
    } else {
      copy.classList.add(copyOpenClass);
      copyHeader.setAttribute('aria-expanded', true);
      copyContent.setAttribute('aria-hidden', false);

      anchors.forEach((a) => a.setAttribute('tabindex', 0));

      copyContent.style.maxHeight = `${copyContent.scrollHeight}px`;
      open = true;
    }
  });
};

(() => {
  if (allImages.length) {
    addToCopy();
  }

  if (copy) {
    toggleDisplay();
  }
})();
