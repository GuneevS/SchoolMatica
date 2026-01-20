# SchoolMatica Docker Infrastructure

Quick reference for SchoolMatica's containerization architecture.

## Quick Start

### Development

```bash
# Start development environment
cp .env.development.example .env
docker compose -f docker-compose.dev.yml up -d

# Access at http://localhost:44777
```

### Production

```bash
# Start production environment
cp .env.production.example .env
# Edit .env with your domain and secrets
docker compose -f docker-compose.prod.yml up -d --build

# Access at https://your-domain.com
```

## Architecture

### Services Overview

| Service | Dev | Prod | Image | Purpose |
|---------|-----|------|-------|---------|
| `app` | ✓ | ✓ | Custom (Node 20 Alpine) | Next.js application |
| `postgres` | ✓ | ✓ | Custom (PostgreSQL 15) | Primary database |
| `redis` | Profile | ✓ | Custom (Redis 7) | Cache & sessions |
| `nginx` | - | ✓ | Custom (Nginx 1.25) | Reverse proxy & SSL |
| `backup` | - | ✓ | Custom (Alpine) | Automated backups |
| `certbot` | - | ✓ | certbot/certbot | SSL certificates |
| `adminer` | Profile | - | adminer:latest | DB admin UI |
| `mailhog` | Profile | - | mailhog/mailhog | Email testing |

### Networks

- **Development**: `schoolmatica_dev_network` (bridge)
- **Production Internal**: `schoolmatica_internal` (isolated services)
- **Production External**: `schoolmatica_external` (exposed services)

### Volumes

```
Development:
├── postgres_dev_data      # PostgreSQL data
└── redis_dev_data         # Redis data (optional)

Production:
├── postgres_prod_data     # PostgreSQL data
├── postgres_prod_logs     # PostgreSQL logs
├── redis_prod_data        # Redis data
├── nginx_cache            # Nginx cache
├── certbot_webroot        # SSL challenge files
├── certbot_certs          # SSL certificates
├── backup_data            # Database backups
└── backup_logs            # Backup logs
```

## File Structure

```
docker/
├── app/
│   ├── Dockerfile         # Multi-stage build (deps → builder → runner)
│   └── entrypoint.sh      # Environment validation, migrations
├── nginx/
│   ├── Dockerfile         # Nginx with SSL support
│   ├── nginx.conf         # Full production config
│   └── error-pages/
│       └── 50x.html       # Custom error page
├── postgres/
│   ├── Dockerfile         # PostgreSQL with extensions
│   ├── postgresql.conf    # Performance tuning
│   └── init/
│       └── 01-init.sql    # Extensions, roles
├── redis/
│   ├── Dockerfile         # Redis with password handling
│   └── redis.conf         # Persistence, memory policy
└── backup/
    ├── Dockerfile         # Backup service with AWS CLI
    └── scripts/
        ├── entrypoint.sh  # Cron setup, DB wait
        ├── backup.sh      # Backup with S3 sync
        └── restore.sh     # Restore with verification
```

## Commands Cheatsheet

### Development

```bash
# Start
docker compose -f docker-compose.dev.yml up -d

# With optional services
docker compose -f docker-compose.dev.yml --profile redis --profile tools up -d

# Logs
docker compose -f docker-compose.dev.yml logs -f app

# Shell access
docker compose -f docker-compose.dev.yml exec app sh

# Prisma Studio
docker compose -f docker-compose.dev.yml exec app npx prisma studio

# Stop
docker compose -f docker-compose.dev.yml down
```

### Production

```bash
# Deploy
docker compose -f docker-compose.prod.yml up -d --build

# View status
docker compose -f docker-compose.prod.yml ps

# Application logs
docker compose -f docker-compose.prod.yml logs -f app

# Nginx logs
docker compose -f docker-compose.prod.yml logs -f nginx

# SSL certificate status
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# Manual backup
docker compose -f docker-compose.prod.yml exec backup /scripts/backup.sh

# Restore backup
docker compose -f docker-compose.prod.yml exec backup /scripts/restore.sh /backups/backup.sql.gz

# Restart with zero downtime
docker compose -f docker-compose.prod.yml restart app

# Full rebuild
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Database Operations

```bash
# Connect to PostgreSQL (dev)
docker compose -f docker-compose.dev.yml exec postgres psql -U schoolmatica_dev -d schoolmatica_dev

# Connect to PostgreSQL (prod)
docker compose -f docker-compose.prod.yml exec postgres psql -U schoolmatica -d schoolmatica

# Run migrations manually
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Generate Prisma client
docker compose -f docker-compose.prod.yml exec app npx prisma generate
```

### Redis Operations

```bash
# Connect to Redis CLI (prod)
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD

# Memory info
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD INFO memory

# Flush cache
docker compose -f docker-compose.prod.yml exec redis redis-cli -a $REDIS_PASSWORD FLUSHALL
```

## Resource Limits

### Production Defaults

| Service | Memory | CPU |
|---------|--------|-----|
| app | 1GB | 1.0 |
| postgres | 2GB | 2.0 |
| redis | 512MB | 0.5 |
| nginx | 256MB | 0.25 |
| backup | 256MB | 0.25 |

### Monitoring

```bash
# Live resource usage
docker stats

# Container health
docker compose -f docker-compose.prod.yml ps

# Inspect health check
docker inspect --format='{{json .State.Health}}' schoolmatica_app_prod | jq
```

## Health Checks

All services include health checks:

| Service | Check | Interval |
|---------|-------|----------|
| app | HTTP /api/health | 30s |
| postgres | pg_isready | 10s |
| redis | redis-cli ping | 10s |
| nginx | curl localhost:80 | 30s |
| backup | cron process | 60s |

## Security Features

### Network Isolation
- Database and Redis only accessible via internal network
- Only Nginx exposed to external network

### SSL/TLS
- Let's Encrypt certificates via Certbot
- Auto-renewal every 12 hours
- Modern cipher suites only

### Rate Limiting
- API: 100 req/min per IP
- Login: 10 req/min per IP

### Database Security
- Connection limited to app network
- Custom roles with least privilege
- Password authentication required

## Troubleshooting

### App won't start
```bash
docker compose -f docker-compose.prod.yml logs app
# Check: DATABASE_URL, NEXTAUTH_SECRET set correctly
```

### Database connection failed
```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db execute --stdin <<< "SELECT 1"
```

### SSL issues
```bash
docker compose -f docker-compose.prod.yml exec certbot certbot certificates
docker compose -f docker-compose.prod.yml logs nginx | grep -i ssl
```

### Memory issues
```bash
docker stats --no-stream
# Increase limits in docker-compose.prod.yml
```

---

For comprehensive documentation, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
