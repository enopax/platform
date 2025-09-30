#!/bin/bash
# Pre-deployment verification script
# Run this locally to verify deployment readiness

set -e

echo "🔍 Pre-Deployment Verification"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0

# Check 1: Required files exist
echo "📋 Checking required files..."
REQUIRED_FILES=(
    "Dockerfile.prod"
    ".env.production.example"
    "docker-compose.web.yml"
    "docker-compose.web.prod.yml"
    "prisma/schema.prisma"
    "deploy-server.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file missing"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check 2: .env.production exists
echo "🔐 Checking environment configuration..."
if [ -f ".env.production" ]; then
    echo -e "  ${GREEN}✓${NC} .env.production exists"

    # Check required variables
    REQUIRED_VARS=("DATABASE_URL" "AUTH_SECRET" "AUTH_URL")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.production; then
            value=$(grep "^${var}=" .env.production | cut -d'=' -f2-)
            if [[ "$value" == *"your-"* ]] || [[ "$value" == *"generate-"* ]] || [[ "$value" == *"hostname"* ]]; then
                echo -e "  ${YELLOW}⚠${NC}  $var has placeholder value"
                ERRORS=$((ERRORS + 1))
            else
                echo -e "  ${GREEN}✓${NC} $var is set"
            fi
        else
            echo -e "  ${RED}✗${NC} $var not found"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "  ${RED}✗${NC} .env.production not found"
    echo -e "  ${YELLOW}→${NC} Copy .env.production.example to .env.production and configure it"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Docker is installed
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker is installed ($(docker --version))"

    if docker ps &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Docker is running"
    else
        echo -e "  ${RED}✗${NC} Docker daemon not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} Docker not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 4: Docker Compose is available
echo "🔧 Checking Docker Compose..."
if docker compose version &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker Compose v2 available ($(docker compose version))"
elif command -v docker-compose &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker Compose v1 available ($(docker-compose --version))"
else
    echo -e "  ${RED}✗${NC} Docker Compose not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Node.js and npm (for migrations)
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Node.js installed ($(node --version))"

    if command -v npm &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} npm installed ($(npm --version))"

        # Check if node_modules exists
        if [ -d "node_modules" ]; then
            echo -e "  ${GREEN}✓${NC} node_modules directory exists"

            # Check if Prisma CLI is available
            if [ -d "node_modules/prisma" ]; then
                echo -e "  ${GREEN}✓${NC} Prisma CLI available"
            else
                echo -e "  ${YELLOW}⚠${NC}  Prisma CLI not found - run 'npm install' first"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo -e "  ${YELLOW}⚠${NC}  node_modules not found - run 'npm install' first"
            ERRORS=$((ERRORS + 1))
        fi
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  Node.js not found (needed for migrations)"
    echo -e "  ${YELLOW}→${NC} Migrations must be run from a machine with Node.js"
fi
echo ""

# Check 6: Prisma migrations exist
echo "🗄️  Checking Prisma migrations..."
if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(find prisma/migrations -name "migration.sql" | wc -l | tr -d ' ')
    echo -e "  ${GREEN}✓${NC} Found $MIGRATION_COUNT migration(s)"
else
    echo -e "  ${RED}✗${NC} No migrations directory found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: Git repository status
echo "📝 Checking Git status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Git repository"

    BRANCH=$(git branch --show-current)
    echo -e "  ${GREEN}✓${NC} Current branch: $BRANCH"

    if [ "$BRANCH" = "deploy/demo-v1" ]; then
        echo -e "  ${GREEN}✓${NC} On deployment branch"
    else
        echo -e "  ${YELLOW}⚠${NC}  Not on deploy/demo-v1 branch"
    fi

    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        echo -e "  ${GREEN}✓${NC} No uncommitted changes"
    else
        echo -e "  ${YELLOW}⚠${NC}  Uncommitted changes detected"
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  Not a git repository"
fi
echo ""

# Summary
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment${NC}"
    echo ""
    echo "To deploy:"
    echo "  ./deploy-server.sh"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS issue(s) that need to be fixed${NC}"
    echo ""
    echo "Please fix the issues above before deploying"
    exit 1
fi