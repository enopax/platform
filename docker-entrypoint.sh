#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Run migrations
npx prisma migrate deploy

echo "✅ Migrations complete"

# Start the application
echo "🚀 Starting Next.js application..."
exec node server.js
