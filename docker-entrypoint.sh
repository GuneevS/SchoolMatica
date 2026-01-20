#!/bin/sh
set -e

echo "🚀 Starting SchoolMatica..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma db push --skip-generate 2>/dev/null; then
        echo "✅ Database connected and schema synced"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Database not ready, retrying in 2 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Failed to connect to database after $MAX_RETRIES attempts"
    exit 1
fi

# Run database migrations in production
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Running database migrations..."
    npx prisma migrate deploy || {
        echo "⚠️ Migration failed, attempting schema push..."
        npx prisma db push --skip-generate
    }
fi

echo "✅ Database ready"
echo "🌐 Starting Next.js server..."

# Execute the main command
exec "$@"
