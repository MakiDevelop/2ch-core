#!/bin/bash

# =============================================================================
# 2ch.tw Production Deployment Script
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="2ch.tw"
EMAIL="admin@2ch.tw"  # Change this to your email for Let's Encrypt
APP_DIR="/opt/2ch-core"
REPO_URL="git@github.com:YOUR_USERNAME/2ch-core.git"  # Update with your repo

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root (use sudo)"
        exit 1
    fi
}

install_docker() {
    log_info "Installing Docker..."

    # Update package index
    apt-get update

    # Install prerequisites
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker
    systemctl start docker
    systemctl enable docker

    log_info "Docker installed successfully"
}

check_dependencies() {
    log_info "Checking dependencies..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found. Installing..."
        install_docker
    else
        log_info "Docker is installed: $(docker --version)"
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose plugin not found"
        exit 1
    else
        log_info "Docker Compose is installed: $(docker compose version)"
    fi

    # Install git if not present
    if ! command -v git &> /dev/null; then
        log_info "Installing git..."
        apt-get update
        apt-get install -y git
    fi
}

setup_firewall() {
    log_info "Configuring firewall..."

    # Install ufw if not present
    if ! command -v ufw &> /dev/null; then
        apt-get install -y ufw
    fi

    # Configure firewall
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    echo "y" | ufw enable

    log_info "Firewall configured"
}

deploy_code() {
    log_info "Deploying code to $APP_DIR..."

    # Create app directory if it doesn't exist
    mkdir -p $APP_DIR

    # If using git (commented out by default, use rsync/scp instead)
    # cd $APP_DIR
    # if [ -d ".git" ]; then
    #     git pull
    # else
    #     git clone $REPO_URL .
    # fi

    log_info "Code deployment completed (manual rsync/scp required)"
    log_warn "Please manually copy your code to $APP_DIR"
}

setup_environment() {
    log_info "Setting up environment..."

    cd $APP_DIR

    # Copy production environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.prod" ]; then
            cp .env.prod .env
            log_info "Copied .env.prod to .env"
        else
            log_error ".env.prod not found!"
            exit 1
        fi
    else
        log_warn ".env already exists, skipping copy"
    fi
}

build_and_start() {
    log_info "Building and starting services..."

    cd $APP_DIR

    # Build images
    docker compose -f docker-compose.deploy.yml build

    # Start services
    docker compose -f docker-compose.deploy.yml up -d

    log_info "Services started"
}

init_database() {
    log_info "Initializing database..."

    cd $APP_DIR

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    docker compose -f docker-compose.deploy.yml exec -T api npx tsx db/migrate.ts

    log_info "Database initialized"
}

setup_ssl() {
    log_info "Setting up SSL certificate..."

    cd $APP_DIR

    # Check if DNS is configured
    log_warn "Make sure DNS A record for $DOMAIN points to this server!"
    read -p "Has DNS been configured? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Skipping SSL setup. Run this script again after DNS configuration."
        return
    fi

    # Wait a bit for DNS propagation
    log_info "Waiting for DNS propagation..."
    sleep 5

    # Request certificate
    log_info "Requesting SSL certificate for $DOMAIN..."
    docker compose -f docker-compose.deploy.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN

    # Update nginx configuration to use SSL
    if [ -f "nginx/conf.d/2ch-ssl.conf.template" ]; then
        cp nginx/conf.d/2ch-ssl.conf.template nginx/conf.d/2ch.conf
        log_info "Updated nginx configuration to use SSL"

        # Reload nginx
        docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
        log_info "Nginx reloaded"
    fi

    log_info "SSL certificate installed successfully"
}

show_status() {
    log_info "Checking service status..."

    cd $APP_DIR
    docker compose -f docker-compose.deploy.yml ps

    echo ""
    log_info "=== Deployment Summary ==="
    echo "Domain: https://$DOMAIN"
    echo "API Health: http://localhost:3000/health"
    echo "Logs: docker compose -f docker-compose.deploy.yml logs -f"
    echo ""
    log_info "To get your admin IP hash:"
    echo "1. Create a test post: curl -X POST https://$DOMAIN/posts -H 'Content-Type: application/json' -d '{\"content\":\"test\"}'"
    echo "2. Copy the ipHash from the response"
    echo "3. Add it to .env file: ADMIN_IP_HASHES=your_ip_hash"
    echo "4. Restart API: docker compose -f docker-compose.deploy.yml restart api"
}

# Main deployment flow
main() {
    log_info "Starting 2ch.tw deployment..."

    check_root
    check_dependencies
    setup_firewall
    deploy_code
    setup_environment
    build_and_start

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    init_database

    # Ask if user wants to setup SSL now
    read -p "Do you want to setup SSL certificate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    else
        log_warn "SSL setup skipped. You can run 'sudo ./scripts/deploy.sh ssl' later."
    fi

    show_status

    log_info "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    ssl)
        setup_ssl
        ;;
    status)
        show_status
        ;;
    *)
        main
        ;;
esac
