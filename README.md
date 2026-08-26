# DDBpro

Portal für Datenpartner der Deutschen Digitalen Bibliothek auf Basis von
Drupal 11. Das Container-Image enthält PHP 8.5, nginx und Supercronic;
MySQL/MariaDB und optional Redis werden extern bereitgestellt.

## Voraussetzungen

- Docker mit BuildKit
- Lokal zusätzlich: PHP 8.5, Composer 2, MySQL/MariaDB, Node.js 22 und Yarn 1

## Konfiguration

```shell
cp .env.example .env
```

[`.env.example`](.env.example) enthält alle unterstützten Variablen und
containergeeignete Beispielwerte. `CHANGE_ME` und `example.org` sind vor der
Verwendung zu ersetzen. Secrets gehören in OpenShift Secrets und nicht in
versionierte Dateien.

| Bereich | Variablen |
| --- | --- |
| Datenbank | `MYSQL_DATABASE`, `MYSQL_HOSTNAME`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD` |
| Drupal | `HASH_SALT`, `TRUSTED_HOST_PATTERNS`, `FILE_PUBLIC_PATH`, `FILE_PRIVATE_PATH`, `TMP` |
| Redis | `USE_REDIS`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| SMTP | `SMTP_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_PROTOCOL`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` |
| Startaufgaben | `UPDATEDB_ON_STARTUP`, `CONFIG_IMPORT_ON_STARTUP`, `CACHEREBUILD_ON_STARTUP` |
| HTTP Basic Auth | `HTPASSWD_USER`, `HTPASSWD_PWD`, `HTPASSWD_GREETING` |

`localhost` bezeichnet im Container den Container selbst. Externe Datenbank-,
Redis- und SMTP-Hosts müssen über das Container-/OpenShift-Netzwerk erreichbar
sein.

Redis wird mit `USE_REDIS=yes`, SMTP mit `SMTP_ENABLED=yes` aktiviert. Für SMTP
ist `SMTP_HOST` erforderlich; `SMTP_PROTOCOL` akzeptiert `standard`, `tls` oder
`ssl`. Passwörter werden zur Laufzeit aus ENV gelesen und bleiben aus dem
Drupal-Config-Export ausgeschlossen.

Die Beispielpfade `/var/www/html/private` und `/tmp` gelten für den Container
und müssen lokal angepasst werden. Nach Änderungen an Redis- oder SMTP-Werten
den Pod neu starten und `vendor/bin/drush cache:rebuild` ausführen.

## Container

```shell
docker build -t ddbpro .

docker run --rm \
  --env-file .env \
  --publish 8080:8080 \
  --publish 4430:4430 \
  ddbpro
```

Die Anwendung ist unter `http://localhost:8080` beziehungsweise mit
selbstsigniertem Zertifikat unter `https://localhost:4430` erreichbar.

## Lokale Entwicklung

```shell
composer install
yarn install --frozen-lockfile
yarn build-dev
```

Der Webserver benötigt `web/` als Document Root. Nach Code- oder
Konfigurationsänderungen:

```shell
vendor/bin/drush updatedb -y
vendor/bin/drush config:import -y
vendor/bin/drush cache:rebuild
```

Weitere Frontend-Befehle: `yarn build` für Produktion und `yarn build-watch`
für Entwicklung mit Dateibeobachtung.
