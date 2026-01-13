#!/bin/bash

# =============================================================================
# Setup SSL Certificate for 2ch.tw
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

DOMAIN="2ch.tw"
EMAIL="admin@2ch.tw"  # 請修改為你的電子郵件

log_info "Setting up SSL certificate for $DOMAIN"

# 檢查是否在正確的目錄
if [ ! -f "docker-compose.deploy.yml" ]; then
    log_error "Please run this script from /opt/2ch-core directory"
    exit 1
fi

# 停止 nginx 以釋放 80 端口
log_info "Stopping nginx..."
docker compose -f docker-compose.deploy.yml stop nginx

# 申請證書
log_info "Requesting SSL certificate..."
docker compose -f docker-compose.deploy.yml run --rm -p 80:80 certbot certonly \
    --standalone \
    --non-interactive \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# 檢查證書是否成功申請
if [ -d "/var/lib/docker/volumes/2ch-core_certbot_conf/_data/live/$DOMAIN" ]; then
    log_info "SSL certificate obtained successfully!"

    # 更新 nginx 配置
    log_info "Updating nginx configuration..."
    cp nginx/conf.d/2ch-ssl.conf.template nginx/conf.d/2ch.conf

    # 啟動所有服務
    log_info "Starting services..."
    docker compose -f docker-compose.deploy.yml up -d

    log_info "✅ SSL setup completed!"
    log_info "Your site is now available at: https://$DOMAIN"
else
    log_error "Failed to obtain SSL certificate"
    log_warn "Starting nginx with HTTP only..."
    docker compose -f docker-compose.deploy.yml start nginx
    exit 1
fi
