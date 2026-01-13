#!/bin/bash

# =============================================================================
# Renew SSL Certificate for 2ch.tw
# Should be run via cron (e.g., daily)
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

# Change to project directory
cd /opt/2ch-core

log_info "Checking SSL certificate renewal..."

# Try to renew certificate
docker compose -f docker-compose.deploy.yml run --rm certbot renew

# If renewal happened, reload nginx
if [ $? -eq 0 ]; then
    log_info "Reloading nginx..."
    docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
    log_info "✅ SSL certificate renewal completed"
else
    log_warn "Certificate renewal not needed or failed"
fi
