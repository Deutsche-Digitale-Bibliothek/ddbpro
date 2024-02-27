// Handle the ESC key, to close tooltips
jQuery("a[data-tooltip]").on('keyup', function(event) {
  if (event.key === 'Escape' || event.key === 'Esc') {
    event.target.blur();
  }
});
