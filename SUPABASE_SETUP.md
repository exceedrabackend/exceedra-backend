# Supabase Setup Guide

This guide will help you set up Supabase for both database and image storage for the Damage Claim Automation System.

## 🎯 Why Supabase?

- **Free Tier**: 1GB storage + PostgreSQL database
- **Built for Web Apps**: Purpose-built for modern applications
- **Global CDN**: Fast image delivery worldwide
- **Automatic Backups**: Your data is safe
- **Real-time Features**: Built-in if you need them later

## 📋 Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

## 🚀 Step 2: Create New Project

1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `damage-claim-system`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

## 🔑 Step 3: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🗄️ Step 4: Setup Database

### Option A: Use Supabase Database (Recommended)

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. Use this as your `DATABASE_URL` in environment variables

### Option B: Keep External Database

If you prefer to keep using an external PostgreSQL database, that's fine too. Just use Supabase for storage only.

## 📁 Step 5: Setup Storage Bucket

1. Go to **Storage** in the sidebar
2. Click "Create a new bucket"
3. Bucket details:
   - **Name**: `damage-images`
   - **Public bucket**: ✅ **Yes** (important!)
4. Click "Create bucket"

## 🔐 Step 6: Configure Storage Policies

1. Click on your `damage-images` bucket
2. Go to **Policies** tab
3. Click "Add policy" → "For full customization"

### Policy 1: Public Read Access
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'damage-images');
```

### Policy 2: Authenticated Upload
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'damage-images' AND auth.role() = 'authenticated');
```

### Policy 3: Authenticated Delete
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'damage-images' AND auth.role() = 'authenticated');
```

**Alternative: Quick Setup**
If the above seems complex, you can also:
1. Click "Add policy" → "Get started quickly"
2. Select "Allow access to JPG images for all users"
3. This creates basic public policies

## ⚙️ Step 7: Environment Variables

Add these to your `.env` file:

```env
# Database (if using Supabase DB)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres"

# Supabase Storage
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-from-step-3"
```

## 🧪 Step 8: Test Your Setup

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm run dev
```

3. Try uploading a damage report with images
4. Check your Supabase Storage dashboard to see uploaded files

## 🔍 Troubleshooting

### Images not uploading?
- Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify the bucket name is exactly `damage-images`
- Ensure bucket is set to **public**

### Database connection issues?
- Verify your `DATABASE_URL` includes the correct password
- Check that database password doesn't contain special characters
- Try connecting from Supabase dashboard first

### Storage policies not working?
- Go to Storage → your bucket → Policies
- Make sure "Enable RLS" is turned ON
- Verify policies are created correctly

## 💡 Tips

1. **Monitor Usage**: Check your Supabase dashboard regularly for usage stats
2. **Backup Strategy**: Supabase handles backups, but consider periodic exports
3. **Security**: Never expose your `service_role` key, only use `anon` key in frontend
4. **Performance**: Images are automatically served via global CDN

## 📊 Usage Limits (Free Tier)

- **Database**: 500MB storage
- **Storage**: 1GB files
- **Bandwidth**: 2GB/month
- **API Requests**: 50,000/month

These limits are generous for most small to medium businesses.

## 🎉 You're Ready!

Once you complete these steps, your damage claim system will use:
- ✅ Free database hosting
- ✅ Free image storage with CDN
- ✅ Automatic backups
- ✅ Global performance

Need help? Check the [Supabase documentation](https://supabase.com/docs) or ask in their Discord community.