<?php

/**
 * @file
 * Post update hooks for the ddbp_migrations module.
 */

/**
 * Ensures imported glossary body fields are rendered as HTML.
 */
function ddbp_migrations_post_update_glossary_body_format(&$sandbox = NULL) {
  $storage = \Drupal::entityTypeManager()->getStorage('node');
  $nids = $storage->getQuery()
    ->condition('type', 'glossary_term')
    ->accessCheck(FALSE)
    ->execute();

  if (!$nids) {
    return 'No glossary terms found.';
  }

  $updated = 0;
  foreach ($storage->loadMultiple($nids) as $node) {
    if ($node->get('body')->isEmpty()) {
      continue;
    }

    $body = $node->get('body')->first();
    if ($body->format === 'basic_html') {
      continue;
    }

    $node->set('body', [
      'value' => $body->value,
      'summary' => $body->summary,
      'format' => 'basic_html',
    ]);
    $node->save();
    $updated++;
  }

  return sprintf('Updated the body text format for %d glossary terms.', $updated);
}
