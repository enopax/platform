# Server Setup Quick Reference

## On Your Server

### 1. Initial Setup

**CentOS 9:**
```bash
# Install Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

**Ubuntu/Debian:**
```bash
# Install Docker
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
git clone git@github.com:addiinnocent/IIIII.git
cd IIIII

# Switch to deployment branch
git checkout deploy/demo-v1
```

### 3. Configure Environment

```bash
# Create production environment file
cp .env.production.example .env.production

# Generate AUTH_SECRET
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env.production

# Edit other values
nano .env.production
```

**Required Configuration:**
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Generated authentication secret (already done above)
- `AUTH_URL`: Your domain or `http://your-server-ip:3000`

### 4. Update Database Credentials

Edit `docker-compose.web.yml` to change default PostgreSQL password:

```yaml
postgres:
  environment:
    POSTGRES_USER: your_production_user
    POSTGRES_PASSWORD: your_strong_password_here
    POSTGRES_DB: pinning
```

Update `.env.production` to match:
```bash
DATABASE_URL="postgresql://your_production_user:your_strong_password_here@postgres:5432/pinning?schema=public"
```

### 5. Deploy Using Script

```bash
./deploy-server.sh
```

**Or manually:**

```bash
# Build and start
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml up -d

# View logs
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f nextjs-app

# Check status
docker ps
```

### 6. Verify Deployment

```bash
# Check if services are running
docker ps

# Test the application
curl http://localhost:3000/api/auth/session

# View logs
docker logs storage-nextjs-app-1
```

## Firewall Configuration

Open necessary ports:

**CentOS 9 (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp  # Next.js
sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS
sudo firewall-cmd --permanent --add-port=22/tcp    # SSH
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

**Ubuntu/Debian (ufw):**
```bash
sudo ufw allow 3000/tcp  # Next.js
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw enable

# Check status
sudo ufw status
```

## SSL/TLS Setup (Optional)

### Using Let's Encrypt

**CentOS 9:**
```bash
# Install certbot
sudo dnf install certbot -y

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com
```

**Ubuntu/Debian:**
```bash
# Install certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com
```

# Certificates will be in:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# Copy to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/

# Update nginx configuration
nano nginx/nginx.prod.conf

# Restart nginx
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml restart nginx
```

## Common Operations

### View Logs

```bash
# Application logs
docker logs -f storage-nextjs-app-1

# Database logs
docker logs -f storage-postgres-1

# All services
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml logs -f
```

### Restart Services

```bash
# Restart Next.js app
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml restart nextjs-app

# Restart all services
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml restart
```

### Update Application

```bash
# Pull latest changes
git pull origin deploy/demo-v1

# Rebuild and restart
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml up -d --build nextjs-app
```

### Database Backup

```bash
# Create backup
docker exec storage-postgres-1 pg_dump -U your_user pinning > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore backup
docker exec -i storage-postgres-1 psql -U your_user pinning < backup-20250930-120000.sql
```

### Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down

# Stop and remove volumes (WARNING: deletes data!)
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml down -v
```

## Monitoring

### Check Container Health

```bash
docker ps  # Look for (healthy) status
```

### Resource Usage

```bash
docker stats
```

### Grafana Dashboards

1. Access: `http://your-server-ip:3001`
2. Login: `admin` / `admin` (change immediately!)
3. Add Prometheus data source: `http://prometheus:9090`

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs storage-nextjs-app-1

# Check if database is ready
docker logs storage-postgres-1

# Restart services
docker-compose -f docker-compose.web.yml -f docker-compose.web.prod.yml restart
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test database connection
docker exec storage-postgres-1 psql -U your_user -d pinning -c "SELECT 1;"

# Check DATABASE_URL in .env.production
cat next-app/.env.production | grep DATABASE_URL
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.web.prod.yml
# ports:
#   - "3001:3000"  # Maps host port 3001 to container port 3000
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated strong AUTH_SECRET
- [ ] Updated Grafana admin password
- [ ] Configured firewall (ufw)
- [ ] Set up SSL/TLS certificates
- [ ] Disabled test API keys
- [ ] Regular backups configured
- [ ] Keep Docker images updated

## Quick Commands Reference

```bash
# Status
docker ps

# Logs (follow)
docker logs -f storage-nextjs-app-1

# Shell access
docker exec -it storage-nextjs-app-1 sh

# Database shell
docker exec -it storage-postgres-1 psql -U your_user pinning

# Resource usage
docker stats

# Clean up
docker system prune -a
```

---

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)