# CentOS 9 Production Deployment Guide

**Step-by-step guide for deploying to CentOS 9 server**

---

## Step 1: Install Docker on CentOS 9

```bash
# Update system
sudo dnf update -y

# Install required packages
sudo dnf install -y dnf-plugins-core

# Add Docker repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (replace 'yourusername' with your actual username)
sudo usermod -aG docker $USER

# Apply group changes (logout and login, or use)
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Step 2: Install Git (if not installed)

```bash
# Install Git
sudo dnf install -y git

# Verify
git --version
```

---

## Step 3: Set Up SSH Key for GitHub (if not already done)

```bash
# Generate SSH key (press Enter for all prompts to use defaults)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key
ssh-add ~/.ssh/id_ed25519

# Display your public key
cat ~/.ssh/id_ed25519.pub
```

**Copy the output and add it to GitHub:**
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the key and save

**Test SSH connection:**
```bash
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated..."
```

---

## Step 4: Clone Repository

```bash
# Navigate to your preferred directory (e.g., home directory)
cd ~

# Clone repository via SSH
git clone git@github.com:addiinnocent/IIIII.git storage-app

# Navigate to application directory
cd storage-app/next-app
```

---

## Step 5: Configure Environment

```bash
# Create production environment file from template
cp .env.production.example .env.production

# Edit the file with your preferred editor
nano .env.production
# OR
vi .env.production
```

**Update these values in .env.production:**

```bash
# 1. Database credentials (CHANGE THESE!)
POSTGRES_USER=your_production_user
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=pinning

# 2. Update DATABASE_URL with your credentials
DATABASE_URL="postgresql://your_production_user:your_strong_password_here@postgres:5432/pinning?schema=public"

# 3. Generate and add AUTH_SECRET
# Run this command to generate:
# openssl rand -base64 32
AUTH_SECRET="paste_generated_secret_here"

# 4. Set your server IP or domain
AUTH_URL="http://YOUR_SERVER_IP:3000"
# For example: http://192.168.1.100:3000
# Or with domain: https://yourdomain.com

# 5. Keep these as is
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_META_DESC="Cloud hosting and storage platform"

# 6. Optional: Update payment/email settings or leave defaults
```

**To generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copy the output and paste it as the AUTH_SECRET value.

---

## Step 6: Configure Firewall

```bash
# Install firewalld if not present
sudo dnf install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Open port 3000 for Next.js application
sudo firewall-cmd --permanent --add-port=3000/tcp

# If using SSH, ensure it's allowed
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

---

## Step 7: Initial Deployment

```bash
# Make sure you're in the next-app directory
cd ~/storage-app/next-app

# Build and start production stack
docker compose -f docker-compose.prod.yml up -d --build

# This will:
# - Download PostgreSQL and Node.js images
# - Build your Next.js application
# - Start PostgreSQL database
# - Synchronise database schema automatically
# - Start Next.js application
```

**Expected output:**
```
[+] Running 3/3
 ✔ Network next-app_app-network  Created
 ✔ Container next-app-postgres-1   Started
 ✔ Container next-app-nextjs-app-1 Started
```

---

## Step 8: Verify Deployment

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# Should show:
# NAME                      STATUS
# next-app-nextjs-app-1    Up (healthy)
# next-app-postgres-1      Up (healthy)

# View application logs
docker compose -f docker-compose.prod.yml logs nextjs-app

# Look for:
# ✅ Database schema synchronised successfully
# 🚀 Starting Next.js application...

# Test the application
curl http://localhost:3000/api/auth/session

# Should return: {"user":null}
```

---

## Step 9: Access Your Application

**From your local computer:**

1. Get your server's IP address (on server run):
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. Open browser and visit:
   ```
   http://YOUR_SERVER_IP:3000
   ```

3. You should see your application login page!

---

## Step 10: Set Up Deploy Script for Future Updates

```bash
# Make deploy script executable
chmod +x ~/storage-app/next-app/deploy.sh

# Test the deployment script
./deploy.sh
```

---

## Future Deployments (After Initial Setup)

Whenever you want to deploy updates:

```bash
# Navigate to application directory
cd ~/storage-app/next-app

# Run deployment script
./deploy.sh
```

This will:
1. Pull latest code from GitHub
2. Rebuild Next.js application
3. Synchronise any database schema changes
4. Restart services
5. Show status and logs

---

## Useful Commands

### View Logs
```bash
# Application logs (follow)
docker compose -f docker-compose.prod.yml logs -f nextjs-app

# Database logs
docker compose -f docker-compose.prod.yml logs -f postgres

# All logs
docker compose -f docker-compose.prod.yml logs -f
```

### Check Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Restart Services
```bash
# Restart Next.js only
docker compose -f docker-compose.prod.yml restart nextjs-app

# Restart all
docker compose -f docker-compose.prod.yml restart
```

### Stop Services
```bash
docker compose -f docker-compose.prod.yml down
```

### Database Backup
```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U your_production_user pinning > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U your_production_user pinning < backup-20250930-120000.sql
```

---

## Troubleshooting

### Docker permission denied
```bash
# If you get permission errors, re-login or use:
newgrp docker
```

### Port 3000 already in use
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID)
sudo kill -9 PID
```

### Can't access from browser
```bash
# Verify firewall
sudo firewall-cmd --list-all

# Verify containers are running
docker compose -f docker-compose.prod.yml ps

# Check application logs
docker compose -f docker-compose.prod.yml logs nextjs-app
```

### SELinux issues
```bash
# If you encounter permission issues, temporarily set to permissive
sudo setenforce 0

# To make it permanent (not recommended for production)
sudo sed -i 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

---

## Production Best Practices

### 1. Use a Reverse Proxy (Nginx/Caddy)
- Install Nginx on host (not in Docker)
- Configure SSL certificates
- Proxy traffic from port 80/443 to port 3000

### 2. Set Up Automatic Backups
```bash
# Add to crontab for daily backups at 2 AM
crontab -e

# Add this line:
0 2 * * * cd ~/storage-app/next-app && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U your_production_user pinning > ~/backups/db-$(date +\%Y\%m\%d).sql
```

### 3. Monitor Resources
```bash
# Check resource usage
docker stats

# Check disk space
df -h
```

### 4. Keep System Updated
```bash
# Update system packages
sudo dnf update -y

# Update Docker images
cd ~/storage-app/next-app
docker compose -f docker-compose.prod.yml pull
./deploy.sh
```

---

## Security Checklist

- [x] Changed default PostgreSQL password in .env.production
- [x] Generated strong AUTH_SECRET
- [x] Configured firewall to allow only necessary ports
- [x] Set up regular database backups
- [ ] Configure SSL/TLS with reverse proxy (recommended for production)
- [ ] Update all test API keys to production keys
- [ ] Set .env.production permissions: `chmod 600 .env.production`
- [ ] Disable root SSH login
- [ ] Set up fail2ban for SSH protection

---

## Summary

Your application is now running at `http://YOUR_SERVER_IP:3000`

To deploy updates in the future, simply run:
```bash
cd ~/storage-app/next-app && ./deploy.sh
```
