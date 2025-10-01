#!/bin/sh
set -e

echo "🔄 Synchronising database schema..."

# Push schema to database (no migration files needed)
npx prisma db push --accept-data-loss --skip-generate

if [ $? -eq 0 ]; then
  echo "✅ Database schema synchronised successfully"
else
  echo "❌ Failed to synchronise database schema"
  exit 1
fi

# Start the application
echo "🚀 Starting Next.js application..."
exec node server.js
