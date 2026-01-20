# SchoolMatica Deployment Guide

This guide covers deploying SchoolMatica in production using Docker containers.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- A domain name (for production)
- SSL certificate (for HTTPS)

## Quick Start (Development)

```bash
# Clone and navigate to the project
cd SchoolMatica

# Start development environment
docker compose up -d

# Access the application
open http://localhost:13807
```

## Production Deployment

### 1. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Configure the following required variables:

```env
# Database
POSTGRES_USER=schoolmatica
POSTGRES_PASSWORD=<strong-password-here>
POSTGRES_DB=schoolmatica

# Authentication
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-domain.com

# Application
NODE_ENV=production
APP_PORT=3000
```

### 2. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

### 3. Deploy with Docker Compose

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Check health status
curl http://localhost:3000/api/health
```

### 4. Database Migrations

Migrations run automatically on container startup via the entrypoint script. For manual migrations:

```bash
# Connect to the app container
docker compose -f docker-compose.prod.yml exec app sh

# Run migrations
npx prisma migrate deploy

# Or push schema changes (development only)
npx prisma db push
```

## Health Checks

The application exposes a health check endpoint at `/api/health`:

```bash
# Check health
curl http://localhost:3000/api/health

# Response (healthy)
{
  "status": "healthy",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "responseTime": 15,
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "memory": { "status": "healthy" }
  },
  "app": {
    "name": "SchoolMatica",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600
  }
}
```

## Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │   PostgreSQL    │◄────────│    SchoolMatica App     │   │
│  │   (postgres)    │         │        (app)            │   │
│  │   Port: 5432    │         │     Port: 3000          │   │
│  └─────────────────┘         └─────────────────────────┘   │
│                                        │                    │
│                                        ▼                    │
│                              ┌─────────────────────────┐   │
│                              │   Nginx (optional)      │   │
│                              │   Ports: 80, 443        │   │
│                              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## SSL/TLS Configuration

For production, use a reverse proxy (Nginx) for SSL termination:

1. Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

2. Deploy with Nginx:

```bash
docker compose -f docker-compose.prod.yml --profile with-nginx up -d
```

## Scaling

For horizontal scaling, use Docker Swarm or Kubernetes:

```bash
# Docker Swarm
docker service create --replicas 3 --name schoolmatica_app schoolmatica:latest

# Or use external load balancer with multiple containers
```

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U schoolmatica schoolmatica > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U schoolmatica schoolmatica < backup_20260119.sql
```

### Volume Backup

```bash
# Backup postgres data volume
docker run --rm -v schoolmatica_postgres_data_prod:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data.tar.gz /data
```

## Monitoring

### Container Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app
```

### Resource Usage

```bash
docker stats schoolmatica_app_prod schoolmatica_db_prod
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Common issues:
# - Database not ready: Wait for postgres healthcheck
# - Missing env vars: Check .env file
# - Port conflict: Change APP_PORT
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose -f docker-compose.prod.yml exec app \
  npx prisma db push --skip-generate

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres
```

### Memory Issues

```bash
# Check memory usage
docker stats

# Increase memory limit in docker-compose.prod.yml:
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

## Security Checklist

- [ ] Strong database password (24+ characters)
- [ ] Unique NEXTAUTH_SECRET
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database not exposed to public internet
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] CORS properly configured
