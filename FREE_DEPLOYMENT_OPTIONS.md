# StayMate Claims - Free Deployment Options

Here are several completely free methods to deploy your backend and PostgreSQL database without any cost.

## Table of Contents
1. [Render.com (Recommended)](#1-rendercom-recommended)
2. [Railway](#2-railway)
3. [Supabase (Backend + Database)](#3-supabase-backend--database)
4. [Vercel + PlanetScale](#4-vercel--planetscale)
5. [Fly.io](#5-flyio)
6. [Heroku Alternative Options](#6-heroku-alternative-options)
7. [Comparison Table](#comparison-table)

---

## 1. Render.com (Recommended)

### ✅ **Why Render is Best:**
- **Free PostgreSQL database** (1GB storage)
- **Free backend hosting** (512MB RAM, sleeps after 15 min inactivity)
- **Easy GitHub integration**
- **Automatic deployments**
- **Built-in environment variables**

### 🚀 **Deployment Steps:**

#### A. Deploy Database
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `staymate-database`
   - **Database**: `damage_claims_db`
   - **User**: `staymate_user`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. **Save the connection details** (Internal/External Database URL)

#### B. Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `staymate-backend`
   - **Root Directory**: `backend` (if backend is in subfolder)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `node server.js`
   - **Plan**: Free

#### C. Environment Variables
Add these in Render dashboard:
```env
DATABASE_URL=postgresql://user:pass@host:port/db  # From step A
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
PORT=10000
```

#### D. Your URLs:
- **Backend**: `https://staymate-backend.onrender.com`
- **Database**: Internal connection via `DATABASE_URL`

---

## 2. Railway

### ✅ **Features:**
- **$5/month free credits** (usually lasts full month)
- **PostgreSQL included**
- **GitHub integration**
- **No sleep mode** (unlike Render)

### 🚀 **Deployment Steps:**

#### A. Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and deploys

#### B. Add PostgreSQL
1. In your project dashboard, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically creates database and provides `DATABASE_URL`

#### C. Environment Variables
Click on your service → Variables:
```env
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
# DATABASE_URL is automatically provided
```

#### D. Your URLs:
- **Backend**: `https://your-app.up.railway.app`
- **Database**: Automatically connected

---

## 3. Supabase (Backend + Database)

### ✅ **Features:**
- **Free PostgreSQL** (500MB database, 2GB bandwidth)
- **Can host backend** using Edge Functions
- **Built-in authentication**
- **Real-time subscriptions**

### 🚀 **Deployment Steps:**

#### A. Setup Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. "New Project" → Choose org → Set name and password
3. Wait for project to be created

#### B. Database Setup
1. Go to SQL Editor in dashboard
2. Run your Prisma schema SQL manually, or
3. Use Prisma with Supabase connection string

#### C. Deploy Backend (Edge Functions)
```bash
# Install Supabase CLI
npm install supabase --save-dev

# Login and init
npx supabase login
npx supabase init

# Create edge function
npx supabase functions new staymate-api

# Deploy
npx supabase functions deploy staymate-api
```

#### D. Your URLs:
- **Backend**: `https://your-project.supabase.co/functions/v1/staymate-api`
- **Database**: Built-in PostgreSQL

---

## 4. Vercel + PlanetScale

### ✅ **Features:**
- **Vercel**: Free backend hosting (serverless)
- **PlanetScale**: Free MySQL database (1GB)
- **Both have generous free tiers**

### 🚀 **Deployment Steps:**

#### A. Setup PlanetScale Database
1. Go to [planetscale.com](https://planetscale.com) and sign up
2. "Create database" → Name it → Select free plan
3. Create connection string

#### B. Deploy Backend to Vercel
1. In Vercel dashboard, "New Project"
2. Import from GitHub
3. Set Root Directory: `backend`
4. Add environment variables:
```env
DATABASE_URL=mysql://user:pass@host/db?sslaccept=strict
NODE_ENV=production
JWT_SECRET=your-jwt-secret
```

#### C. Your URLs:
- **Backend**: `https://your-backend.vercel.app`
- **Database**: PlanetScale MySQL

---

## 5. Fly.io

### ✅ **Features:**
- **$5/month free credits**
- **PostgreSQL included**
- **Global deployment**
- **Docker-based deployment**

### 🚀 **Deployment Steps:**

#### A. Install Fly CLI and Deploy
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and initialize
fly auth login
fly launch

# Add PostgreSQL
fly postgres create

# Deploy
fly deploy
```

#### B. Your URLs:
- **Backend**: `https://your-app.fly.dev`
- **Database**: Managed PostgreSQL

---

## 6. Heroku Alternative Options

Since Heroku discontinued free tier, here are similar alternatives:

### A. **Cyclic.sh**
- Free hosting for Node.js apps
- 1GB storage, 100GB bandwidth
- Easy GitHub integration

### B. **Deta Space**
- Free hosting and database
- Simple deployment process
- Good for small applications

---

## Comparison Table

| Platform | Backend | Database | Free Limits | Pros | Cons |
|----------|---------|----------|-------------|------|------|
| **Render** | ✅ Free | ✅ PostgreSQL | 512MB RAM, 1GB DB | Easy setup, reliable | Sleeps after 15min |
| **Railway** | ✅ $5 credits | ✅ PostgreSQL | $5/month credits | No sleep, fast | Credits-based |
| **Supabase** | ✅ Edge Functions | ✅ PostgreSQL | 500MB DB, 2GB bandwidth | Built-in auth, real-time | Learning curve |
| **Vercel + PlanetScale** | ✅ Serverless | ✅ MySQL | 1GB DB, generous limits | Fast, scalable | MySQL instead of PostgreSQL |
| **Fly.io** | ✅ $5 credits | ✅ PostgreSQL | $5/month credits | Global, fast | Credits-based |

---

## 🏆 **My Recommendations:**

### **Best Overall: Render.com**
```yaml
Pros:
  - Completely free
  - PostgreSQL included
  - Easy deployment
  - Good documentation

Cons:
  - App sleeps after 15 minutes of inactivity
  - 512MB RAM limit

Perfect for: Testing, demos, low-traffic apps
```

### **Best for Production: Railway**
```yaml
Pros:
  - No sleep mode
  - $5 credits usually last full month
  - PostgreSQL included
  - Fast deployments

Cons:
  - Credit-based (but generous)

Perfect for: Apps with regular traffic
```

### **Best for Full Stack: Supabase**
```yaml
Pros:
  - Database + Backend + Auth all-in-one
  - Real-time features
  - Good free tier

Cons:
  - Different architecture (Edge Functions)
  - Learning curve

Perfect for: Modern full-stack apps
```

---

## 🚀 **Quick Start with Render (Recommended)**

### 1. Prepare Your Code
Update your `backend/package.json`:
```json
{
  "scripts": {
    "build": "npx prisma generate",
    "start": "node server.js"
  }
}
```

### 2. Deploy Database on Render
- Create PostgreSQL database
- Note the connection string

### 3. Deploy Backend on Render
- Connect GitHub repository
- Set build/start commands
- Add environment variables
- Deploy!

### 4. Update Frontend Environment
```env
REACT_APP_API_BASE_URL=https://staymate-backend.onrender.com
```

### 5. Deploy Frontend on Vercel
- Same process as before
- Update environment variables

---

## ⚠️ **Important Notes:**

### **Free Tier Limitations:**
- **Render**: App sleeps after 15 minutes (cold starts ~30 seconds)
- **Railway**: $5 credits per month (usually enough)
- **Database limits**: 1GB storage typically

### **Production Considerations:**
- Free tiers perfect for **development/testing**
- For production with traffic, consider upgrading
- Always have **backups** of your database

### **Cold Start Solutions:**
- Use **UptimeRobot** (free) to ping your app every 5 minutes
- Or upgrade to paid tier for always-on

---

## 🎯 **Final Recommendation:**

**Start with Render.com for the easiest free deployment:**
1. ✅ Free PostgreSQL database
2. ✅ Free backend hosting
3. ✅ GitHub integration
4. ✅ Environment variables
5. ✅ SSL certificates included

Total cost: **$0/month** 🎉

Later, if you need always-on service, upgrade to Railway or a paid VPS!