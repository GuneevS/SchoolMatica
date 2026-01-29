# Development Guide

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop or Docker Engine 20.10+
- Docker Compose V2

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd SchoolMatica
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for Docker)
   ```

3. **Start development environment**
   ```bash
   # Start core services (PostgreSQL + App)
   docker compose -f docker-compose.dev.yml up -d
   
   # Optional: Start with database admin UI
   docker compose -f docker-compose.dev.yml --profile with-adminer up -d
   
   # Optional: Start with email testing
   docker compose -f docker-compose.dev.yml --profile with-mail up -d
   ```

4. **Run database migrations**
   ```bash
   docker exec schoolmatica_app_dev npx prisma migrate dev
   ```

5. **Seed demo data (optional)**
   ```bash
   docker exec schoolmatica_app_dev npx prisma db seed
   ```

6. **Access the application**
   - **App:** http://localhost:13807
   - **Adminer (if enabled):** http://localhost:13810
   - **MailHog (if enabled):** http://localhost:13812

### Development Workflow

#### View logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# App only
docker compose -f docker-compose.dev.yml logs -f app

# Database only
docker compose -f docker-compose.dev.yml logs -f postgres
```

#### Restart services
```bash
# Restart app
docker compose -f docker-compose.dev.yml restart app

# Restart all
docker compose -f docker-compose.dev.yml restart
```

#### Execute commands in container
```bash
# Open shell in app container
docker exec -it schoolmatica_app_dev sh

# Run Prisma commands
docker exec schoolmatica_app_dev npx prisma studio
docker exec schoolmatica_app_dev npx prisma migrate dev
docker exec schoolmatica_app_dev npx prisma db push
```

#### Stop services
```bash
# Stop (keeps data)
docker compose -f docker-compose.dev.yml down

# Stop and remove data
docker compose -f docker-compose.dev.yml down -v
```

## Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/schoolmatica?schema=public"
   NEXTAUTH_URL="http://localhost:44777"
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed  # Optional: demo data
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access at:** http://localhost:44777

## Database Management

### Migrations
```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Prisma Studio
```bash
# Open database GUI
npx prisma studio
```

## Troubleshooting

### Port already in use
```bash
# Check what's using ports
netstat -ano | findstr :13807
netstat -ano | findstr :13808

# Kill process or change ports in docker-compose.dev.yml
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Check logs
docker compose -f docker-compose.dev.yml logs postgres

# Restart database
docker compose -f docker-compose.dev.yml restart postgres
```

### App won't start
```bash
# Check logs for errors
docker compose -f docker-compose.dev.yml logs app

# Rebuild app container
docker compose -f docker-compose.dev.yml build app
docker compose -f docker-compose.dev.yml up -d app
```

### Clear all Docker data
```bash
# Nuclear option: Remove everything
docker compose -f docker-compose.dev.yml down -v
docker system prune -a --volumes
```

## Testing

### Run linter
```bash
npm run lint
```

### Type checking
```bash
npx tsc --noEmit
```

### Build for production
```bash
npm run build
```

## Environment Variables Reference

See `.env.example` for complete list of environment variables and their descriptions.

## Port Reference

| Service  | Port  | URL                        |
|----------|-------|----------------------------|
| App      | 13807 | http://localhost:13807     |
| Database | 13808 | postgresql://localhost:13808 |
| Redis    | 13809 | redis://localhost:13809    |
| Adminer  | 13810 | http://localhost:13810     |
| MailHog  | 13812 | http://localhost:13812     |

## Production Deployment

See [docs/DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment instructions.
