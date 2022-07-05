import { throttle } from '../helpers/throttle';

const $ = jQuery;
const $window = $(window);
const $htmlBody = $('html, body');

const anchorActiveClass = 'view-faq__nav-link--active';
const anchorClass = 'view-faq__nav-link';

const $anchorItems = $('.view-faq__nav');
const anchors = $(`.${anchorClass}`);

let $anchorsSections = $('.view-content__item');

const scrollingOffset = 200;
const justifyOffset = 30;
const speed = 800;

const scrollSpy = () => {
  const currentSection = getActiveSections();
  if (currentSection) {
    setActive(currentSection);
  }
};

function getActiveSections() {
  let current = -1;
  const sections = [];
  $anchorsSections.each((index) => {
    const scrollTop = $window.scrollTop();
    const sectionOffsetTop =
        $anchorsSections[index].offsetTop -
        scrollingOffset -
        justifyOffset;
    const sectionIsDefined = $anchorsSections[index].id !== '';

    if (scrollTop >= sectionOffsetTop && sectionIsDefined) {
      current++;
      sections[current] = $anchorsSections[index].id;
    }
  });

  return sections[current];
}

function setActive(key) {
  const $activeAnchor = $(`.${anchorClass}[href="#${key}"]`);
  if (!$activeAnchor.hasClass(anchorActiveClass)) {
    anchors.removeClass(anchorActiveClass);
    $activeAnchor.addClass(anchorActiveClass);
  }
}

function enableSmoothScrollingAnchors() {
  anchors.on('click', (e) => {
    e.preventDefault();
    let $target = $(e.currentTarget.hash);

    $htmlBody.animate({
      scrollTop: $target.offset().top - 100
    }, speed, null, () => {
      $target = $(e.currentTarget.hash);
      $target.attr('tabindex', '-1');
      $target.focus();

      return false;
    });
  });
}


if ($anchorItems.length > 0) {
  enableSmoothScrollingAnchors();
  // Throttle scroll event for better performance.
  $window.scroll(() => {
    throttle(scrollSpy, 250);
  });
}

// Scroll to hash if coming from another page.
$(document).ready(function () {
  if (window.location.hash) {
    const $hash = $(window.location.hash);

    if ($hash.length > 0) {
      $htmlBody.stop().animate({
        scrollTop: $hash.offset().top - scrollingOffset,
      }, speed);
    }
  }
});
