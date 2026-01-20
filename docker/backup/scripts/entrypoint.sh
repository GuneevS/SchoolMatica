#!/bin/bash
# =============================================================================
# Backup Service Entrypoint
# Initializes backup scheduling and runs the service
# =============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              SchoolMatica Backup Service                              ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------------------
# Environment validation
# -----------------------------------------------------------------------------
echo "🔍 Validating environment..."

if [ -z "$POSTGRES_HOST" ]; then
    echo "❌ ERROR: POSTGRES_HOST is not set"
    exit 1
fi

if [ -z "$POSTGRES_USER" ]; then
    echo "❌ ERROR: POSTGRES_USER is not set"
    exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ ERROR: POSTGRES_PASSWORD is not set"
    exit 1
fi

if [ -z "$POSTGRES_DB" ]; then
    echo "❌ ERROR: POSTGRES_DB is not set"
    exit 1
fi

echo "✅ Environment validated"

# -----------------------------------------------------------------------------
# Create pgpass file for passwordless authentication
# -----------------------------------------------------------------------------
echo "🔐 Setting up authentication..."
echo "$POSTGRES_HOST:5432:$POSTGRES_DB:$POSTGRES_USER:$POSTGRES_PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass

# -----------------------------------------------------------------------------
# Setup cron schedule
# -----------------------------------------------------------------------------
echo "⏰ Setting up backup schedule: $BACKUP_SCHEDULE"

# Create cron job
echo "$BACKUP_SCHEDULE /scripts/backup.sh >> /logs/backup.log 2>&1" > /etc/crontabs/root

# -----------------------------------------------------------------------------
# Wait for database to be ready
# -----------------------------------------------------------------------------
echo "⏳ Waiting for database connection..."

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; then
        echo "✅ Database connection established"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   ⏳ Database not ready, retrying... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Failed to connect to database"
    exit 1
fi

# -----------------------------------------------------------------------------
# Run initial backup if requested
# -----------------------------------------------------------------------------
if [ "$RUN_INITIAL_BACKUP" = "true" ]; then
    echo "📦 Running initial backup..."
    /scripts/backup.sh
fi

# -----------------------------------------------------------------------------
# Create health check file
# -----------------------------------------------------------------------------
touch /tmp/backup-healthy

# -----------------------------------------------------------------------------
# Start cron daemon
# -----------------------------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    Backup Service Running                             ║"
echo "║                                                                        ║"
echo "║  Schedule: $BACKUP_SCHEDULE"
echo "║  Retention: $BACKUP_RETENTION_DAYS days"
echo "║  Timezone: $TZ"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

exec "$@"
