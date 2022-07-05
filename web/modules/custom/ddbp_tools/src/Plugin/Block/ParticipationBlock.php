<?php

namespace Drupal\ddbp_tools\Plugin\Block;

use Drupal\config_pages\Entity\ConfigPages;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Url;

/**
 * Fetches certain information from the front page and displays it
 * alongside a content block managed by DDB editors (s. twig template).
 *
 * @Block(
 *   id = "participation_block",
 *   admin_label = @Translation("Participation block"),
 *   category = @Translation("Custom"),
 * )
 */

class ParticipationBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    // Get front page entity.
    $front_page = ConfigPages::config('front_page');

    // Build a nice data array for the participation twig partial.
    $data = [
      'headline' => $front_page->field_participation_headline->value,
      'description' => $front_page->field_participation_description->view('full'),
      'steps' => $front_page->field_participation_steps,
      'linkPrimary' => [
        'url' => Url::fromUri($front_page->field_participation_cta_left->uri),
        'text' => $front_page->field_participation_cta_left->title,
        'type' => 'primary',
      ],
      'linkSecondary' => [
        'url' => Url::fromUri($front_page->field_participation_cta_right->uri),
        'text' => $front_page->field_participation_cta_right->title,
        'type' => 'secondary',
        'bg' => 'light',
      ],
    ];

    return [
      '#theme' => 'participation_block',
      'data' => $data,
    ];
  }

}
