#!/bin/bash
# Database migration script
# Run this to apply Prisma migrations to the database

echo "🔄 Running database migrations..."

# Run migrations using docker-compose exec
docker-compose -f docker-compose.web.yml exec -T postgres psql -U yannik -d pinning -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Database is accessible"

    # Run migrations from the host where we have full node_modules
    cd "$(dirname "$0")"
    npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully!"
    else
        echo "❌ Migration failed!"
        exit 1
    fi
else
    echo "❌ Cannot connect to database"
    exit 1
fi