#!/bin/bash

# ==========================================
# Ferraco CRM - SSL Setup Script
# Domain: painelcheckar.com.br
# ==========================================

set -e

echo "========================================="
echo "Ferraco CRM - SSL Certificate Setup"
echo "Domain: painelcheckar.com.br"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
DOMAIN="painelcheckar.com.br"
WWW_DOMAIN="www.painelcheckar.com.br"
EMAIL="${CERTBOT_EMAIL:-admin@painelcheckar.com.br}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  WWW Domain: $WWW_DOMAIN"
echo "  Email: $EMAIL"
echo ""

# Ask for confirmation
read -p "Is this information correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted by user${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Step 1: Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

echo -e "${GREEN}Step 2: Checking DNS configuration...${NC}"
echo "Please ensure that the following DNS records are configured:"
echo "  A record: $DOMAIN -> Your server IP"
echo "  A record: $WWW_DOMAIN -> Your server IP"
echo ""

# Try to resolve domain
SERVER_IP=$(dig +short $DOMAIN | tail -n1)
if [ -z "$SERVER_IP" ]; then
    echo -e "${YELLOW}Warning: Could not resolve $DOMAIN${NC}"
    echo "Make sure DNS is properly configured before continuing"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Domain resolves to: $SERVER_IP${NC}"
fi

echo ""
echo -e "${GREEN}Step 3: Starting application without SSL...${NC}"

# Start the application in HTTP mode first
cd ..
docker-compose -f docker-compose.production.yml up -d ferraco-app

echo "Waiting for application to be ready..."
sleep 10

# Check if application is running
if ! docker ps | grep -q ferraco-crm-production; then
    echo -e "${RED}Error: Application container is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Application is running${NC}"
echo ""

echo -e "${GREEN}Step 4: Obtaining SSL certificate...${NC}"

# Run Certbot to obtain certificate
docker-compose -f docker-compose.production.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN \
    -d $WWW_DOMAIN

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to obtain SSL certificate${NC}"
    echo "Please check the logs and try again"
    exit 1
fi

echo -e "${GREEN}✓ SSL certificate obtained successfully${NC}"
echo ""

echo -e "${GREEN}Step 5: Updating Nginx configuration...${NC}"

# Backup current nginx config
cp docker/nginx.conf docker/nginx.conf.bak

# Uncomment HTTPS server block in nginx.conf
sed -i 's/^    # server {$/    server {/g' docker/nginx.conf
sed -i 's/^    #     /    /g' docker/nginx.conf
sed -i 's/^    # }$/    }/g' docker/nginx.conf

echo -e "${GREEN}✓ Nginx configuration updated${NC}"
echo ""

echo -e "${GREEN}Step 6: Restarting application with SSL...${NC}"

# Rebuild and restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

echo "Waiting for application to restart..."
sleep 15

# Check if application is running
if ! docker ps | grep -q ferraco-crm-production; then
    echo -e "${RED}Error: Application failed to restart${NC}"
    echo "Restoring backup configuration..."
    mv docker/nginx.conf.bak docker/nginx.conf
    docker-compose -f docker-compose.production.yml up -d
    exit 1
fi

echo -e "${GREEN}✓ Application restarted with SSL${NC}"
echo ""

echo -e "${GREEN}Step 7: Testing SSL certificate...${NC}"

# Wait a bit for nginx to fully start
sleep 5

# Test HTTPS
if curl -f -s -k https://$DOMAIN/health > /dev/null; then
    echo -e "${GREEN}✓ HTTPS is working correctly${NC}"
else
    echo -e "${YELLOW}Warning: HTTPS test failed, but certificate was installed${NC}"
    echo "You may need to check nginx logs: docker-compose -f docker-compose.production.yml logs ferraco-app"
fi

echo ""
echo "========================================="
echo -e "${GREEN}SSL Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Your application is now accessible at:"
echo "  https://$DOMAIN"
echo "  https://$WWW_DOMAIN"
echo ""
echo "Certificate details:"
echo "  Issuer: Let's Encrypt"
echo "  Valid for: 90 days"
echo "  Auto-renewal: Enabled (every 12 hours)"
echo ""
echo "Important:"
echo "  • HTTP traffic will be redirected to HTTPS"
echo "  • Certificate will be automatically renewed"
echo "  • Backup config saved at: docker/nginx.conf.bak"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "To test renewal:"
echo "  docker-compose -f docker-compose.production.yml run --rm certbot renew --dry-run"
echo ""
echo -e "${GREEN}Done!${NC}"
