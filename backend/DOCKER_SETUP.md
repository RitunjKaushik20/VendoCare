# Vendor Management SaaS Backend - Docker Setup

## Quick Start with Docker

### 1. Start all services
```bash
docker-compose up -d
```

### 2. View logs
```bash
docker-compose logs -f backend
```

### 3. Stop all services
```bash
docker-compose down
```

### 4. Stop and remove volumes (data loss!)
```bash
docker-compose down -v
```

## Services Running

| Service    | URL                   | Credentials              |
|------------|-----------------------|--------------------------|
| Backend    | http://localhost:3000 | -                        |
| PostgreSQL | localhost:5432        | postgres/postgres        |
| PgAdmin    | http://localhost:5050  | admin@vendocare.com/admin|

## Prisma Commands in Docker

```bash
# Run migrations
docker-compose exec backend npx prisma migrate dev --name init

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Seed database
docker-compose exec backend npm run db:seed

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Access database directly
docker-compose exec postgres psql -U postgres -d vendocare
```

## Development Mode

For development with hot reload, use the included `docker-compose.dev.yml`:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Environment Variables

All environment variables are configured in `docker-compose.yml`. For production, override them in a `.env` file:

```bash
# Create production environment file
cp .env.example .env.production
```

## Database Backup & Restore

### Backup
```bash
docker-compose exec postgres pg_dump -U postgres vendocare > backup.sql
```

### Restore
```bash
docker-compose exec -T postgres psql -U postgres -d vendocare < backup.sql
```

