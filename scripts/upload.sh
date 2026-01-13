#!/bin/bash

# =============================================================================
# Upload 2ch-core to Production Server
# =============================================================================

set -e

# Configuration
SERVER_IP="139.180.199.219"
SERVER_USER="root"
REMOTE_DIR="/opt/2ch-core"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_info "Uploading 2ch-core to $SERVER_USER@$SERVER_IP:$REMOTE_DIR"

# Create remote directory if it doesn't exist
log_info "Creating remote directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Upload files using rsync
log_info "Syncing files..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'db/backup/*.sql*' \
  --progress \
  . $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

log_info "Upload completed successfully!"
log_info "Next steps:"
echo "1. SSH to server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Run deployment: cd $REMOTE_DIR && sudo ./scripts/deploy.sh"
