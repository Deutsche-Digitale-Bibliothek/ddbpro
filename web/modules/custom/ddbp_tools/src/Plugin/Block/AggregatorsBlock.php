<?php

namespace Drupal\ddbp_tools\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Displays 3 random nodes of type Aggregator portrait.
 *
 * @Block(
 *   id = "aggregators_block",
 *   admin_label = @Translation("Aggregator portrait teasers"),
 *   category = @Translation("Custom"),
 * )
 */

class AggregatorsBlock extends BlockBase implements ContainerFactoryPluginInterface {

  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * Constructor.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin ID for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, EntityTypeManagerInterface $entity_type_manager) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    $data = [];

    $query = $this->entityTypeManager->getStorage('node')->getQuery();
    // Add a tag to the query to get random results (s. hook_query_TAG_alter() in ddbp_tools.module).
    $nids = $query->condition('type', 'aggregator_portrait')
                  ->condition('status', 1)
                  ->pager(3)
                  ->addTag('randomize')
                  ->execute();
    $nodes = $this->entityTypeManager->getStorage('node')->loadMultiple($nids);

    foreach ($nodes as $node) {
      $data[] = $this->entityTypeManager->getViewBuilder('node')->view($node, 'teaser');
    }

    return [
      '#theme' => 'aggregators_block',
      'aggregators' => $data,
    ];
  }

  /**
  * {@inheritdoc}
  */
  public function getCacheMaxAge() {
    // Make sure this block isn't cached and results are always random.
    return 0;
  }
}
