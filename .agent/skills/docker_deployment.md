---
name: SchoolMatica Docker Deployment
description: How to run SchoolMatica in Docker for development and production
---

# Docker Deployment Skill

## Architecture
SchoolMatica runs as a multi-service Docker application:

```
┌─────────────┐    ┌──────────┐    ┌─────────┐
│  Next.js    │───▶│ Postgres │    │  Redis  │
│  App :44777 │    │  :5432   │    │  :6379  │
└─────────────┘    └──────────┘    └─────────┘
       │
  Exposed on
  port 13807
```

## Docker Compose Files
| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Full dev environment with hot-reload |
| `docker-compose.prod.yml` | Production with Nginx, backups, Cloudflare |
| `docker-compose.yml` | Base compose (minimal) |

## Development Environment

### Quick Start
```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# Check status
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f app

# Stop
docker compose -f docker-compose.dev.yml down
```

### Services
| Service | Container | Port Mapping | Purpose |
|---------|-----------|--------------|---------|
| `app` | `schoolmatica_app_dev` | `13807:44777` | Next.js with hot-reload |
| `postgres` | `schoolmatica_db_dev` | `13808:5432` | PostgreSQL 15 |
| `redis` | `schoolmatica_redis_dev` | `13809:6379` | Redis 7 (optional profile) |
| `adminer` | `schoolmatica_adminer` | `13810:8080` | DB admin UI (optional) |
| `mailhog` | `schoolmatica_mailhog` | `13811:1025, 13812:8025` | Email testing (optional) |

### Optional Profiles
```bash
# Include Redis
docker compose -f docker-compose.dev.yml --profile with-redis up -d

# Include Adminer (DB UI)
docker compose -f docker-compose.dev.yml --profile with-adminer up -d

# Include MailHog (email testing)
docker compose -f docker-compose.dev.yml --profile with-mail up -d
```

### Environment Variables
| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://schoolmatica:dev_password_only@postgres:5432/schoolmatica` | DB connection |
| `NEXTAUTH_SECRET` | `dev_secret_key_change_in_production` | Auth secret |
| `NEXTAUTH_URL` | `http://localhost:13807` | Auth URL |
| `REDIS_URL` | `redis://redis:6379` | Redis connection |
| `NODE_ENV` | `development` | Environment |

### App Startup Sequence
The dev container runs:
```bash
npm ci --include=dev && npx prisma generate && npm run dev
```

### Database Access
```bash
# Direct psql access
docker exec -it schoolmatica_db_dev psql -U schoolmatica -d schoolmatica

# Via Adminer
open http://localhost:13810
# Server: postgres, User: schoolmatica, Password: dev_password_only, DB: schoolmatica
```

## Dockerfiles
| File | Purpose |
|------|---------|
| `docker/app/Dockerfile` | Next.js app container |
| `docker/postgres/Dockerfile` | PostgreSQL with init scripts |
| `docker/nginx/Dockerfile` | Nginx reverse proxy (prod) |
| `docker/redis/Dockerfile` | Redis container |
| `docker/backup/Dockerfile` | Database backup service |

## Key Paths
- App source: `/app` (mounted volume in dev)
- Node modules: isolated volume `app_node_modules`
- `.next` build: excluded from volume mount
- DB data: named volume `postgres_dev_data`

## Health Checks
- **App**: `curl -f http://localhost:44777/api/health`
- **Postgres**: `pg_isready -U schoolmatica -d schoolmatica`
- **Redis**: `redis-cli ping`

## Browser Testing
After starting, access the app at:
- **App**: http://localhost:13807
- **Adminer**: http://localhost:13810
- **MailHog**: http://localhost:13812
