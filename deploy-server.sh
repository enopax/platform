#!/bin/bash
# Server Deployment Script for IPFS Storage Platform
# This script helps deploy the application on a production server

set -e  # Exit on error

echo "🚀 IPFS Storage Platform - Production Deployment"
echo "================================================"
echo ""

# Colour codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Colour

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
echo -e "${GREEN}✓ Docker Compose is installed${NC}"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    cp .env.production.example .env.production
    echo -e "${RED}❗ IMPORTANT: Edit .env.production with your production values${NC}"
    echo -e "${RED}   Especially generate a new AUTH_SECRET: openssl rand -base64 32${NC}"
    echo ""
    read -p "Press Enter after editing .env.production to continue..."
fi

# Generate AUTH_SECRET if not set or if placeholder exists
if ! grep -q "^AUTH_SECRET=" .env.production || grep -q "generate-with-openssl-rand-base64-32" .env.production; then
    echo -e "${YELLOW}⚠️  Generating AUTH_SECRET...${NC}"
    NEW_SECRET=$(openssl rand -base64 32)

    if grep -q "^AUTH_SECRET=" .env.production; then
        # Replace existing AUTH_SECRET line
        sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${NEW_SECRET}\"|" .env.production
    else
        # Add AUTH_SECRET if not present
        echo "AUTH_SECRET=\"${NEW_SECRET}\"" >> .env.production
    fi

    echo -e "${GREEN}✓ AUTH_SECRET generated${NC}"
fi

echo ""
echo "📋 Pre-deployment Checklist:"
echo "  1. Database credentials configured"
echo "  2. AUTH_SECRET generated"
echo "  3. AUTH_URL set to your domain/IP"
echo "  4. Optional: Payment providers configured"
echo "  5. Optional: Email server configured"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Export environment variables from .env.production for docker-compose
echo ""
echo "📦 Loading environment variables..."
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}❌ .env.production not found!${NC}"
    exit 1
fi

echo ""
echo "🏗️  Building and starting services..."
echo ""

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose -f docker-compose.web.yml pull

# Build Next.js application
echo "🔨 Building Next.js application..."
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml build nextjs-app

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml ps

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Access your application:"
echo "  - Next.js App: http://localhost:3000"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Swagger: http://localhost:3002"
echo ""
echo "📝 View logs:"
echo "  docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down"
echo ""