# StayMate Claims - Complete Deployment Guide

This guide covers the complete deployment process for both the frontend and backend components of the StayMate Claims application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Production Configuration](#production-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **PostgreSQL**: Version 14.x or higher
- **Git**: Latest version

### Server Requirements
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **OS**: Ubuntu 20.04 LTS or higher (recommended)

### Third-party Services
- **Supabase Account** (for file storage)
- **Email Service** (Gmail/SendGrid/etc.)
- **Domain Name** (for production)
- **SSL Certificate** (Let's Encrypt recommended)

---

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install SSL certificates tool
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Create Application User

```bash
# Create a dedicated user for the application
sudo adduser staymate
sudo usermod -aG sudo staymate
sudo su - staymate
```

---

## Database Setup

### 1. PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE damage_claims_db;
CREATE USER staymate_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE damage_claims_db TO staymate_user;
\q

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Change: #listen_addresses = 'localhost' to listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host damage_claims_db staymate_user 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

---

## Backend Deployment

### 1. Clone and Setup Application

```bash
# Clone the repository
cd /home/staymate
git clone https://github.com/your-username/staymate-claims.git
cd staymate-claims

# Install dependencies
npm install
```

### 2. Environment Configuration

Create production environment file:

```bash
nano .env
```

```env
# Database Configuration
DATABASE_URL="postgresql://staymate_user:your_secure_password@localhost:5432/damage_claims_db"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="production"
PORT=5000
CORS_ORIGIN="https://yourdomain.com"

# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET_NAME="damage-reports"

# Email Configuration (Gmail example)
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Frontend URL
FRONTEND_URL="https://yourdomain.com"
```

### 3. Database Migration and Seeding

```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### 4. PM2 Process Management

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'staymate-backend',
    script: 'backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

```bash
# Create logs directory
mkdir logs

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

### 5. Nginx Configuration for Backend

```bash
sudo nano /etc/nginx/sites-available/staymate-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for large file uploads
        proxy_connect_timeout       300;
        proxy_send_timeout          300;
        proxy_read_timeout          300;
        send_timeout                300;
    }

    # Increase max upload size for damage report images
    client_max_body_size 50M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/staymate-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd /home/staymate/staymate-claims/frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_FRONTEND_URL=https://yourdomain.com
GENERATE_SOURCEMAP=false
```

```bash
# Build the application
npm run build

# The build files will be in the 'build' directory
```

### 2. Nginx Configuration for Frontend

```bash
sudo nano /etc/nginx/sites-available/staymate-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /home/staymate/staymate-claims/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.yourdomain.com;" always;

    # Hide Nginx version
    server_tokens off;
}
```

```bash
# Enable the frontend site
sudo ln -s /etc/nginx/sites-available/staymate-frontend /etc/nginx/sites-enabled/

# Remove default Nginx site
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL Certificate Setup

### 1. Obtain SSL Certificates

```bash
# Get certificates for both domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal cron job
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Update Environment Variables

Update your `.env` file to use HTTPS URLs:

```env
CORS_ORIGIN="https://yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
```

```bash
# Restart backend
pm2 restart staymate-backend
```

---

## Production Configuration

### 1. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (only if remote access needed)
sudo ufw status
```

### 2. Log Rotation

```bash
# Setup log rotation for PM2 logs
sudo nano /etc/logrotate.d/staymate
```

```
/home/staymate/staymate-claims/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 staymate staymate
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Backup Script

```bash
nano /home/staymate/backup.sh
```

```bash
#!/bin/bash

# Database backup
BACKUP_DIR="/home/staymate/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U staymate_user damage_claims_db > $BACKUP_DIR/database_backup_$DATE.sql

# Create application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /home/staymate/staymate-claims --exclude=node_modules --exclude=.git

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /home/staymate/backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /home/staymate/backup.sh
```

---

## Monitoring and Maintenance

### 1. PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs staymate-backend

# Monitor resources
pm2 monit

# Restart application
pm2 restart staymate-backend

# Update application
cd /home/staymate/staymate-claims
git pull origin main
npm install
pm2 restart staymate-backend
```

### 2. System Monitoring

```bash
# Install system monitoring tools
sudo apt install htop iotop netstat-nat

# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -m

# Check running services
sudo systemctl status nginx postgresql
pm2 status
```

### 3. Health Check Endpoint

The application includes a health check endpoint at `/health` that you can monitor:

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-09-24T12:00:00.000Z"}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connectivity
psql -h localhost -U staymate_user -d damage_claims_db

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 2. Application Not Starting

```bash
# Check PM2 logs
pm2 logs staymate-backend

# Check if port is in use
sudo netstat -tulpn | grep :5000

# Restart PM2 process
pm2 restart staymate-backend
```

#### 3. Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test SSL configuration
curl -I https://yourdomain.com
```

#### 5. File Upload Issues

```bash
# Check file permissions
ls -la /tmp

# Check Nginx upload size limit
sudo nano /etc/nginx/nginx.conf
# Ensure: client_max_body_size 50M;

# Check backend upload configuration
# Verify multer configuration in backend/middleware/upload.js
```

### Log Locations

- **Backend Logs**: `/home/staymate/staymate-claims/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`
- **System Logs**: `/var/log/syslog`

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_damage_reports_status ON damage_reports(status);
   CREATE INDEX idx_damage_reports_created_at ON damage_reports(created_at);
   ```

2. **Nginx Optimization**
   - Enable gzip compression
   - Set proper cache headers
   - Use HTTP/2

3. **Application Optimization**
   - Monitor memory usage with PM2
   - Use clustering for multiple CPU cores
   - Implement database connection pooling

---

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall configured properly
- [ ] Strong database passwords
- [ ] JWT secret is secure and unique
- [ ] CORS origins properly configured
- [ ] Security headers implemented
- [ ] Regular backups scheduled
- [ ] System updates automated
- [ ] Log rotation configured
- [ ] Non-root user for application
- [ ] File upload restrictions in place
- [ ] Rate limiting implemented (if needed)

---

## Update Procedure

1. **Backup current version**
   ```bash
   /home/staymate/backup.sh
   ```

2. **Pull latest changes**
   ```bash
   cd /home/staymate/staymate-claims
   git pull origin main
   ```

3. **Update dependencies**
   ```bash
   npm install
   cd frontend && npm install && npm run build
   ```

4. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Restart services**
   ```bash
   pm2 restart staymate-backend
   sudo systemctl reload nginx
   ```

---

This comprehensive guide should help you deploy and maintain your StayMate Claims application successfully. Always test changes in a staging environment before applying them to production.