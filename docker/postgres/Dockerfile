# =============================================================================
# SchoolMatica PostgreSQL Dockerfile
# Production-optimized with custom configuration
# =============================================================================

FROM postgres:15-alpine

# Install additional packages
RUN apk add --no-cache \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=Africa/Johannesburg

# Copy custom configuration
COPY docker/postgres/postgresql.conf /etc/postgresql/postgresql.conf

# Copy initialization scripts
COPY docker/postgres/init/ /docker-entrypoint-initdb.d/

# Set ownership
RUN chown -R postgres:postgres /docker-entrypoint-initdb.d/

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD pg_isready -U ${POSTGRES_USER:-schoolmatica} -d ${POSTGRES_DB:-schoolmatica} || exit 1

# Expose PostgreSQL port
EXPOSE 5432

# Labels
LABEL org.opencontainers.image.title="SchoolMatica PostgreSQL"
LABEL org.opencontainers.image.description="PostgreSQL database for SchoolMatica"

# Use custom configuration
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
