# Production Server Setup Guide

**Quick Start Guide for deploying to a production server using git-pull workflow**

---

## Prerequisites

- Linux server (Ubuntu/Debian recommended)
- Root or sudo access
- Git installed
- Docker and Docker Compose

---

## Initial Server Setup

### 1. Install Docker

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. Clone Repository

```bash
# Clone from GitHub
git clone git@github.com:addiinnocent/IIIII.git storage-app
cd storage-app/next-app

# Or via HTTPS
git clone https://github.com/addiinnocent/IIIII.git storage-app
cd storage-app/next-app
```

### 3. Configure Environment

```bash
# Create production environment file from template
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Required Configuration:**

1. **Database Credentials** (Change these!)
```bash
POSTGRES_USER=your_production_user
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=pinning
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"
```

2. **Authentication Secret**
```bash
# Generate with:
openssl rand -base64 32

# Then add to .env.production:
AUTH_SECRET="your_generated_secret_here"
```

3. **Application URL**
```bash
# Your domain or server IP
AUTH_URL="https://your-domain.com"
# Or for testing:
AUTH_URL="http://your-server-ip:3000"
```

### 4. Initial Deployment

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 5. Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Test the application
curl http://localhost:3000/api/auth/session

# Should return: {"user":null}
```

---

## Git-Pull Deployment Workflow

Once initial setup is complete, deploy updates with a single command:

```bash
./deploy.sh
```

This script will:
1. Pull latest changes from git
2. Rebuild Next.js container
3. Synchronise database schema automatically (via Prisma)
4. Restart services
5. Show deployment status

**Manual deployment:**
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build nextjs-app
```

---

## Firewall Configuration

```bash
# Ubuntu/Debian with ufw
sudo ufw allow 3000/tcp  # Next.js application
sudo ufw allow 22/tcp    # SSH
sudo ufw enable

# Check status
sudo ufw status
```

**For production with domain:**
- Use reverse proxy (nginx/caddy) on host
- Expose ports 80/443 instead of 3000
- Configure SSL certificates

---

## Common Operations

### View Logs

```bash
# Application logs (follow)
docker compose -f docker-compose.prod.yml logs -f nextjs-app

# Database logs
docker compose -f docker-compose.prod.yml logs -f postgres

# All services
docker compose -f docker-compose.prod.yml logs -f
```

### Restart Services

```bash
# Restart Next.js app only
docker compose -f docker-compose.prod.yml restart nextjs-app

# Restart all services
docker compose -f docker-compose.prod.yml restart
```

### Database Backup

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U your_user pinning > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U your_user pinning < backup-20250930-120000.sql
```

### Stop Services

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (⚠️ WARNING: deletes all data!)
docker compose -f docker-compose.prod.yml down -v
```

---

## Database Schema Management

This setup uses **Prisma db push** for automatic schema synchronisation:

- **No migration files** to manage
- Schema defined in `prisma/schema.prisma`
- Database syncs automatically on deployment
- Perfect for small teams and rapid development

**How it works:**
1. Update `prisma/schema.prisma` in your code
2. Commit and push changes
3. Run `./deploy.sh` on server
4. Schema updates automatically during container startup

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs nextjs-app

# Check database
docker compose -f docker-compose.prod.yml logs postgres

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.prod.yml ps

# Test database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U your_user -d pinning -c "SELECT 1;"

# Check credentials in .env.production
grep DATABASE_URL .env.production
```

### Schema Sync Failed

```bash
# Check Prisma logs in container startup
docker compose -f docker-compose.prod.yml logs nextjs-app | grep -i prisma

# Manually push schema
docker compose -f docker-compose.prod.yml exec nextjs-app npx prisma db push --accept-data-loss
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.prod.yml
# ports:
#   - "3001:3000"  # Maps host 3001 to container 3000
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated strong AUTH_SECRET
- [ ] Configured firewall (ufw)
- [ ] Set up SSL/TLS with reverse proxy
- [ ] Disabled test API keys in .env.production
- [ ] Regular database backups configured
- [ ] Keep Docker images updated
- [ ] Review .env.production permissions (chmod 600)

---

## Quick Commands Reference

```bash
# Deploy updates
./deploy.sh

# Service status
docker compose -f docker-compose.prod.yml ps

# Follow logs
docker compose -f docker-compose.prod.yml logs -f nextjs-app

# Shell access
docker compose -f docker-compose.prod.yml exec nextjs-app sh

# Database shell
docker compose -f docker-compose.prod.yml exec postgres psql -U your_user pinning

# Resource usage
docker stats

# Clean up unused images
docker system prune -a
```