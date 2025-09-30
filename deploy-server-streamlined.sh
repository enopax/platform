#!/bin/bash
# Streamlined Production Deployment Script
# One command to deploy everything

set -e  # Exit on error

echo "🚀 IPFS Storage Platform - Production Deployment"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Pre-flight checks
echo -e "${BLUE}Step 1/6: Pre-flight checks${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose ready${NC}"
echo ""

# Step 2: Environment configuration
echo -e "${BLUE}Step 2/6: Environment configuration${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.production from template${NC}"
    cp .env.production.example .env.production

    # Generate AUTH_SECRET
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|generate-with-openssl-rand-base64-32|${NEW_SECRET}|" .env.production

    echo -e "${GREEN}✓ Generated AUTH_SECRET${NC}"
    echo -e "${RED}❗ IMPORTANT: Edit .env.production with your values:${NC}"
    echo -e "   - DATABASE_URL (if using custom credentials)"
    echo -e "   - AUTH_URL (set to your server IP/domain)"
    echo ""
    read -p "Press Enter after editing .env.production..."
fi

# Verify critical variables
if ! grep -q "^AUTH_SECRET=" .env.production || grep -q "generate-with" .env.production; then
    echo -e "${YELLOW}⚠️  Generating missing AUTH_SECRET${NC}"
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${NEW_SECRET}\"|" .env.production
    echo -e "${GREEN}✓ AUTH_SECRET generated${NC}"
fi

# Check for placeholder values
if grep -q "hostname:5432\|your-domain" .env.production; then
    echo -e "${RED}❌ .env.production contains placeholder values!${NC}"
    echo -e "   Please update DATABASE_URL and AUTH_URL"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Step 3: Stop existing services
echo -e "${BLUE}Step 3/6: Stopping existing services${NC}"
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down 2>/dev/null || true
echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

# Step 4: Build application
echo -e "${BLUE}Step 4/6: Building application${NC}"
echo "This may take a few minutes..."
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml build nextjs-app
echo -e "${GREEN}✓ Application built${NC}"
echo ""

# Step 5: Start services
echo -e "${BLUE}Step 5/6: Starting services${NC}"
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Wait for database
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose -f docker-compose.web.yml exec -T postgres pg_isready -U yannik -d pinning &> /dev/null; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to start${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Step 6: Wait for application startup
echo -e "${BLUE}Step 6/6: Waiting for application startup${NC}"
echo "Database migrations will run automatically on container start..."
sleep 5

# Check if app is healthy
echo "Checking application health..."
for i in {1..30}; do
    if docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml ps | grep -q "nextjs-app.*Up"; then
        echo -e "${GREEN}✓ Application started successfully${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  Application may still be starting. Check logs with:${NC}"
        echo -e "   docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app"
    fi
    sleep 2
done
echo ""

# Final status check
echo "================================"
echo -e "${BLUE}📊 Deployment Status${NC}"
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml ps
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo "  - Next.js App: http://${SERVER_IP}:3000"
echo "  - Grafana: http://${SERVER_IP}:3001 (admin/admin)"
echo "  - Prometheus: http://${SERVER_IP}:9090"
echo "  - Swagger: http://${SERVER_IP}:3002"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo "  View logs: docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app"
echo "  Stop: docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down"
echo "  Restart: docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml restart nextjs-app"
echo ""