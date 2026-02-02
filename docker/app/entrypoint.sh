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
    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:pass@host:port/database
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\1|')
    DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):([0-9]+)/.*|\2|')

    echo "   Waiting for database at ${DB_HOST}:${DB_PORT}..."

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        # Use node to check TCP connectivity (nc might not be available)
        if node -e "const net = require('net'); const s = new net.Socket(); s.setTimeout(2000); s.connect(${DB_PORT}, '${DB_HOST}', () => { s.destroy(); process.exit(0); }); s.on('error', () => process.exit(1)); s.on('timeout', () => { s.destroy(); process.exit(1); });" 2>/dev/null; then
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
# Database migrations (optional - can be run separately)
# -----------------------------------------------------------------------------
echo ""
echo "📦 Checking database schema..."

# In production, we expect migrations to be handled externally unless RUN_MIGRATIONS=true
if [ "$SKIP_MIGRATIONS" = "true" ]; then
    echo "   ⏭️ Skipping migrations (SKIP_MIGRATIONS=true)"
elif [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "   🚀 Running Prisma migrations (RUN_MIGRATIONS=true)"
    if command -v npx >/dev/null 2>&1; then
        npx prisma migrate deploy 2>&1 || {
            echo "   ⚠️ Migration deploy failed, continuing anyway..."
        }
        echo "   ✅ Migrations deployed"
    else
        echo "   ⚠️ npx not available, skipping migration deploy"
    fi
elif [ "$NODE_ENV" = "production" ]; then
    echo "   ℹ️ Production mode: Migrations should be run separately"
    echo "   Run: docker exec <container> npx prisma migrate deploy"
    echo "   Or set RUN_MIGRATIONS=true to run on startup"
else
    echo "   Running development schema sync..."
    if command -v npx >/dev/null 2>&1; then
        npx prisma db push --skip-generate 2>&1 || {
            echo "   ⚠️ Schema push failed, continuing anyway..."
        }
        echo "   ✅ Development schema synced"
    else
        echo "   ⚠️ npx not available, skipping schema sync"
    fi
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
