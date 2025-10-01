#!/bin/bash
set -e

echo "========================================="
echo "🚀 Production Deployment Script"
echo "========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found"
    echo "📝 Create it from the template:"
    echo "   cp .env.production.example .env.production"
    echo "   nano .env.production"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull

# Show what changed
echo ""
echo "📋 Recent changes:"
git log --oneline -5
echo ""

# Rebuild and restart Next.js container
echo "🔨 Rebuilding Next.js application (no cache)..."
docker compose -f docker-compose.prod.yml build --no-cache nextjs-app

echo ""
echo "♻️  Restarting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Recent logs from Next.js app:"
docker compose -f docker-compose.prod.yml logs --tail=20 nextjs-app

echo ""
echo "========================================="
echo "✅ Deployment complete!"
echo "========================================="
echo ""
echo "💡 Useful commands:"
echo "   View logs:    docker compose -f docker-compose.prod.yml logs -f nextjs-app"
echo "   Check status: docker compose -f docker-compose.prod.yml ps"
echo "   Stop all:     docker compose -f docker-compose.prod.yml down"
echo ""
