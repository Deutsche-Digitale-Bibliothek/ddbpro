FROM composer:2 AS cchain
COPY / /tmp/ddbpro
WORKDIR /tmp/ddbpro
RUN composer install --no-dev

# Add git tag version to PHP file
RUN { \
        echo -e "$(git describe --tags)"; \
    } >> /tmp/ddbpro/version; \
    rm -rf .git/;

FROM node:22-alpine AS nchain
COPY --from=cchain /tmp/ddbpro/ /tmp/ddbpro
WORKDIR /tmp/ddbpro
RUN yarn install && yarn build

FROM php:8.3-fpm-alpine
LABEL org.opencontainers.image.authors="m.buechner@dnb.de"

# Install packages
RUN apk --update --no-cache add -X https://dl-cdn.alpinelinux.org/alpine/edge/community supercronic; \
    apk --update --no-cache add \
       curl \
       ghostscript \
       imagemagick \
       ffmpeg \
       nginx \
       nginx-mod-http-brotli \
       redis \
       supervisor;

RUN set -eux; \
     \
     apk add --no-cache --virtual .build-deps \
          coreutils \
          imagemagick-dev \
          freetype-dev \
          libjpeg-turbo-dev \
          libpng-dev \
          libwebp-dev \
          libavif-dev \
          libzip-dev \
          pcre-dev \
          autoconf \
          g++ \
          make \
          git \
          # postgresql-dev is needed for https://bugs.alpinelinux.org/issues/3642
          postgresql-dev; \
     \
     docker-php-ext-configure gd \
          --with-freetype \
          --with-jpeg \
          --with-webp \
          --with-avif; \
     \
     docker-php-ext-install -j "$(nproc)" \
          gd \
          opcache \
          pdo_mysql \
          pdo_pgsql \
          zip; \
     pecl channel-update pecl.php.net; \
     pecl install oauth apcu redis; \
     docker-php-ext-enable apcu oauth redis; \
     \
     # Source: https://github.com/docker-library/wordpress/blob/3f1a0cab9f2f938bbc57f5f92ec11eeea4511636/latest/php8.3/fpm-alpine/Dockerfile#L47
     # WARNING: imagick is likely not supported on Alpine: https://github.com/Imagick/imagick/issues/328
     # https://pecl.php.net/package/imagick
     # https://github.com/Imagick/imagick/commit/5ae2ecf20a1157073bad0170106ad0cf74e01cb6 (causes a lot of build failures, but strangely only intermittent ones 🤔)
     # see also https://github.com/Imagick/imagick/pull/641
     # this is "pecl install imagick-3.7.0", but by hand so we can apply a small hack / part of the above commit
     curl -fL -o imagick.tgz 'https://pecl.php.net/get/imagick-3.7.0.tgz'; \
     echo '5a364354109029d224bcbb2e82e15b248be9b641227f45e63425c06531792d3e *imagick.tgz' | sha256sum -c -; \
     tar --extract --directory /tmp --file imagick.tgz imagick-3.7.0; \
     grep '^//#endif$' /tmp/imagick-3.7.0/Imagick.stub.php; \
     test "$(grep -c '^//#endif$' /tmp/imagick-3.7.0/Imagick.stub.php)" = '1'; \
     sed -i -e 's!^//#endif$!#endif!' /tmp/imagick-3.7.0/Imagick.stub.php; \
     grep '^//#endif$' /tmp/imagick-3.7.0/Imagick.stub.php && exit 1 || :; \
     docker-php-ext-install /tmp/imagick-3.7.0; \
     rm -rf imagick.tgz /tmp/imagick-3.7.0; \
     \
     runDeps="$( \
          scanelf --needed --nobanner --format '%n#p' --recursive /usr/local \
               | tr ',' '\n' \
               | sort -u \
               | awk 'system("[ -e /usr/local/lib/" $1 " ]") == 0 { next } { print "so:" $1 }' \
     )"; \
     apk add --no-network --virtual .drupal-phpexts-rundeps $runDeps; \
     apk del --no-network .build-deps;

ENV RUN_USER=nobody
ENV RUN_GROUP=0

