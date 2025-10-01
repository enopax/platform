#!/bin/bash
# Pre-deployment check script

echo "========================================="
echo "🔍 Pre-Deployment Checks"
echo "========================================="
echo ""

ERRORS=0

# Check if ports are available
echo "Checking port availability..."

# Check port 5432 (PostgreSQL)
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tulpn 2>/dev/null | grep -q ":5432 " ; then
    echo "❌ Port 5432 is already in use!"
    echo "   Finding what's using it..."
    lsof -i :5432 2>/dev/null || ss -tulpn | grep ":5432 "
    echo ""
    echo "   To fix, run:"
    echo "   docker ps | grep 5432"
    echo "   docker stop <container-id>"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Port 5432 is available"
fi

# Check port 3000 (Next.js)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tulpn 2>/dev/null | grep -q ":3000 " ; then
    echo "❌ Port 3000 is already in use!"
    echo "   Finding what's using it..."
    lsof -i :3000 2>/dev/null || ss -tulpn | grep ":3000 "
    echo ""
    echo "   To fix, run:"
    echo "   docker ps | grep 3000"
    echo "   docker stop <container-id>"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Port 3000 is available"
fi

echo ""
echo "Checking for old containers..."

# List all non-next-app containers
OLD_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -vE "^next-app-" || true)

if [ ! -z "$OLD_CONTAINERS" ]; then
    echo "⚠️  Found old containers:"
    echo "$OLD_CONTAINERS" | while read container; do
        echo "   - $container"
    done
    echo ""
    echo "   Run cleanup script to remove them:"
    echo "   ./cleanup-old-containers.sh"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No old containers found"
fi

echo ""
echo "========================================="

if [ $ERRORS -gt 0 ]; then
    echo "❌ Found $ERRORS issue(s) - Please fix before deploying"
    echo "========================================="
    exit 1
else
    echo "✅ All checks passed - Ready to deploy!"
    echo "========================================="
    echo ""
    echo "Run: docker compose -f docker-compose.prod.yml up -d --build"
    exit 0
fi
