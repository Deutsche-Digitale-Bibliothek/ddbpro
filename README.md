# DDBpro

DDBpro ist das Portal für Datenpartner der Deutschen Digitalen Bibliothek. Die
Anwendung basiert auf Drupal 11 und wird als Container mit PHP 8.5, nginx,
Redis und Supercronic betrieben.

## Voraussetzungen

Für den empfohlenen Container-Build wird Docker mit BuildKit benötigt.

Für eine Installation direkt auf dem lokalen System werden zusätzlich
folgende Werkzeuge benötigt:

- PHP 8.5 mit den in `composer.json` aufgeführten Extensions
- Composer 2
- MySQL oder MariaDB
- Node.js 22
- Yarn 1

## Konfiguration

Die Anwendung lädt beim Start automatisch eine optionale `.env`-Datei aus dem
Projektverzeichnis. Als Ausgangspunkt kann die Beispieldatei kopiert werden:

```shell
cp .env.example .env
```

Die wichtigsten Variablen sind:

| Variable | Beschreibung |
| --- | --- |
| `MYSQL_DATABASE` | Name der Drupal-Datenbank |
| `MYSQL_HOSTNAME` | Hostname des Datenbankservers |
| `MYSQL_PORT` | Port des Datenbankservers, normalerweise `3306` |
| `MYSQL_USER` | Datenbankbenutzer |
| `MYSQL_PASSWORD` | Datenbankpasswort |
| `HASH_SALT` | Zufälliger, geheimer Salt für Drupal |
| `FILE_PUBLIC_PATH` | Öffentliches Dateiverzeichnis relativ zum Webroot |
| `FILE_PRIVATE_PATH` | Privates Dateiverzeichnis |
| `TRUSTED_HOST_PATTERNS` | Kommagetrennte reguläre Ausdrücke erlaubter Hosts |
| `USE_REDIS` | Aktiviert mit `yes` das Redis-Cache-Backend |

Bei einem Container-Start bezeichnet `localhost` immer den Container selbst.
Liegt die Datenbank außerhalb des Containers, muss `MYSQL_HOSTNAME` auf einen
im Docker-Netzwerk erreichbaren Hostnamen gesetzt werden.

Zusätzliche optionale Container-Variablen:

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `UPDATEDB_ON_STARTUP` | `no` | Führt beim Start `drush updatedb` aus |
| `CONFIG_IMPORT_ON_STARTUP` | `no` | Importiert beim Start die Drupal-Konfiguration |
| `CACHEREBUILD_ON_STARTUP` | `no` | Leert beim Start den Drupal-Cache |
| `REDIS_MAXMEMORY` | `1gb` | Maximale Speicherbelegung des integrierten Redis |
| `HTPASSWD_USER` | – | Aktiviert zusammen mit `HTPASSWD_PWD` HTTP Basic Auth |
| `HTPASSWD_PWD` | – | Passwort für HTTP Basic Auth |
| `HTPASSWD_GREETING` | – | Optionaler Text des Authentifizierungsdialogs |

Secrets dürfen nicht in `.env.example` oder andere versionierte Dateien
eingetragen werden.

## Container bauen und starten

Image bauen:

```shell
docker build -t ddbpro .
```

Container mit einer erreichbaren externen MySQL-/MariaDB-Datenbank starten:

```shell
docker run --rm \
  --env-file .env \
  --publish 8080:8080 \
  --publish 4430:4430 \
  ddbpro
```

Die Anwendung ist anschließend über `http://localhost:8080` oder über den
HTTPS-Port `https://localhost:4430` erreichbar. Das Image verwendet für HTTPS
ein selbstsigniertes Zertifikat.

Der Container startet PHP-FPM, nginx, Redis, Cron und die optionalen
Drupal-Wartungsaufgaben über Supervisor. Die Anwendung läuft als Benutzer
`nobody`.

## Laufzeit, Cache und Reverse Proxy

Der PHP-FPM-Pool verwendet den dynamischen Process Manager mit höchstens 20
gleichzeitigen Workern. Sechs Worker werden beim Start erzeugt; ungenutzte
Kapazität wird zwischen vier und acht freien Workern gehalten. Worker werden
nach 300 Requests recycelt. PHP-FPM und nginx begrenzen Webanfragen einheitlich
auf 180 Sekunden. Diese Pool-Größe setzt ein entsprechend bemessenes
Container-Memory-Limit voraus und sollte bei geänderten Ressourcen unter Last
überprüft werden.

