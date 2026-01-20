# =============================================================================
# SchoolMatica Redis Dockerfile
# Session management and caching service
# =============================================================================

FROM redis:7-alpine

# Install additional tools
RUN apk add --no-cache \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create data directory
RUN mkdir -p /data && chown redis:redis /data

# Copy custom configuration
COPY docker/redis/redis.conf /usr/local/etc/redis/redis.conf

# Create startup script to handle password
RUN echo '#!/bin/sh' > /docker-entrypoint-init.sh && \
    echo 'if [ -n "$REDIS_PASSWORD" ]; then' >> /docker-entrypoint-init.sh && \
    echo '  sed -i "s/# requirepass.*/requirepass $REDIS_PASSWORD/" /usr/local/etc/redis/redis.conf' >> /docker-entrypoint-init.sh && \
    echo 'fi' >> /docker-entrypoint-init.sh && \
    echo 'exec docker-entrypoint.sh "$@"' >> /docker-entrypoint-init.sh && \
    chmod +x /docker-entrypoint-init.sh

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD redis-cli ping | grep -q PONG || exit 1

# Expose Redis port
EXPOSE 6379

# Labels
LABEL org.opencontainers.image.title="SchoolMatica Redis"
LABEL org.opencontainers.image.description="Redis cache and session store for SchoolMatica"

ENTRYPOINT ["/docker-entrypoint-init.sh"]
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
