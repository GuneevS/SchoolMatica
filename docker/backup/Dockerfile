# =============================================================================
# SchoolMatica Database Backup Service
# Automated PostgreSQL backups with retention management
# =============================================================================

FROM alpine:3.19

# Install required packages
RUN apk add --no-cache \
    postgresql15-client \
    aws-cli \
    curl \
    bash \
    tzdata \
    gzip \
    openssl \
    && rm -rf /var/cache/apk/*

# Create backup directories
RUN mkdir -p /backups /scripts /logs \
    && chmod 755 /backups /scripts /logs

# Copy backup scripts
COPY docker/backup/scripts/ /scripts/
RUN chmod +x /scripts/*.sh

# Create cron job directory
RUN mkdir -p /etc/periodic/custom

# Set environment defaults
ENV BACKUP_RETENTION_DAYS=30
ENV BACKUP_SCHEDULE="0 2 * * *"
ENV TZ=Africa/Johannesburg

# Volume for backup storage
VOLUME ["/backups"]

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
    CMD test -f /tmp/backup-healthy || exit 1

# Labels
LABEL org.opencontainers.image.title="SchoolMatica Backup"
LABEL org.opencontainers.image.description="Automated database backup service"

ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["crond", "-f", "-l", "2"]
