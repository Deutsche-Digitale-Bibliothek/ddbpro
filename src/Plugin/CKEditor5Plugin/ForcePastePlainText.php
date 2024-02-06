<?php

declare(strict_types=1);

namespace Drupal\editor_paste_plain\Plugin\CKEditor5Plugin;

use Drupal\ckeditor5\Plugin\CKEditor5PluginConfigurableInterface;
use Drupal\ckeditor5\Plugin\CKEditor5PluginConfigurableTrait;
use Drupal\ckeditor5\Plugin\CKEditor5PluginDefault;
use Drupal\Core\Form\FormStateInterface;

/**
 * CKEditor 5 Advanced Link plugin.
 */
class ForcePastePlainText extends CKEditor5PluginDefault implements CKEditor5PluginConfigurableInterface {

  use CKEditor5PluginConfigurableTrait;

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return [
      'force_paste_plain_text' => FALSE
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form['force_paste_plain_text'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Force pasting as plain text'),
      '#default_value' => $this->configuration['force_paste_plain_text'],
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state) {
    $form_value = $form_state->getValue('force_paste_plain_text');
    $form_state->setValue('force_paste_plain_text', (bool) $form_value);
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    $this->configuration['force_paste_plain_text'] = $form_state->getValue('force_paste_plain_text');
  }
}
