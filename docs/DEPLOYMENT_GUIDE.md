# SchoolMatica Deployment Guide

This guide covers deploying SchoolMatica using Docker containers for both development and production environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Database Backup & Recovery](#database-backup--recovery)
- [Redis Cache & Sessions](#redis-cache--sessions)
- [Health Monitoring](#health-monitoring)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

---

## Architecture Overview

SchoolMatica uses a microservices architecture with the following components:

### Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Network                                   │
│                                                                              │
│     Internet ──► [ Nginx Reverse Proxy ]──────────────────────────────►     │
│                   (SSL/TLS, Caching,     │                                   │
│                    Rate Limiting)        │                                   │
│                          │               │                                   │
│                          ▼               ▼                                   │
│              ┌─────────────────────────────────────────────────────────┐    │
│              │                  Internal Network                        │    │
│              │                                                          │    │
│              │   ┌───────────────┐      ┌───────────────────────────┐  │    │
│              │   │   PostgreSQL  │◄─────│   SchoolMatica Next.js    │  │    │
│              │   │   (Database)  │      │        Application        │  │    │
│              │   │               │      │                           │  │    │
│              │   │   Port: 5432  │      │      Port: 3000           │  │    │
│              │   └───────┬───────┘      └─────────────┬─────────────┘  │    │
│              │           │                            │                 │    │
│              │           │              ┌─────────────┴─────────────┐  │    │
│              │           │              │                           │  │    │
│              │           │              ▼                           │  │    │
│              │   ┌───────▼───────┐      ┌───────────────────────┐   │  │    │
│              │   │    Backup     │      │        Redis          │   │  │    │
│              │   │    Service    │      │   (Cache/Sessions)    │   │  │    │
│              │   │               │      │                       │   │  │    │
│              │   │  Cron: Daily  │      │     Port: 6379        │   │  │    │
│              │   └───────────────┘      └───────────────────────┘   │  │    │
│              │                                                      │    │    │
│              └──────────────────────────────────────────────────────┘    │    │
│                                                                          │    │
│              ┌──────────────────────────────────────────────────────┐    │    │
│              │                    Certbot                            │    │    │
│              │            (SSL Certificate Renewal)                  │    │    │
│              └──────────────────────────────────────────────────────┘    │    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Development Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Network                           │
│                                                                  │
│   ┌───────────────────────────┐                                 │
│   │   SchoolMatica Next.js    │──► localhost:44777              │
│   │    (Hot Reload Enabled)   │                                 │
│   └─────────────┬─────────────┘                                 │
│                 │                                                │
│                 ▼                                                │
│   ┌───────────────────────────┐                                 │
│   │        PostgreSQL         │                                 │
│   │        Port: 5432         │                                 │
│   └───────────────────────────┘                                 │
│                                                                  │
│   ┌─────────────────────────────────────────────────────┐       │
│   │              Optional Services                       │       │
│   │                                                      │       │
│   │   [Redis]      [Adminer]      [MailHog]             │       │
│   │   Port: 6379   Port: 8080     SMTP: 1025            │       │
│   │                               UI: 8025               │       │
│   └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Service Components

| Service | Development | Production | Purpose |
|---------|-------------|------------|---------|
| **app** | ✓ | ✓ | Next.js application with hot-reload (dev) or optimized build (prod) |
| **postgres** | ✓ | ✓ | PostgreSQL database with custom configuration |
| **redis** | Optional | ✓ | Session management and caching |
| **nginx** | - | ✓ | Reverse proxy, SSL termination, caching, rate limiting |
| **backup** | - | ✓ | Automated PostgreSQL backups with optional S3 sync |
| **certbot** | - | ✓ | Let's Encrypt SSL certificate management |
| **adminer** | Optional | - | Database administration UI |
| **mailhog** | Optional | - | Email testing tool |

---

## Prerequisites

### System Requirements

- **Docker Engine**: 20.10 or higher
- **Docker Compose**: 2.0 or higher (v2 syntax)
- **RAM**: 4GB minimum (8GB recommended for production)
- **Disk Space**: 10GB minimum for containers and data

### Production Additional Requirements

- A registered domain name
- DNS A/AAAA records pointing to your server
- Ports 80 and 443 open on firewall
- (Optional) AWS S3 bucket for off-site backups

### Verify Installation

```bash
# Check Docker version
docker --version    # Should be 20.10+

# Check Docker Compose version
docker compose version    # Should be 2.0+

# Verify Docker is running
docker info
```

---

## Development Environment

### Quick Start

```bash
# 1. Clone and navigate to the project
cd SchoolMatica

# 2. Create environment file
cp .env.development.example .env

# 3. Start development environment
docker compose -f docker-compose.dev.yml up -d

# 4. Wait for services to be healthy
docker compose -f docker-compose.dev.yml ps

# 5. Access the application
# Open http://localhost:44777
```

### Environment Configuration

Edit `.env` with your development settings:

```env
# Database
POSTGRES_USER=schoolmatica_dev
POSTGRES_PASSWORD=dev_password_change_me
POSTGRES_DB=schoolmatica_dev
DATABASE_URL="postgresql://schoolmatica_dev:dev_password_change_me@postgres:5432/schoolmatica_dev?schema=public"

# Authentication
NEXTAUTH_SECRET=dev_secret_at_least_32_characters_long
NEXTAUTH_URL=http://localhost:44777
AUTH_TRUST_HOST=true

# Application
NODE_ENV=development
APP_PORT=44777
```

### Optional Development Services

```bash
# Start with Redis for session testing
docker compose -f docker-compose.dev.yml --profile redis up -d

# Start with database admin UI (Adminer)
docker compose -f docker-compose.dev.yml --profile tools up -d
# Access at http://localhost:8080

# Start with email testing (MailHog)
docker compose -f docker-compose.dev.yml --profile mail up -d
# UI at http://localhost:8025, SMTP at localhost:1025

# Start all optional services
docker compose -f docker-compose.dev.yml --profile redis --profile tools --profile mail up -d
```

### Development Commands

```bash
# View logs
docker compose -f docker-compose.dev.yml logs -f app

# Restart application (after code changes if hot-reload fails)
docker compose -f docker-compose.dev.yml restart app

# Access application shell
docker compose -f docker-compose.dev.yml exec app sh

# Run Prisma commands
docker compose -f docker-compose.dev.yml exec app npx prisma studio
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Stop all services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v
```

---

## Production Environment

### Initial Setup

```bash
# 1. Create production environment file
cp .env.production.example .env

# 2. Generate secure secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo "REDIS_PASSWORD=$(openssl rand -base64 24)"

# 3. Edit .env with your domain and generated secrets
nano .env
```

### Required Configuration

Update these values in your `.env` file:

```env
# Domain (required)
DOMAIN=your-domain.com
LETSENCRYPT_EMAIL=admin@your-domain.com

# Database (use generated password)
POSTGRES_PASSWORD=<your-generated-password>
DATABASE_URL="postgresql://schoolmatica:<your-generated-password>@postgres:5432/schoolmatica?schema=public"

# Redis (use generated password)
REDIS_PASSWORD=<your-generated-redis-password>
REDIS_URL="redis://:<your-generated-redis-password>@redis:6379"

# Auth (use generated secret)
NEXTAUTH_SECRET=<your-generated-secret>
NEXTAUTH_URL=https://your-domain.com
```

### Deploy Production Stack

```bash
# 1. Build and start all production services
docker compose -f docker-compose.prod.yml up -d --build

# 2. Monitor startup progress
docker compose -f docker-compose.prod.yml logs -f

# 3. Verify all services are healthy
docker compose -f docker-compose.prod.yml ps

# 4. Test health endpoint
curl https://your-domain.com/api/health
```

### First-Time SSL Setup

On first deployment, Certbot needs to obtain SSL certificates:

```bash
# 1. Start Nginx and Certbot
docker compose -f docker-compose.prod.yml up -d nginx certbot

# 2. Obtain initial certificate (interactive)
docker compose -f docker-compose.prod.yml exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com \
  --email admin@your-domain.com \
  --agree-tos \
  --no-eff-email

# 3. Reload Nginx to use new certificate
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Production Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f nginx

# Restart application (zero-downtime with health checks)
docker compose -f docker-compose.prod.yml restart app

# Update application (rebuild and restart)
docker compose -f docker-compose.prod.yml up -d --build app

# Scale application (if using external load balancer)
docker compose -f docker-compose.prod.yml up -d --scale app=3

# Stop all services (preserves data)
docker compose -f docker-compose.prod.yml down

# Full cleanup (WARNING: deletes all data)
docker compose -f docker-compose.prod.yml down -v
```

---

## SSL/TLS Configuration

### Automatic SSL with Let's Encrypt

Production uses Certbot with automatic certificate renewal:

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# Force certificate renewal
docker compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal

# Test renewal (dry run)
docker compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
```

Certificates auto-renew via cron (configured in Certbot container).

### Nginx SSL Configuration

The production Nginx configuration includes:

- **TLS 1.2 and 1.3** only (no legacy protocols)
- **Modern cipher suites** for security
- **HSTS** with 1-year max-age
- **OCSP Stapling** for performance
- **Security headers**: X-Frame-Options, X-Content-Type-Options, CSP

### Custom SSL Certificate

For custom certificates (not Let's Encrypt):

```bash
# Place certificates in the correct location
mkdir -p docker/nginx/ssl
cp your-cert.pem docker/nginx/ssl/fullchain.pem
cp your-key.pem docker/nginx/ssl/privkey.pem

# Update Nginx config to use custom paths
# Edit docker/nginx/nginx.conf
```

---

## Database Backup & Recovery

### Automatic Backups

Production includes an automated backup service:

- **Schedule**: Daily at 2 AM (configurable via `BACKUP_SCHEDULE`)
- **Retention**: 30 days local (configurable via `BACKUP_RETENTION_DAYS`)
- **Format**: Compressed SQL dumps (`.sql.gz`)
- **Integrity**: Each backup is verified after creation
- **Optional**: S3 upload for off-site storage

### Manual Backup

```bash
# Create immediate backup
docker compose -f docker-compose.prod.yml exec backup /scripts/backup.sh

# List existing backups
docker compose -f docker-compose.prod.yml exec backup ls -la /backups
```

### Restore from Backup

```bash
# Restore from local backup (interactive - confirms before restoring)
docker compose -f docker-compose.prod.yml exec backup \
  /scripts/restore.sh /backups/schoolmatica_20260120_020000.sql.gz

# Restore with pre-restore backup (recommended)
docker compose -f docker-compose.prod.yml exec backup \
  /scripts/restore.sh --create-backup /backups/schoolmatica_20260120_020000.sql.gz

# Force restore without confirmation
docker compose -f docker-compose.prod.yml exec backup \
  /scripts/restore.sh --force /backups/schoolmatica_20260120_020000.sql.gz

# Restore from S3
docker compose -f docker-compose.prod.yml exec backup \
  /scripts/restore.sh s3://schoolmatica-backups/schoolmatica_20260120_020000.sql.gz
```

### S3 Backup Configuration

Add to `.env` for off-site backups:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=schoolmatica-backups
S3_REGION=eu-west-1
```

### Volume Backup

For full data preservation including WAL files:

```bash
# Stop database (brief downtime)
docker compose -f docker-compose.prod.yml stop postgres

# Backup entire volume
docker run --rm \
  -v schoolmatica_postgres_prod_data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_volume_$(date +%Y%m%d).tar.gz -C /data .

# Restart database
docker compose -f docker-compose.prod.yml start postgres
```

---

## Redis Cache & Sessions

### Purpose

Redis provides:
- **Session Storage**: Secure, fast session management
- **Application Cache**: Reduce database load
- **Rate Limiting**: Track API request counts

### Configuration

Redis is configured with:
- **Memory Limit**: 256MB (production)
- **Eviction Policy**: `allkeys-lru` (removes least recently used keys)
- **Persistence**: RDB snapshots + AOF for durability
- **Security**: Password authentication, renamed dangerous commands

### Redis Commands

```bash
# Connect to Redis CLI
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD

# Check memory usage
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD INFO memory

# View all keys (use cautiously in production)
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD KEYS "*"

# Flush all cache (if needed)
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD FLUSHALL
```

---

## Health Monitoring

### Health Check Endpoints

```bash
# Application health
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-01-20T12:00:00.000Z",
  "responseTime": 15,
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "redis": { "status": "healthy", "latency": 2 },
    "memory": { "status": "healthy", "used": "256MB", "limit": "1024MB" }
  },
  "app": {
    "name": "SchoolMatica",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 86400
  }
}
```

### Container Health Status

```bash
# Check all service health
docker compose -f docker-compose.prod.yml ps

# Detailed health check logs
docker inspect --format='{{json .State.Health}}' schoolmatica_app_prod
```

### Resource Monitoring

```bash
# Real-time resource usage
docker stats

# Specific containers
docker stats schoolmatica_app_prod schoolmatica_postgres_prod schoolmatica_redis_prod

# View logs for specific timeframe
docker compose -f docker-compose.prod.yml logs --since="1h" app
```

### Log Aggregation

Production containers log to JSON format for easy parsing:

```bash
# View JSON logs
docker compose -f docker-compose.prod.yml logs app --no-log-prefix

# Parse with jq
docker compose -f docker-compose.prod.yml logs app --no-log-prefix | jq '.msg'
```

---

## Scaling

### Horizontal Scaling

For high availability, scale the application behind a load balancer:

```bash
# Scale to 3 instances
docker compose -f docker-compose.prod.yml up -d --scale app=3

# Update Nginx upstream (manual or use service discovery)
```

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml schoolmatica

# Scale service
docker service scale schoolmatica_app=5

# View service status
docker service ls
```

### Kubernetes Migration

For Kubernetes deployment, convert Docker Compose to K8s manifests:

```bash
# Using kompose
kompose convert -f docker-compose.prod.yml -o k8s/

# Apply to cluster
kubectl apply -f k8s/
```

---

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs app

# Common causes:
# - Missing environment variables
# - Database not ready (check depends_on and healthcheck)
# - Port already in use
```

#### Database Connection Failed

```bash
# Test database connectivity from app container
docker compose -f docker-compose.prod.yml exec app \
  npx prisma db execute --stdin <<< "SELECT 1"

# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify DATABASE_URL format
docker compose -f docker-compose.prod.yml exec app printenv DATABASE_URL
```

#### SSL Certificate Issues

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# View Nginx SSL errors
docker compose -f docker-compose.prod.yml logs nginx | grep -i ssl

# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### High Memory Usage

```bash
# Check container memory
docker stats --no-stream

# If app is using too much memory
# 1. Check for memory leaks
# 2. Reduce Node.js heap size
# 3. Scale horizontally instead of vertically
```

#### Nginx 502 Bad Gateway

```bash
# Check if app container is running
docker compose -f docker-compose.prod.yml ps app

# Check app health
docker compose -f docker-compose.prod.yml exec nginx curl -f http://app:3000/api/health

# Check Nginx upstream configuration
docker compose -f docker-compose.prod.yml exec nginx cat /etc/nginx/nginx.conf
```

### Debug Mode

Enable debug logging:

```bash
# Add to .env
LOG_LEVEL=debug
DEBUG=*

# Restart with debug
docker compose -f docker-compose.prod.yml restart app
```

### Reset Everything

```bash
# Stop all containers and remove volumes (CAUTION: deletes all data)
docker compose -f docker-compose.prod.yml down -v

# Remove all images
docker compose -f docker-compose.prod.yml down --rmi all

# Rebuild from scratch
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Security Checklist

### Pre-Deployment

- [ ] Generated unique `NEXTAUTH_SECRET` (32+ characters)
- [ ] Generated strong `POSTGRES_PASSWORD` (24+ characters)
- [ ] Generated strong `REDIS_PASSWORD` (24+ characters)
- [ ] Configured correct `DOMAIN` in environment
- [ ] DNS records point to server IP

### Network Security

- [ ] Firewall allows only ports 80 and 443
- [ ] Database port (5432) NOT exposed externally
- [ ] Redis port (6379) NOT exposed externally
- [ ] Internal services use Docker internal network

### SSL/TLS

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Valid SSL certificate installed
- [ ] Certificate auto-renewal configured
- [ ] HSTS header enabled
- [ ] Modern TLS configuration (1.2+ only)

### Application Security

- [ ] Rate limiting configured for login endpoints
- [ ] CORS properly configured
- [ ] Security headers present (CSP, X-Frame-Options, etc.)
- [ ] No sensitive data in logs
- [ ] Environment variables not logged

### Data Protection

- [ ] Database backups running automatically
- [ ] Backup integrity verified
- [ ] Off-site backup configured (S3)
- [ ] Backup restoration tested

### Monitoring

- [ ] Health endpoints accessible
- [ ] Log aggregation configured
- [ ] Alerting set up for failures
- [ ] Resource limits configured

---

## Quick Reference

### File Structure

```
SchoolMatica/
├── docker/
│   ├── app/
│   │   ├── Dockerfile          # Multi-stage Next.js build
│   │   └── entrypoint.sh       # Startup script with migrations
│   ├── nginx/
│   │   ├── Dockerfile          # Nginx with SSL support
│   │   ├── nginx.conf          # Production configuration
│   │   └── error-pages/        # Custom error pages
│   ├── postgres/
│   │   ├── Dockerfile          # PostgreSQL with extensions
│   │   ├── postgresql.conf     # Tuned configuration
│   │   └── init/               # Initialization scripts
│   ├── redis/
│   │   ├── Dockerfile          # Redis with persistence
│   │   └── redis.conf          # Production configuration
│   └── backup/
│       ├── Dockerfile          # Backup service
│       └── scripts/            # Backup and restore scripts
├── docker-compose.dev.yml      # Development orchestration
├── docker-compose.prod.yml     # Production orchestration
├── .env.development.example    # Development environment template
├── .env.production.example     # Production environment template
└── .env                        # Active environment (not in git)
```

### Common Commands

| Action | Development | Production |
|--------|-------------|------------|
| Start | `docker compose -f docker-compose.dev.yml up -d` | `docker compose -f docker-compose.prod.yml up -d` |
| Stop | `docker compose -f docker-compose.dev.yml down` | `docker compose -f docker-compose.prod.yml down` |
| Logs | `docker compose -f docker-compose.dev.yml logs -f` | `docker compose -f docker-compose.prod.yml logs -f` |
| Rebuild | `docker compose -f docker-compose.dev.yml up -d --build` | `docker compose -f docker-compose.prod.yml up -d --build` |
| Shell | `docker compose -f docker-compose.dev.yml exec app sh` | `docker compose -f docker-compose.prod.yml exec app sh` |
| Migrations | `docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev` | Automatic on startup |

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✓ | Auth encryption secret (32+ chars) |
| `NEXTAUTH_URL` | ✓ | Application URL |
| `POSTGRES_PASSWORD` | ✓ | Database password |
| `REDIS_PASSWORD` | Production | Redis authentication |
| `DOMAIN` | Production | Your domain name |
| `LETSENCRYPT_EMAIL` | Production | SSL certificate notifications |

---

*Last updated: January 2026*
