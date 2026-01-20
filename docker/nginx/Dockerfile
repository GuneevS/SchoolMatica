# =============================================================================
# SchoolMatica Nginx Reverse Proxy Dockerfile
# Production-grade with security hardening
# =============================================================================

FROM nginx:1.25-alpine

# Install necessary packages
RUN apk add --no-cache \
    curl \
    openssl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create cache directory
RUN mkdir -p /var/cache/nginx/static \
    && chown -R nginx:nginx /var/cache/nginx

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Create directory for Let's Encrypt challenges
RUN mkdir -p /var/www/certbot

# Create error page directory
RUN mkdir -p /usr/share/nginx/html

# Copy custom error pages
COPY docker/nginx/error-pages/50x.html /usr/share/nginx/html/50x.html

# Copy nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Set permissions
RUN chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/ssl \
    && chown -R nginx:nginx /var/www/certbot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/health || exit 1

# Expose ports
EXPOSE 80 443

# Labels
LABEL org.opencontainers.image.title="SchoolMatica Nginx"
LABEL org.opencontainers.image.description="Reverse proxy for SchoolMatica"

CMD ["nginx", "-g", "daemon off;"]
