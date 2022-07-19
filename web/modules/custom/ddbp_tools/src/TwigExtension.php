<?php

namespace Drupal\ddbp_tools;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\EntityTypeManager;
use Drupal\Core\Path\CurrentPathStack;
use Drupal\datetime\Plugin\Field\FieldType\DateTimeItemInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

/**
 * Twig extension with some useful functions and filters.
 *
 * Dependencies are not injected for performance reason.
 */
class TwigExtension extends AbstractExtension {

  protected EntityTypeManager $entityTypeManager;
  protected CurrentPathStack $currentPath;

  /**
   * Constructor.
   *
   * @param EntityTypeManager $entity_type_manager
   * @param CurrentPathStack $current_path
   */
  public function __construct(EntityTypeManager $entity_type_manager, CurrentPathStack $current_path) {
    $this->entityTypeManager = $entity_type_manager;
    $this->currentPath = $current_path;
  }

  /**
   * {@inheritdoc}
   */
  public function getFunctions(): array {
    return [
      new TwigFunction('get_faq', [$this, 'getFaq']),
      new TwigFunction('get_nodes', [$this, 'getNodes']),
      new TwigFunction('get_latest_events', [$this, 'getLatestEvents']),
      new TwigFunction('get_current_path', [$this, 'getCurrentPath']),
      new TwigFunction('calendar_link_multiple', [$this, 'calendarLinkMultiple']),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getFilters() {
    return array(
      new TwigFilter('format_bytes', array($this, 'formatBytes')),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getName(): string {
    return 'ddbp_tools_twig_extension';
  }

  /**
   * Returns link to ICS file containing all given events
   *
   * @param array $data
   *
   * @return string
   */
  public function calendarLinkMultiple($data) {
    $ical = 'BEGIN:VCALENDAR' . chr(10) .
      'VERSION:2.0' . chr(10) .
      'PRODID:-//Date iCal//NONSGML kigkonsult.se iCalcreator 2.20.4//' . chr(10) .
      'METHOD:PUBLISH' . chr(10) .
      'X-WR-CALNAME;VALUE=TEXT:Termine von DDBpro';

    foreach ($data as $key => $value) {
      $uid = md5(sprintf(
        '%s%s%s%s',
        $value['title'],
        $value['description'],
        $value['location'],
        $value['start_date'],
      ));

      $ical .= chr(10) . 'BEGIN:VEVENT' . chr(10);
      $ical .= 'UID:' . $uid . $key . chr(10);
      $ical .= 'SUMMARY:' . $value['title'] . chr(10);
      $ical .= 'DTSTART;TZID=Europe/Berlin:' . date('Ymd\THis', $value['start_date']) . chr(10);
      $ical .= 'DTEND;TZID=Europe/Berlin:' . date('Ymd\THis', $value['end_date']) . chr(10);
      $ical .= 'DESCRIPTION:' . addcslashes($value['description'], "\n") . chr(10);
      $ical .= 'LOCATION:' . addcslashes($value['location'], "\n") . chr(10);
      $ical .= 'END:VEVENT' . chr(10);
    }

    $ical .= 'END:VCALENDAR';

    return 'data:text/calendar;charset=utf8;base64,' . base64_encode($ical);
  }

  /**
   * Return CT FAQ content referencing taxonomy term ID (or its children).
   *
   * @param string|int $tid
   * @param bool $deep
   *
   * @return array
   */
  public function getFaq($tid, $deep = FALSE): array {
    if (!isset($tid)) return [];
    $data = [];
    $node_storage = $this->entityTypeManager->getStorage('node');
    $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $term = $term_storage->load($tid);
    // Get term name for header.
    $data['term'] = $term->getName();
    // Prepare query.
    $query = $node_storage->getQuery();
    $query->condition('type', 'faq')
          ->condition('status', 1)
          ->sort('field_weight', 'ASC')
          ->sort('title', 'ASC');
    // Get term children and check for any matches, if deep is set to true.
    if ($deep) {
      $child_ids = array_keys($term_storage->loadChildren($tid));
      // Include parent term for best result coverage.
      // This would also prevent QueryExceptions in case $tid has no children.
      $child_ids[] = $tid;
      $query->condition('field_faq_category', $child_ids, 'IN');
    } else {
      // Otherwise check for a direct match with tid.
      $query->condition('field_faq_category', $tid);
    }
    $nids = $query->execute();
    $nodes = $node_storage->loadMultiple($nids);

    foreach ($nodes as $node) {
      $data['items'][] = [
        'title' => $node->getTitle(),
        'content' => $node->get('field_answer')->view('full'),
      ];
    }

    return $data;
  }

  /**
   * Get nodes of CTs.
   *
   * @param string $type
   * @param string $id
   *
   * @return array
   */
  public function getNodes($type, $id = null): array {
    $data = [];
    $storage = $this->entityTypeManager->getStorage('node');
    $query = $storage->getQuery();
    $query->condition('type', $type)->condition('status', 1);

    if ($id) {
      $query->condition('nid', $id, 'NOT IN');
    }

    // sorting
    switch ($type) {
      case 'aggregator_portrait':
        $query->sort('title', 'ASC');
        break;
      case 'department':
        $query->sort('field_weight');
        break;

      default:
        break;
    }

    $nids = $query->execute();

    if ($type === 'aggregator_portrait') {
      // add current to the first position
      array_unshift($nids, $id);
    }

    $nodes = $storage->loadMultiple($nids);
    foreach ($nodes as $node) {
      $data[] = $this->entityTypeManager->getViewBuilder('node')->view($node, 'teaser_mini');
    }

    return $data;
  }

  /**
   * Get latest upcoming N CT Events.
   *
   * @param int $count
   *
   * @return array
   */
  public function getLatestEvents($count = 3): array {
    $data = [];
    $now = new DrupalDateTime('now');
    $now->setTimezone(new \DateTimeZone(DateTimeItemInterface::STORAGE_TIMEZONE));
    $storage = $this->entityTypeManager->getStorage('node');
    $query = $storage->getQuery();
    $nids = $query->condition('type', 'event')
                  ->condition('status', 1)
                  ->condition('field_date', $now->format(DateTimeItemInterface::DATETIME_STORAGE_FORMAT), '>=')
                  ->sort('field_date')
                  ->pager($count)
                  ->execute();
    $nodes = $storage->loadMultiple($nids);

    foreach ($nodes as $node) {
      $data[] = $this->entityTypeManager->getViewBuilder('node')->view($node, 'teaser');
    }

    return $data;
  }

  /**
   * Transform file size to readable number.
   *
   * @param $bytes
   * @param int $precision
   *
   * @return string
   */
  public function formatBytes($bytes, $precision = 2): string {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');

    $bytes = max($bytes, 0);
    $value = ($bytes / pow(1024, floor(2))); // MB

    $result = round($value, $precision);

    return number_format($result, $precision, ',', '.') . ' ' . 'MB';
  }

  /**
   * Get current path.
   *
   * @return string
   */
  public function getCurrentPath(): string {
    return $this->currentPath->getPath();
  }
}