# add PHP config
COPY --chown=${RUN_USER}:${RUN_GROUP} ./config/php/ /usr/local/etc/php/conf.d/

# add NGINX config
COPY --chown=${RUN_USER}:${RUN_GROUP} config/nginx/*.conf /etc/nginx/
COPY --chown=${RUN_USER}:${RUN_GROUP} config/nginx/mime.types /etc/nginx/mime.types
COPY --chown=${RUN_USER}:${RUN_GROUP} config/nginx/conf.d/ /etc/nginx/conf.d/ 
COPY --chown=${RUN_USER}:${RUN_GROUP} config/nginx/.authpasswd /etc/nginx/.authpasswd

# add cron jobs
COPY --chown=${RUN_USER}:${RUN_GROUP} config/cron/* /etc/crontabs/

# add supervisord config
COPY --chown=${RUN_USER}:${RUN_GROUP} config/supervisord/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Add application
WORKDIR /var/www/html
COPY --chown=${RUN_USER}:${RUN_GROUP} --from=nchain /tmp/ddbpro/ .
ENV PATH=${PATH}:/var/www/html/vendor/bin

RUN \
    # Create symlink for php8
    ln -s /usr/bin/php8 /usr/bin/php; \
    # Use the default PHP production configuration
    mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"; \
    # Move entrypoint script in place
    mv scripts/docker-php-entrypoint-drupal.sh /usr/local/bin/docker-php-entrypoint-drupal; \
    mv scripts/drupal-maintenance.sh /usr/local/bin/drupal-maintenance; \
    # Generate SSL certificates fpr HTTP2
    # Generating signing SSL private key
    openssl genrsa -des3 -passout pass:foobar -out /etc/ssl/mykey.pem 2048; \
    # Removing passphrase from private key
    cp /etc/ssl/mykey.pem /etc/ssl/mykey.pem.orig; \
    openssl rsa -passin pass:foobar -in /etc/ssl/mykey.pem.orig -out /etc/ssl/mykey.pem; \
    # Generating certificate signing request
    openssl req -new -key /etc/ssl/mykey.pem -out /etc/ssl/mycert.csr -subj "/C=DE/ST=DE/L=Frankfurt am Main/O=Deutsche Nationalbibliothek/OU=GD.DDB/CN=DDBpro"; \
    # Generating self-signed certificate
    openssl x509 -req -days 3650 -in /etc/ssl/mycert.csr -signkey /etc/ssl/mykey.pem -out /etc/ssl/mycert.pem; \
    # Make sure files/folders needed by the processes are accessable when they run under the nobody user
    mkdir /var/cache/nginx; \
    chgrp -R ${RUN_GROUP} /run /var/cache/nginx/ /var/lib/nginx/ /var/log/nginx/ /var/www/html/ /etc/ssl/mycert.pem /etc/ssl/mykey.pem /etc/nginx/.authpasswd; \
    chmod -R g=u /run/ /etc/nginx/conf.d/ /etc/nginx/*.conf /var/cache/nginx/ /var/lib/nginx/ /var/log/nginx/ /var/www/html/ /etc/ssl/mycert.pem /etc/ssl/mykey.pem /etc/nginx/.authpasswd; \
    chmod 751 /usr/local/bin/docker-php-entrypoint-drupal /usr/local/bin/drupal-maintenance /var/www/html/vendor/drush/drush/drush /var/www/html/web/sites/default; \
    chmod 440 /var/www/html/web/sites/default/settings.php /var/www/html/web/sites/default/settings.local.php /var/www/html/web/sites/default/services.yml; \
    # add permissions for suervisor & nginx user
    touch /run/supervisord.pid && chgrp -R ${RUN_GROUP} /run/supervisord.pid && chmod -R g=u /run/supervisord.pid; \
    touch /run/nginx/nginx.pid && chgrp -R ${RUN_GROUP} /run/nginx/nginx.pid && chmod -R g=u /run/nginx/nginx.pid;

# Switch to use a non-root user
USER ${RUN_USER}:${RUN_GROUP}

ENTRYPOINT ["docker-php-entrypoint-drupal"]

# Expose the ports for nginx
EXPOSE 8080 4430

# supervisord starts nginx & php-fpm
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
