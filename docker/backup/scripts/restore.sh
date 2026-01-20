#!/bin/bash
# =============================================================================
# PostgreSQL Restore Script
# Restores database from backup file
# =============================================================================

set -e

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Usage
usage() {
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Arguments:"
    echo "  backup_file    Path to the backup file (.sql.gz or .sql)"
    echo ""
    echo "Examples:"
    echo "  $0 /backups/schoolmatica_20240115_020000.sql.gz"
    echo "  $0 s3://bucket/backups/schoolmatica_20240115_020000.sql.gz"
    exit 1
}

# Check arguments
if [ -z "$1" ]; then
    usage
fi

BACKUP_FILE="$1"

log "╔══════════════════════════════════════════════════════════════════════╗"
log "║                    Starting Database Restore                          ║"
log "╚══════════════════════════════════════════════════════════════════════╝"
log ""

# -----------------------------------------------------------------------------
# Environment validation
# -----------------------------------------------------------------------------
if [ -z "$POSTGRES_HOST" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
    log "❌ ERROR: Database environment variables not set"
    exit 1
fi

# -----------------------------------------------------------------------------
# Download from S3 if needed
# -----------------------------------------------------------------------------
if [[ "$BACKUP_FILE" == s3://* ]]; then
    log "☁️ Downloading from S3: $BACKUP_FILE"
    LOCAL_FILE="/tmp/restore_$(date +%s).sql.gz"
    
    if ! aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"; then
        log "❌ S3 download failed"
        exit 1
    fi
    
    BACKUP_FILE="$LOCAL_FILE"
    CLEANUP_FILE=true
    log "✅ Download complete"
fi

# -----------------------------------------------------------------------------
# Verify backup file
# -----------------------------------------------------------------------------
if [ ! -f "$BACKUP_FILE" ]; then
    log "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# -----------------------------------------------------------------------------
# Confirmation prompt (unless forced)
# -----------------------------------------------------------------------------
if [ "$FORCE_RESTORE" != "true" ]; then
    log "⚠️  WARNING: This will OVERWRITE all data in database '$POSTGRES_DB'"
    log "   Backup file: $BACKUP_FILE"
    log ""
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log "❌ Restore cancelled"
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# Create backup of current state (optional)
# -----------------------------------------------------------------------------
if [ "$CREATE_PRE_RESTORE_BACKUP" = "true" ]; then
    log "📦 Creating pre-restore backup..."
    PRE_RESTORE_FILE="/backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    pg_dump \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-password \
        | gzip > "$PRE_RESTORE_FILE"
    
    log "✅ Pre-restore backup created: $PRE_RESTORE_FILE"
fi

# -----------------------------------------------------------------------------
# Terminate existing connections
# -----------------------------------------------------------------------------
log "🔌 Terminating existing database connections..."

PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

# -----------------------------------------------------------------------------
# Restore database
# -----------------------------------------------------------------------------
log "🔄 Restoring database from backup..."

# Determine if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --single-transaction \
        --set ON_ERROR_STOP=on
else
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --single-transaction \
        --set ON_ERROR_STOP=on \
        -f "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    log "✅ Database restored successfully"
else
    log "❌ Restore failed!"
    exit 1
fi

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------
if [ "$CLEANUP_FILE" = "true" ] && [ -f "$LOCAL_FILE" ]; then
    rm -f "$LOCAL_FILE"
    log "🗑️ Temporary file cleaned up"
fi

# -----------------------------------------------------------------------------
# Run post-restore tasks
# -----------------------------------------------------------------------------
log "🔧 Running post-restore tasks..."

# Analyze tables
PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    -c "ANALYZE;" \
    > /dev/null 2>&1

log "✅ Database analyzed"

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
log ""
log "╔══════════════════════════════════════════════════════════════════════╗"
log "║                    Restore Complete                                   ║"
log "╚══════════════════════════════════════════════════════════════════════╝"
log ""
log "Database '$POSTGRES_DB' has been restored from:"
log "  $BACKUP_FILE"

exit 0
