# Production Deployment Guide

## Quick Start (One Command)

```bash
./deploy-server-streamlined.sh
```

This script will:
1. Check prerequisites (Docker, Docker Compose)
2. Configure environment variables
3. Build the application
4. Start all services
5. Run database migrations
6. Display access URLs

## Step-by-Step Manual Deployment

### 1. Pre-Deployment Check

```bash
./pre-deploy-check.sh
```

This verifies:
- All required files exist
- Environment is configured
- Docker is installed and running
- Node.js and Prisma are available
- Migrations are ready

### 2. Configure Environment

```bash
# Copy template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required settings:**
```bash
DATABASE_URL="postgresql://yannik:yannik123@postgres:5432/pinning?schema=public"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="http://YOUR_SERVER_IP:3000"
AUTH_TRUST_HOST="true"
NODE_ENV="production"
```

**Optional settings:**
- `EMAIL_SERVER` - Leave empty to disable email auth
- `STRIPE_*` - For payment processing
- `PAYPAL_*` - For PayPal integration

### 3. Deploy

```bash
./deploy-server-streamlined.sh
```

## Manual Commands

### Build and Start

```bash
# Build
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml build nextjs-app

# Start
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml up -d

# Run migrations
export DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d'=' -f2- | tr -d '"')
npx prisma migrate deploy
```

### Manage Services

```bash
# View logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app

# Restart
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml restart nextjs-app

# Stop
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down

# Status
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml ps
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs nextjs-app

# Common issues:
# 1. Database not ready - wait 10 seconds and restart
# 2. AUTH_SECRET missing - check .env.production
# 3. Port 3000 in use - stop other services
```

### Database connection errors

```bash
# Check database is running
docker ps | grep postgres

# Test connection
docker-compose -f docker-compose.web.yml exec postgres psql -U yannik -d pinning -c "SELECT 1;"

# Check DATABASE_URL matches postgres credentials
grep DATABASE_URL .env.production
```

### Migrations fail

```bash
# Run migrations manually
export DATABASE_URL="postgresql://yannik:yannik123@postgres:5432/pinning?schema=public"
npx prisma migrate deploy

# Reset database (WARNING: deletes all data!)
npx prisma migrate reset --force
```

### "Module not found" errors

The container is running in minimal mode. If you see module errors:
1. Check the container logs
2. Rebuild with: `docker-compose ... build --no-cache nextjs-app`
3. Ensure migrations are run from host, not container

## Update Deployment

```bash
# Pull latest changes
git pull origin deploy/demo-v1

# Rebuild and restart
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down
./deploy-server-streamlined.sh
```

## Health Checks

### Quick Status

```bash
# All services status
docker ps

# Check if app responds
curl http://localhost:3000/api/auth/session

# Check database
docker-compose -f docker-compose.web.yml exec postgres pg_isready -U yannik -d pinning
```

### Detailed Health Check

```bash
./check-deployment.sh
```

This shows:
- Container status
- Environment variables
- Database connectivity
- Recent application logs

## Access URLs

After deployment, access:

- **Application**: `http://YOUR_SERVER_IP:3000`
- **Grafana**: `http://YOUR_SERVER_IP:3001` (admin/admin)
- **Prometheus**: `http://YOUR_SERVER_IP:9090`
- **Swagger API Docs**: `http://YOUR_SERVER_IP:3002`

## Security Checklist

- [ ] Changed default PostgreSQL password in `docker-compose.web.yml`
- [ ] Generated unique `AUTH_SECRET` in `.env.production`
- [ ] Updated `AUTH_URL` to your domain/IP
- [ ] Changed Grafana admin password (first login)
- [ ] Configured firewall rules
- [ ] Set up SSL/TLS for production domains
- [ ] Disabled test API keys (Stripe, PayPal)

## Files Reference

- `deploy-server-streamlined.sh` - One-command deployment
- `pre-deploy-check.sh` - Pre-deployment verification
- `check-deployment.sh` - Health check script
- `.env.production.example` - Environment template
- `docker-compose.web.yml` - Base services configuration
- `docker-compose.web.prod.yml` - Production overrides
- `Dockerfile.prod` - Production build configuration

## Support

For issues:
- Check logs: `docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f`
- Run health check: `./check-deployment.sh`
- Review troubleshooting section above
- GitHub Issues: https://github.com/addiinnocent/IIIII/issues