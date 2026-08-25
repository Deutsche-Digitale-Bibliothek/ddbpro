<?php

use Drupal\Component\Utility\Html;

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

/**
 * Decodes entity-encoded HTML in glossary body fields stored incorrectly.
 *
 * The source API has always delivered HTML tags entity-encoded inside XML
 * <note> elements (e.g. &lt;a href=&quot;...&quot;&gt;). The migrate_plus XML
 * parser used to decode these entities automatically before passing the value
 * to TransformLinks. After the Drupal 11.3.x update this automatic decoding no
 * longer happens, so TransformLinks received the raw entity-encoded string,
 * found no <a> elements, and stored the entities literally in body/value.
 * Drupal then rendered the entities as visible text instead of HTML.
 *
 * This hook is a PARTIAL fix: it decodes the entities so that links are
 * rendered as HTML again. However, internal glossary links will still point to
 * the external vocnet URIs and external links will lack target="_blank" and
 * data-tooltip attributes. A full migration re-import is required to restore
 * all link attributes correctly:
 *   drush migrate:import ddbp_glossary --update
 */
function ddbp_migrations_post_update_glossary_body_decode_html(&$sandbox = NULL) {
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
    $body_value = $body->value;

    // Only process nodes whose body contains entity-encoded HTML tags.
    if (strpos($body_value, '&lt;') === FALSE) {
      continue;
    }

    // Decode HTML entities so that &lt;a href=&quot;...&quot;&gt; becomes
    // a real <a href="..."> element that the browser renders as a link.
    $decoded_value = Html::decodeEntities($body_value);

    $node->set('body', [
      'value' => $decoded_value,
      'summary' => $body->summary,
      'format' => $body->format ?: 'basic_html',
    ]);
    $node->save();
    $updated++;
  }

  return sprintf('Decoded entity-encoded HTML in body field for %d glossary terms.', $updated);
}
