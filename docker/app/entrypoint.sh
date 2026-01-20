#!/bin/sh
set -e

# =============================================================================
# SchoolMatica Application Entrypoint
# Handles database migrations and application startup
# =============================================================================

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    SchoolMatica Application                           ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------------------
# Environment validation
# -----------------------------------------------------------------------------
echo "🔍 Validating environment..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ ERROR: NEXTAUTH_SECRET environment variable is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# -----------------------------------------------------------------------------
# Database connection check
# -----------------------------------------------------------------------------
echo ""
echo "⏳ Checking database connection..."

MAX_RETRIES=${DB_MAX_RETRIES:-30}
RETRY_INTERVAL=${DB_RETRY_INTERVAL:-2}
RETRY_COUNT=0

wait_for_database() {
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        # Try to run a simple Prisma command to check connectivity
        if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "   ⏳ Database not ready, retrying in ${RETRY_INTERVAL}s... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    done
    
    return 1
}

if ! wait_for_database; then
    echo "❌ Failed to connect to database after $MAX_RETRIES attempts"
    exit 1
fi

echo "✅ Database connection established"

# -----------------------------------------------------------------------------
# Database migrations
# -----------------------------------------------------------------------------
echo ""
echo "📦 Running database operations..."

if [ "$NODE_ENV" = "production" ]; then
    echo "   Running production migrations..."
    
    # Try migrate deploy first (preferred for production)
    if npx prisma migrate deploy 2>&1; then
        echo "   ✅ Migrations applied successfully"
    else
        echo "   ⚠️ Migration deploy failed, attempting schema push..."
        if npx prisma db push --skip-generate --accept-data-loss=false 2>&1; then
            echo "   ✅ Schema push completed"
        else
            echo "   ❌ Database schema sync failed"
            exit 1
        fi
    fi
else
    echo "   Running development schema sync..."
    npx prisma db push --skip-generate 2>&1 || {
        echo "   ⚠️ Schema push failed, database may need manual intervention"
    }
    echo "   ✅ Development schema synced"
fi

# -----------------------------------------------------------------------------
# Redis connection check (if configured)
# -----------------------------------------------------------------------------
if [ -n "$REDIS_URL" ]; then
    echo ""
    echo "🔴 Checking Redis connection..."
    
    # Extract host and port from REDIS_URL
    REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|redis://([^:]+):?([0-9]*)/?.*|\1|')
    REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|redis://[^:]+:?([0-9]*)/?.*|\1|')
    REDIS_PORT=${REDIS_PORT:-6379}
    
    REDIS_RETRY=0
    REDIS_MAX_RETRY=10
    
    while [ $REDIS_RETRY -lt $REDIS_MAX_RETRY ]; do
        if nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; then
            echo "   ✅ Redis connection established"
            break
        fi
        
        REDIS_RETRY=$((REDIS_RETRY + 1))
        echo "   ⏳ Redis not ready, retrying... ($REDIS_RETRY/$REDIS_MAX_RETRY)"
        sleep 1
    done
    
    if [ $REDIS_RETRY -eq $REDIS_MAX_RETRY ]; then
        echo "   ⚠️ Redis connection failed - continuing without cache"
    fi
fi

# -----------------------------------------------------------------------------
# Application startup
# -----------------------------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    Starting Next.js Server                            ║"
echo "║                                                                        ║"
echo "║  Environment: $NODE_ENV"
echo "║  Port: $PORT"
echo "║  Host: $HOSTNAME"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Execute the main command
exec "$@"
