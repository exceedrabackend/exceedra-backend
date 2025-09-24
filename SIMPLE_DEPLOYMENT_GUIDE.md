# StayMate Claims - Simple Deployment Guide

This guide covers deploying your backend with PostgreSQL (without a custom domain) and frontend on Vercel.

## Table of Contents
1. [Backend Deployment (VPS/Server)](#backend-deployment)
2. [Frontend Deployment (Vercel)](#frontend-deployment)
3. [Testing the Deployment](#testing-the-deployment)
4. [Troubleshooting](#troubleshooting)

---

## Backend Deployment

### Prerequisites
- A VPS/Server (DigitalOcean, Linode, AWS EC2, etc.)
- Ubuntu 20.04 LTS or similar

### 1. Server Setup

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### 2. PostgreSQL Setup

```bash
# Switch to postgres user and create database
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE damage_claims_db;
CREATE USER staymate_user WITH ENCRYPTED PASSWORD 'your_secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE damage_claims_db TO staymate_user;
\q

# Test connection
psql -h localhost -U staymate_user -d damage_claims_db
# Enter password when prompted, then \q to exit
```

### 3. Deploy Application

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/DamageClaimAutomation.git
cd DamageClaimAutomation

# Install dependencies
npm install
```

### 4. Environment Configuration

Create `.env` file in the project root:

```bash
nano .env
```

```env
# Database Configuration
DATABASE_URL="postgresql://staymate_user:your_secure_password_123@localhost:5432/damage_claims_db"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-change-this"
JWT_EXPIRES_IN="7d"

# Server Configuration
NODE_ENV="production"
PORT=5000
CORS_ORIGIN="*"

# Supabase Configuration (if using file uploads)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET_NAME="damage-reports"

# Email Configuration (Gmail example - optional)
EMAIL_FROM="noreply@yourapp.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587

# Frontend URL (will be your Vercel URL)
FRONTEND_URL="https://your-app.vercel.app"
```

### 5. Database Setup

```bash
# Generate Prisma client and run migrations
cd backend
npx prisma generate
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### 6. Start Backend with PM2

```bash
# Go back to project root
cd ..

# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'staymate-backend',
    script: 'backend/server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Create logs directory
mkdir logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it shows you

# Check status
pm2 status
```

### 7. Configure Firewall

```bash
# Install and configure UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 5000  # Your backend port
sudo ufw status
```

### 8. Test Backend

```bash
# Test locally on server
curl http://localhost:5000/health

# Test from external (replace with your server IP)
curl http://YOUR_SERVER_IP:5000/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Your Backend URL
Your backend will be accessible at: `http://YOUR_SERVER_IP:5000`

---

## Frontend Deployment (Vercel)

### 1. Prepare Frontend

Create or update `frontend/.env.production`:

```env
REACT_APP_API_BASE_URL=http://YOUR_SERVER_IP:5000
REACT_APP_FRONTEND_URL=https://your-app.vercel.app
GENERATE_SOURCEMAP=false
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Go to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project's name? staymate-claims
# - In which directory is your code located? ./
# - Want to override the settings? Yes
# - Output Directory: build
# - Build Command: npm run build
# - Install Command: npm install
```

#### Option B: Using Vercel Website

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Set the following settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `REACT_APP_API_BASE_URL`: `http://YOUR_SERVER_IP:5000`
   - `REACT_APP_FRONTEND_URL`: `https://your-app.vercel.app`
   - `GENERATE_SOURCEMAP`: `false`

6. Click "Deploy"

### 3. Update Backend CORS

After getting your Vercel URL, update your backend `.env`:

```bash
# SSH back to your server
ssh root@YOUR_SERVER_IP
cd DamageClaimAutomation

# Edit environment file
nano .env

# Update these lines:
CORS_ORIGIN="https://your-actual-vercel-url.vercel.app"
FRONTEND_URL="https://your-actual-vercel-url.vercel.app"

# Restart backend
pm2 restart staymate-backend
```

---

## Testing the Deployment

### 1. Test Backend Endpoints

```bash
# Health check
curl http://YOUR_SERVER_IP:5000/health

# Test login (should return error for invalid credentials - this is expected)
curl -X POST http://YOUR_SERVER_IP:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'
```

### 2. Test Frontend

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Try to access the login page
3. Test login with seeded credentials:
   - **Admin**: `exceedrasolutions@gmail.com` / `password123`
   - **Claims Team**: `claims@company.com` / `password123`
   - **Cleaner**: `cleaner@company.com` / `password123`

### 3. Test Complete Flow

1. Login as admin/claims team
2. Navigate to damage reports
3. Try exporting Excel file
4. Login as cleaner
5. Try creating a damage report

---

## Troubleshooting

### Backend Issues

#### Backend not starting:
```bash
# Check PM2 logs
pm2 logs staymate-backend

# Check if port is in use
sudo netstat -tulpn | grep :5000

# Restart backend
pm2 restart staymate-backend
```

#### Database connection issues:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U staymate_user -d damage_claims_db

# Check backend logs for database errors
pm2 logs staymate-backend --lines 50
```

#### CORS errors in frontend:
```bash
# Check backend .env file
nano .env
# Ensure CORS_ORIGIN matches your Vercel URL exactly

# Restart backend after changes
pm2 restart staymate-backend
```

### Frontend Issues

#### Build failing on Vercel:
- Check that `frontend` is set as root directory
- Verify build command is `npm run build`
- Check environment variables are set correctly

#### API calls failing:
- Check `REACT_APP_API_BASE_URL` in Vercel environment variables
- Ensure backend is running and accessible
- Check browser console for CORS errors

#### "Module not found" errors:
```bash
# Clear Vercel cache and redeploy
# Or in Vercel dashboard: Settings > Functions > Clear Cache
```

### Common Commands

```bash
# Backend server management
pm2 status                    # Check status
pm2 logs staymate-backend    # View logs
pm2 restart staymate-backend # Restart app
pm2 stop staymate-backend    # Stop app

# System monitoring
htop                         # System resources
df -h                        # Disk usage
free -m                      # Memory usage

# Database backup
pg_dump -h localhost -U staymate_user damage_claims_db > backup.sql

# View backend logs
tail -f logs/combined.log
```

---

## Cost Estimation

### Backend (VPS):
- **DigitalOcean Droplet**: $5-10/month (1GB-2GB RAM)
- **Linode**: $5-10/month
- **AWS EC2 t3.micro**: ~$8/month

### Frontend:
- **Vercel**: Free for personal use
- **Database**: Free (self-hosted PostgreSQL)

### Total: ~$5-10/month

---

## Security Notes

Since you're not using a custom domain:
- Backend will use HTTP (not HTTPS) - fine for testing
- Use strong passwords for database and JWT secret
- Consider using environment-specific secrets
- Monitor logs regularly for any issues

---

## Next Steps (Optional)

Once you want to upgrade:
1. Buy a domain name
2. Set up SSL certificates
3. Configure proper Nginx reverse proxy
4. Set up automated backups
5. Implement monitoring

This simple deployment gets you up and running quickly without the complexity of custom domains and SSL certificates!