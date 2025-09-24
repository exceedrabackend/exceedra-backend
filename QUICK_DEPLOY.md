# Quick Deployment Guide

## 🚀 Vercel + Railway + Supabase (100% Free)

### 1. Setup Supabase (5 minutes)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Create `damage-images` bucket (public)
3. Get URL and anon key from Settings → API

### 2. Deploy Backend to Railway (3 minutes)
1. Go to [railway.app](https://railway.app) → Deploy from GitHub
2. Connect your repository
3. Add environment variables:
```env
DATABASE_URL=postgresql://postgres:password@host:5432/railway
JWT_SECRET=your-jwt-secret
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### 3. Deploy Frontend to Vercel (2 minutes)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import from GitHub
3. Set build settings:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
4. Add environment variable:
```env
REACT_APP_API_URL=https://your-backend.up.railway.app/api
```

### 4. Update CORS (1 minute)
In your backend, update `FRONTEND_URL` environment variable:
```env
FRONTEND_URL=https://your-app.vercel.app
```

## 🎯 Total Cost: $0/month

- **Vercel**: Free tier (100GB bandwidth)
- **Railway**: $5 free credits monthly
- **Supabase**: 1GB storage + database free

## 📱 Test Your Deployment

1. Open your Vercel URL
2. Login with: `admin@company.com` / `password123`
3. Try reporting damage with photo upload
4. Check Supabase Storage for uploaded images

## ⚠️ Important Notes

- **Gmail Setup**: Use App Password, not regular password
- **CORS**: Make sure FRONTEND_URL matches your Vercel domain exactly
- **Database**: Railway auto-provides PostgreSQL
- **Images**: Check Supabase bucket is set to "public"

## 🆘 Common Issues

**Images not uploading?**
- Check Supabase URL/key are correct
- Verify bucket `damage-images` exists and is public

**CORS errors?**
- Update FRONTEND_URL in Railway to match Vercel domain
- Restart Railway deployment

**Database errors?**
- Check DATABASE_URL in Railway
- Run migrations: `railway run npm run migrate:deploy`

**Email not working?**
- Use Gmail App Password, not regular password
- Check EMAIL_USER and EMAIL_PASS are correct