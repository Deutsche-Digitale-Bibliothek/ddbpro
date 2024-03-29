import scrollLock from '@/js/helpers/scroll-lock';
import overlay from '@/js/helpers/overlay';

const $ = jQuery;

$(window).on('load', () => {
  const subMenuButtons = $('button.menu-item__link');
  $('.sub-menu-items .menu-item a, .sub-menu-items .menu-item button').attr('tabindex', -1);
  $('.sub-menu-items ul.menu-items').attr('aria-hidden', true);
  $('.sub-menu-items__close-button').attr('tabindex', -1);
  let activeMenu = null;

  $('.sub-menu-items .main-menu__join-button').attr('tabindex', -1);

  const closeAll = () => {
    $('.sub-menu-items').removeClass('sub-menu-items--active');
    $('.sub-menu-items').attr('tabindex', -1);
    $('.sub-menu-items .menu-item a, .sub-menu-items .menu-item button').attr('tabindex', -1);
    $('.sub-menu-items ul.menu-items').attr('aria-hidden', true);
    $('.sub-menu-items__close-button').attr('tabindex', -1);
    $('.sub-menu-items').removeClass('sub-menu-items--no-transition');

    // set classes & aria
    const menuItems = $('.main-menu > .menu-items > .menu-item:not(.menu-item__search)');
    const menuButtons = $('.main-menu > .menu-item > button');
    menuItems.removeClass('inactive');
    $('.main-menu__search-button').removeClass('inactive');
    menuButtons.attr('aria-expanded', false);

    $('.sub-menu-items .main-menu__join-button').attr('tabindex', -1);

    // fade out overlay
    overlay.fadeOut(closeAll);
    scrollLock.unlock();

    activeMenu = null;
    $('#main-menu').removeClass('main-menu--open');

    Drupal.announce(
      Drupal.t('Menü geschlossen'),
    );
  };

  subMenuButtons.on('click', (e) => {
    $('.content-main').removeClass('content-main--search-open');

    const button = $(e.target).closest('.menu-item__link');
    const li = button.parent();
    const isAlreadyOpen = !!$('.main-menu--open').length;

    // close menu on click of opened menu link
    if (activeMenu && activeMenu.attr('id') === li.attr('id')) {
      e.preventDefault();
      closeAll();
      return;
    }

    if (isAlreadyOpen) {
      $('.sub-menu-items').addClass('sub-menu-items--no-transition');
    }

    // set classes & aria
    $('.sub-menu-items').removeClass('sub-menu-items--active');
    const menuItems = $('.main-menu > .menu-items > .menu-item');
    $('.main-menu > .menu-item > button').attr('aria-expanded', false);
    menuItems.addClass('inactive');

    li.removeClass('inactive');

    $('.main-menu__search-button').addClass('inactive');
    button.attr('aria-expanded', true);
    li.find('.menu-item a, .menu-item button').attr('tabindex', 0);
    li.find('.sub-menu-items ul.menu-items').attr('aria-hidden', false);
    li.find('.sub-menu-items__close-button').attr('tabindex', 0);
    li.find('.sub-menu-items').addClass('sub-menu-items--active');

    li.find('.main-menu__join-button').attr('tabindex', 0);

    // set active menu el
    activeMenu = li;

    // fade in overlay
    overlay.fadeIn(closeAll);
    scrollLock.lock();

    // focus first submenu link
    activeMenu.find('.sub-menu-items .menu-item__link').first().focus();

    Drupal.announce(
      Drupal.t('Menü geöffnet')
    );

    $('#main-menu').addClass('main-menu--open');
  });

  $('.sub-menu-items__close-button').on('click', closeAll);

  // -- keyboard nav --
  $(document).on('keyup', function (e) {
    const mainMenuItems = $('.main-menu > .menu-items > li');
    const activeMainMenuItemIndex = mainMenuItems.index(activeMenu);
    const isFocusWithinMenu = $('.sidebar :focus').length !== 0;

    if (isFocusWithinMenu && (e.key === 'Esc' || e.key === 'Escape')) {
      closeAll();
      $(mainMenuItems[activeMainMenuItemIndex]).find('> a, > button').focus();
    } else if (e.key === 'Tab') {
      // get active sub-menu list and focused link
      const subList = $(activeMenu).find('.sub-menu-items ul li');
      const activeSubListItem = subList.find('> a:focus');
      const activeSubListItemIndex = subList.index(activeSubListItem.parent());

      // main menu point below current opened one
      const nextMainMenuPoint = mainMenuItems[activeMainMenuItemIndex + 1];

      if (activeMenu !== null) {
        // tabbing forwards (focus next main menu point if user is at submenu list end)
        if (!e.shiftKey) {
          if (activeSubListItemIndex === -1 && $('.main-menu__join-button:focus').length < 1 && $('.sub-menu-items__close-button:focus').length < 1) {
            closeAll();
            if (nextMainMenuPoint) {
              e.preventDefault();
              nextMainMenuPoint.focus();
            }
          }
        }
        // tabbing backwards (focus curr main menu point when user tabs out of submenu list)
        else {
          if (activeSubListItemIndex < 0 && $('.sub-menu-items__close-button:focus').length < 1) {
            closeAll();
            e.preventDefault();
          }
        }
      }
    }
  });
});
