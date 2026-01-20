#!/bin/bash
# =============================================================================
# PostgreSQL Backup Script
# Creates compressed backups with optional S3 upload
# =============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="schoolmatica_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"
LOG_FILE="/logs/backup_${TIMESTAMP}.log"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "╔══════════════════════════════════════════════════════════════════════╗"
log "║                    Starting Database Backup                           ║"
log "╚══════════════════════════════════════════════════════════════════════╝"

# -----------------------------------------------------------------------------
# Create backup
# -----------------------------------------------------------------------------
log "📦 Creating backup: $BACKUP_NAME"

pg_dump \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-password \
    --format=plain \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log "❌ Backup failed!"
    exit 1
fi

# -----------------------------------------------------------------------------
# Verify backup integrity
# -----------------------------------------------------------------------------
log "🔍 Verifying backup integrity..."

if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "✅ Backup integrity verified"
else
    log "❌ Backup integrity check failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# -----------------------------------------------------------------------------
# Upload to S3 (if configured)
# -----------------------------------------------------------------------------
if [ -n "$AWS_S3_BUCKET" ]; then
    log "☁️ Uploading to S3: s3://$AWS_S3_BUCKET/backups/$BACKUP_NAME.sql.gz"
    
    if aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/$BACKUP_NAME.sql.gz" \
        --storage-class "${AWS_STORAGE_CLASS:-STANDARD_IA}" \
        --sse AES256 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ S3 upload complete"
        
        # Remove local backup after S3 upload if configured
        if [ "$REMOVE_LOCAL_AFTER_S3" = "true" ]; then
            rm -f "$BACKUP_FILE"
            log "🗑️ Local backup removed after S3 upload"
        fi
    else
        log "⚠️ S3 upload failed, keeping local backup"
    fi
fi

# -----------------------------------------------------------------------------
# Cleanup old backups
# -----------------------------------------------------------------------------
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
log "🧹 Cleaning up backups older than $RETENTION_DAYS days..."

# Clean local backups
LOCAL_DELETED=$(find "$BACKUP_DIR" -name "schoolmatica_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "   Local: Deleted $LOCAL_DELETED old backup(s)"

# Clean S3 backups if configured
if [ -n "$AWS_S3_BUCKET" ] && [ "$CLEANUP_S3_BACKUPS" = "true" ]; then
    # Get date threshold
    THRESHOLD_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    
    log "   S3: Cleaning backups older than $THRESHOLD_DATE"
    
    aws s3 ls "s3://$AWS_S3_BUCKET/backups/" \
        | while read -r line; do
            FILE_DATE=$(echo "$line" | awk '{print $1}')
            FILE_NAME=$(echo "$line" | awk '{print $4}')
            if [[ "$FILE_DATE" < "$THRESHOLD_DATE" ]]; then
                aws s3 rm "s3://$AWS_S3_BUCKET/backups/$FILE_NAME"
                log "   S3: Deleted $FILE_NAME"
            fi
        done
fi

# Clean old log files
find /logs -name "backup_*.log" -type f -mtime +7 -delete

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
log ""
log "╔══════════════════════════════════════════════════════════════════════╗"
log "║                    Backup Complete                                    ║"
log "╚══════════════════════════════════════════════════════════════════════╝"
log ""

# List current backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "schoolmatica_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "Current backups: $BACKUP_COUNT files, Total size: $TOTAL_SIZE"

# Update health check
touch /tmp/backup-healthy

exit 0
