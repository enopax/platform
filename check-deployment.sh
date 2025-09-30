#!/bin/bash
# Deployment Health Check Script

echo "🔍 Checking Deployment Health..."
echo "================================="
echo ""

# Check if containers are running
echo "📦 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "nextjs|postgres|NAME"
echo ""

# Check environment variables in container
echo "🔐 Environment Variables in Container:"
docker exec $(docker ps -qf "name=nextjs-app") printenv | grep -E "AUTH_SECRET|AUTH_URL|DATABASE_URL|NODE_ENV" || echo "Container not running"
echo ""

# Check PostgreSQL connection
echo "🗄️  Database Connection:"
docker exec -it $(docker ps -qf "name=postgres") psql -U yannik -d pinning -c "SELECT 1;" 2>&1 | head -5 || echo "Database not accessible"
echo ""

# Check Next.js logs (last 20 lines)
echo "📝 Recent Next.js Logs:"
docker logs $(docker ps -qf "name=nextjs-app") 2>&1 | tail -30
echo ""

echo "================================="
echo "Health check complete!"