#!/bin/bash
# EC2 user data: installs Docker + Compose and starts Matomo, MariaDB and Caddy (HTTPS).
set -euxo pipefail

DOMAIN=16-171-96-250.sslip.io
APP_DIR=/opt/matomo

# 1 GB swap so MariaDB + Matomo fit comfortably on a 2 GB instance
fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

dnf install -y docker
systemctl enable --now docker
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

mkdir -p $APP_DIR && cd $APP_DIR

cat > .env <<EOF
MARIADB_ROOT_PASSWORD=$(openssl rand -hex 24)
MARIADB_PASSWORD=$(openssl rand -hex 24)
EOF
chmod 600 .env

cat > Caddyfile <<EOF
$DOMAIN {
	reverse_proxy matomo:80
}
EOF

cat > docker-compose.yml <<'EOF'
services:
  db:
    image: mariadb:11.4
    restart: unless-stopped
    command: --max-allowed-packet=64MB
    environment:
      MARIADB_ROOT_PASSWORD: ${MARIADB_ROOT_PASSWORD}
      MARIADB_DATABASE: matomo
      MARIADB_USER: matomo
      MARIADB_PASSWORD: ${MARIADB_PASSWORD}
    volumes:
      - db:/var/lib/mysql

  matomo:
    image: matomo:5-apache
    restart: unless-stopped
    depends_on:
      - db
    environment:
      MATOMO_DATABASE_HOST: db
      MATOMO_DATABASE_ADAPTER: mysql
      MATOMO_DATABASE_TABLES_PREFIX: matomo_
      MATOMO_DATABASE_USERNAME: matomo
      MATOMO_DATABASE_PASSWORD: ${MARIADB_PASSWORD}
      MATOMO_DATABASE_DBNAME: matomo
    volumes:
      - matomo:/var/www/html

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  db:
  matomo:
  caddy_data:
  caddy_config:
EOF

docker compose up -d
