const announcement = document.querySelector('.announcement');

const initMarquee = () => {
  const textWrapper = announcement.querySelector('.announcement__text-wrapper');
  const textAnnouncement = announcement.querySelector('.announcement__text');

  textAnnouncement.offsetWidth < textWrapper.offsetWidth
    ? announcement.classList.remove('announcement--run')
    : announcement.classList.add('announcement--run');
};

(() => {
  announcement && initMarquee();
})();

announcement &&
  window.addEventListener('resize', initMarquee);
