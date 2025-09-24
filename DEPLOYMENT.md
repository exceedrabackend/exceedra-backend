# Deployment Guide

This guide covers how to deploy the Damage Claim Automation System to production.

## Quick Start (Local Production Test)

1. **Install Dependencies**
```bash
npm install
cd frontend && npm install && cd ..
```

2. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your production values
```

3. **Setup Database**
```bash
npm run generate
npm run migrate
npm run seed
```

4. **Build and Start**
```bash
npm run build
npm start
```

## Production Deployment Options

### Option 1: Heroku Deployment

1. **Create Heroku Apps**
```bash
heroku create your-app-name-api
heroku create your-app-name-frontend
```

2. **Setup Database**
```bash
heroku addons:create heroku-postgresql:hobby-dev -a your-app-name-api
```

3. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET="your-secret" -a your-app-name-api
heroku config:set SUPABASE_URL="https://your-project-id.supabase.co" -a your-app-name-api
heroku config:set SUPABASE_ANON_KEY="your-supabase-anon-key" -a your-app-name-api
# Add all other environment variables
```

4. **Deploy Backend**
```bash
# Create Procfile for backend
echo "web: node backend/server.js" > Procfile
git add .
git commit -m "Add Procfile"
git push heroku main
```

5. **Run Migrations**
```bash
heroku run npm run migrate -a your-app-name-api
heroku run npm run seed -a your-app-name-api
```

### Option 2: DigitalOcean App Platform

1. **Create App via GitHub Integration**
2. **Configure Build Settings**:
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
3. **Add Environment Variables** in the dashboard
4. **Setup Database** component with PostgreSQL

### Option 3: Railway

1. **Connect GitHub Repository**
2. **Deploy Database**:
   - Add PostgreSQL service
   - Copy connection string
3. **Deploy App**:
   - Set environment variables
   - Railway auto-detects Node.js
4. **Run Migrations**:
   ```bash
   railway run npm run migrate
   railway run npm run seed
   ```

### Option 4: Self-Hosted (VPS)

1. **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2
```

2. **Database Setup**
```bash
sudo -u postgres createuser --interactive
sudo -u postgres createdb damage_claims_db
```

3. **Application Setup**
```bash
# Clone repository
git clone <your-repo> /var/www/damage-claim-app
cd /var/www/damage-claim-app

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with production values

# Build frontend
npm run build

# Run migrations
npm run migrate
npm run seed
```

4. **Process Management**
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

## Environment Configuration

### Required Environment Variables

```env
# Database (Production)
DATABASE_URL="postgresql://user:password@host:5432/database"

# Security
JWT_SECRET="your-very-secure-random-string"

# File Storage (Supabase)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Email Notifications
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@company.com"
EMAIL_PASS="your-app-password"

# SMS Notifications (Optional)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="your-twilio-number"

# URLs
FRONTEND_URL="https://your-domain.com"
PORT=5000
```

### Security Considerations

1. **Use Strong Secrets**
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **HTTPS Setup**
- Use SSL certificates (Let's Encrypt for free)
- Configure proper CORS origins
- Set secure headers

3. **Database Security**
- Use connection pooling
- Regular backups
- Restricted access

## Monitoring and Maintenance

### PM2 Ecosystem File
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'damage-claim-api',
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
    time: true
  }]
}
```

### Health Checks
The app includes a health check endpoint at `/api/health`

### Logging
```bash
# View PM2 logs
pm2 logs

# View specific app logs
pm2 logs damage-claim-api
```

### Database Backups
```bash
# Automated backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://your-backup-bucket/
```

## Scaling Considerations

1. **Load Balancing**: Use multiple app instances
2. **Database**: Connection pooling, read replicas
3. **File Storage**: CDN for image delivery
4. **Caching**: Redis for session storage
5. **Monitoring**: Application performance monitoring

## Troubleshooting

### Common Issues

1. **Database Connection**
```bash
# Test database connection
npm run generate
npm run migrate
```

2. **Image Upload Issues**
- Check Cloudinary credentials
- Verify file size limits
- Check network connectivity

3. **Email/SMS Not Working**
- Verify service credentials
- Check spam folders
- Test with simple email first

### Logs and Debugging

```bash
# Check application logs
pm2 logs damage-claim-api

# Check system logs
sudo journalctl -u nginx
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Maintenance Tasks

### Regular Updates
```bash
# Update dependencies
npm update
cd frontend && npm update && cd ..

# Rebuild application
npm run build

# Restart application
pm2 restart damage-claim-api
```

### Database Maintenance
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Optimize database
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

## Support

For deployment issues:
1. Check the application logs
2. Verify all environment variables
3. Test database connectivity
4. Confirm service integrations (Cloudinary, email, SMS)

Remember to test the deployment thoroughly with all user roles and workflows before going live.