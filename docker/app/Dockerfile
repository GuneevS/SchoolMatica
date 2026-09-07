# ============================================================================
# SchoolMatica Application Dockerfile
# Production-grade multi-stage build optimized for Next.js 16
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with common dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install essential dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Set environment variables for better npm behavior
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# -----------------------------------------------------------------------------
# Stage 2: Dependencies installation (cached layer)
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files only for better caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# -----------------------------------------------------------------------------
# Stage 3: Build the application
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (requires DATABASE_URL placeholder for build)
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder?schema=public"
RUN npx prisma generate

# Build arguments for build-time configuration
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG BUILD_ID

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BUILD_ID=$BUILD_ID

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# -----------------------------------------------------------------------------
# Stage 4: Production runtime
# -----------------------------------------------------------------------------
FROM base AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime (including CLI and its dependencies)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Copy authentication dependencies that are loaded dynamically at runtime
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/next-auth ./node_modules/next-auth
COPY --from=builder /app/node_modules/@auth ./node_modules/@auth

# Copy Prisma config file (if exists)
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker/app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Environment variables for runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Labels for container metadata
LABEL org.opencontainers.image.title="SchoolMatica"
LABEL org.opencontainers.image.description="Assessment management platform for South African schools"
LABEL org.opencontainers.image.vendor="SchoolMatica"
LABEL org.opencontainers.image.source="https://github.com/schoolmatica/schoolmatica"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
