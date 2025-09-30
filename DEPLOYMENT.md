# Production Deployment Guide

This guide covers deploying the IPFS Storage Platform to a production server using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- Git
- At least 4GB RAM and 20GB disk space
- Domain name (optional, for SSL/TLS)

## Quick Start

```bash
# Clone the repository
git clone git@github.com:addiinnocent/IIIII.git
cd IIIII

# Switch to deployment branch
git checkout deploy/demo-v1

# Create production environment file
cp .env.production.example .env.production

# Edit with your configuration
nano .env.production
```

## Configuration

### 1. Environment Variables

Edit `.env.production` with your production values:

```bash
# Database (use strong credentials!)
DATABASE_URL="postgresql://your_user:your_strong_password@postgres:5432/pinning?schema=public"

# Authentication (REQUIRED - generate new secret!)
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="https://your-domain.com"  # or http://your-server-ip:3000
AUTH_TRUST_HOST="true"

# Application
NEXT_PUBLIC_META_DESC="Your application description"
NEXT_PUBLIC_DISCORD_URL="https://discord.gg/your-invite"

# Payment providers (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"
STRIPE_SECRET_KEY="sk_live_xxxxx"

# Email (optional)
EMAIL_SERVER="smtp://user:password@smtp.provider.com:587"
EMAIL_FROM="noreply@your-domain.com"
```

### 2. Generate AUTH_SECRET

**CRITICAL**: Generate a secure authentication secret:

```bash
openssl rand -base64 32
```

Copy the output to your `.env.production` file as `AUTH_SECRET`.

### 3. Database Configuration

Update the PostgreSQL credentials in both:
- `.env.production` (DATABASE_URL)
- `docker-compose.web.yml` (postgres service)

**IMPORTANT**: Use strong passwords in production!

```yaml
# docker-compose.web.yml
postgres:
  environment:
    POSTGRES_USER: your_production_user
    POSTGRES_PASSWORD: your_strong_password_here
    POSTGRES_DB: pinning
```

## Deployment Steps

### Option 1: Full Stack (Recommended)

Deploys Next.js app, PostgreSQL, Prometheus, Grafana, and Swagger UI:

```bash
# From project root (/storage)
npm run prod:web

# Check status
docker ps

# View logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app
```

### Option 2: With IPFS Storage Cluster

Deploy the complete infrastructure including IPFS nodes:

```bash
# Start storage cluster
npm run prod:storage

# Start web application
npm run prod:web

# Verify all services
docker ps
```

## Service Access

After deployment, services are available at:

- **Next.js Application**: http://localhost:3000 (or http://your-server-ip:3000)
- **PostgreSQL**: localhost:5432
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Swagger API Docs**: http://localhost:3002

## Database Initialisation

The application automatically runs Prisma migrations on startup. For manual migration:

```bash
# Access the Next.js container
docker exec -it storage-nextjs-app-1 sh

# Run migrations manually
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

## SSL/TLS Configuration (Optional)

For production with domain name:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `./nginx/ssl/`
3. Update `nginx/nginx.prod.conf` with your domain
4. Restart nginx service

## Health Checks

The application includes built-in health checks:

- **Next.js**: Checks `/api/auth/session` endpoint
- **PostgreSQL**: Uses `pg_isready` command

View health status:

```bash
docker ps  # Check STATUS column for (healthy)
```

## Monitoring

### Grafana Dashboards

1. Access Grafana at http://localhost:3001
2. Login: `admin` / `admin` (change immediately!)
3. Add Prometheus data source: http://prometheus:9090
4. Import dashboards for application metrics

### Application Logs

```bash
# Next.js application logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app

# Database logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f postgres

# All services
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin deploy/demo-v1

# Rebuild and restart
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml up -d --build nextjs-app
```

### Backup Database

```bash
# Create backup
docker exec storage-postgres-1 pg_dump -U your_user pinning > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i storage-postgres-1 psql -U your_user pinning < backup-20250930.sql
```

### Clean Restart

```bash
# Stop all services
npm run stop:web:prod

# Remove volumes (WARNING: deletes data!)
docker volume rm storage_postgres-data

# Start fresh
npm run prod:web
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs nextjs-app

# Common issues:
# 1. Database not ready - wait for healthcheck
# 2. Missing .env.production file
# 3. AUTH_SECRET not set
```

### Database connection errors

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs storage-postgres-1

# Test connection
docker exec storage-postgres-1 psql -U your_user -d pinning -c "SELECT 1;"
```

### Build failures

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild from scratch
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml build --no-cache nextjs-app
```

## Security Checklist

- [ ] Generated strong `AUTH_SECRET`
- [ ] Changed default PostgreSQL password
- [ ] Updated Grafana admin password
- [ ] Configured firewall rules (only expose necessary ports)
- [ ] Disabled test API keys (Stripe, PayPal)
- [ ] Configured proper CORS settings
- [ ] Set up SSL/TLS certificates
- [ ] Regular security updates (`docker pull` images)
- [ ] Configure regular database backups

## Performance Tuning

### Database Optimisation

```sql
-- Run in PostgreSQL
ANALYZE;
REINDEX DATABASE pinning;
```

### Docker Resource Limits

Edit `docker-compose.web.prod.yml` to add resource constraints:

```yaml
nextjs-app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 512M
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/addiinnocent/IIIII/issues
- Documentation: See ARCHITECTURE.md, SPECS.md, CLAUDE.md

---

**Note**: This deployment uses Docker for portability. For Kubernetes deployments, see `k8s/` directory (coming soon).