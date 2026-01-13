#!/bin/bash

# =============================================================================
# Install Cron Job for SSL Certificate Renewal
# =============================================================================

set -e

GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_info "Installing SSL renewal cron job..."

# Make sure renew script is executable
chmod +x /opt/2ch-core/scripts/renew-ssl.sh

# Add cron job (runs daily at 3 AM)
CRON_JOB="0 3 * * * /opt/2ch-core/scripts/renew-ssl.sh >> /var/log/2ch-ssl-renew.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
    log_info "Cron job already exists"
else
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    log_info "✅ Cron job installed: Daily at 3 AM"
fi

log_info "Current crontab:"
crontab -l | grep renew-ssl || echo "No SSL renewal job found"