OPcache und APCu verwenden jeweils bis zu 256 MiB Shared Memory und sind für
bis zu 20.000 Dateien beziehungsweise Cache-Einträge vorkonfiguriert. Da
`opcache.validate_timestamps` deaktiviert ist, werden PHP-Codeänderungen erst
nach einem Neustart von PHP-FPM beziehungsweise mit einem neuen Container
wirksam.

nginx speichert erfolgreiche anonyme GET- und HEAD-Antworten für 30 Sekunden
im FastCGI-Microcache. Der Cache wird bei Drupal-Session-Cookies,
`Authorization`, einem `api-key`-Query-Parameter oder einem `API-Key`-Header
umgangen. Query-Strings werden im Access-Log vollständig maskiert, damit darin
enthaltene Zugangsdaten nicht protokolliert werden.

Hinter dem OpenShift-Router oder einem anderen Reverse Proxy wird das
ursprüngliche Schema aus `X-Forwarded-Proto` ausgewertet. Host, Schema und
öffentlicher Port werden an PHP-FPM weitergegeben, damit Drupal korrekte
absolute URLs erzeugen kann.

## Lokale Installation ohne Container

1. PHP-Abhängigkeiten installieren:

   ```shell
   composer install
   ```

2. `.env.example` nach `.env` kopieren und die Datenbank-, Datei- und
   Host-Einstellungen anpassen.

3. Einen Webserver mit `web/` als Document Root konfigurieren.

4. Eine vorhandene Datenbank importieren und das öffentliche Dateiverzeichnis
   nach `web/sites/default/files` synchronisieren.

5. Datenbank und Konfiguration auf den Stand des Codes bringen:

   ```shell
   vendor/bin/drush updatedb -y
   vendor/bin/drush config:import -y
   vendor/bin/drush cache:rebuild
   ```

## Frontend entwickeln

Abhängigkeiten installieren:

```shell
yarn install --frozen-lockfile
```

Verfügbare Builds:

```shell
yarn build        # Produktions-Build
yarn build-dev    # Entwicklungs-Build
yarn build-watch  # Entwicklungs-Build mit Dateibeobachtung
```

Der Docker-Build führt automatisch `yarn install --immutable` und
`yarn build` aus.

## Abhängigkeiten aktualisieren

Ein einzelnes Drupal-Modul einschließlich seiner Abhängigkeiten aktualisieren:

```shell
composer update drupal/modulname --with-dependencies
```

Drupal Core einschließlich zusammengehöriger Abhängigkeiten aktualisieren:

```shell
composer update drupal/core-recommended drupal/core-composer-scaffold \
  drupal/core-project-message --with-all-dependencies
```

Die externen Webform-Bibliotheken werden über
`web/modules/contrib/webform/composer.libraries.json` in Composer eingebunden
und unter `web/libraries/` installiert. `composer.json` und `composer.lock`
müssen nach einem Update gemeinsam committed werden.

Nach einem Drupal-Update sollten immer die Datenbank-Updates ausgeführt und
die Konfiguration importiert werden:

```shell
vendor/bin/drush updatedb -y
vendor/bin/drush config:import -y
vendor/bin/drush cache:rebuild
```

Wenn dadurch Konfiguration geändert wurde, muss sie anschließend exportiert
und geprüft werden:

```shell
vendor/bin/drush config:export -y
```

## Migrationen aus Drupal 7

Eine konfigurierte Migration ausführen:

```shell
vendor/bin/drush migrate:import migration_id
```

Eine Migration zurückrollen:

```shell
vendor/bin/drush migrate:rollback migration_id
```

Drupal legt für ausgeführte Migrationen Zuordnungstabellen mit Namen wie
`migrate_map_migration_id` an. Darin können die Beziehungen zwischen Quell-
und Ziel-IDs nachvollzogen werden.

## Continuous Integration

GitHub Actions validiert die Composer-Konfiguration und baut das Container-
Image mit Docker Buildx. Builds des `master`-Branches werden als `latest`,
Builds des `test`-Branches als `test` in der GitHub Container Registry
veröffentlicht. Versionstags auf `master` erhalten zusätzlich den jeweiligen
Tag und den Alias `tagged`.
