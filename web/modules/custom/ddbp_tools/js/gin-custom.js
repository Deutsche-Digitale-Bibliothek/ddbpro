(function ($, Drupal) {
  // Selects end date value based on start date (e.g. CT Event).
  const startDate = document.querySelector('.form-item--field-date-0-value-date input');
  const endDate = document.querySelector('.form-item--field-date-0-end-value-date input');

  if (startDate && endDate) {
    startDate.addEventListener('change', () => endDate.value = startDate.value);
  }

  // Alters CKEditor 4 settings as requested by the client.
  // Note: This may need to be adjusted for CKEditor 5,
  // which will soon become the default in Drupal.
  Drupal.behaviors.CKEditorConfig = {
    attach: function (context, settings) {
      if (typeof CKEDITOR !== 'undefined') {
        // Prevent CKEditor from stripping empty <i> tags.
        CKEDITOR.dtd.$removeEmpty.i = 0;
        CKEDITOR.config.protectedSource.push(/<i[^>]*><\/i>/g);
      }
    }
  }
})(jQuery, Drupal);
