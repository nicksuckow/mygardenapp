# Free Deployment Guide

This guide will help you deploy your garden app to **Vercel** (free hosting) with **Neon** (free PostgreSQL database).

## Prerequisites

- GitHub account (you already have this)
- Vercel account (free)
- Neon account (free)

---

## Step 1: Set Up Neon Database (Free PostgreSQL)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with your GitHub account (easiest)
3. Click "Create Project"
4. Choose a project name (e.g., "mygardenapp")
5. Select region closest to you
6. Click "Create Project"
7. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
8. Save this somewhere safe - you'll need it for Vercel

---

## Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click "Add New..." → "Project"
4. Import your repository: `nicksuckow/mygardenapp`
5. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./
   - **Build Command**: `npm run build` (default)
   - **Install Command**: `npm install` (default)

6. **Add Environment Variables** (click "Environment Variables"):

   Add these three variables:

   ```
   DATABASE_URL
   postgresql://[your-neon-connection-string-from-step-1]

   NEXTAUTH_SECRET
   [generate one by running: openssl rand -base64 32]

   RAPIDAPI_KEY
   [your RapidAPI key for Verdantly]
   ```

7. Click "Deploy"
8. Wait 2-3 minutes for deployment to complete

---

## Step 3: Run Database Migrations

After your first deployment:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Verify all 3 environment variables are set
4. Go to "Deployments"
5. Click the "..." menu on your latest deployment
6. Click "Redeploy"
7. Check "Use existing Build Cache" is OFF
8. Click "Redeploy"

This will run your Prisma migrations and set up the database.

---

## Step 4: Access Your App

1. After deployment completes, click "Visit" or go to the URL shown (e.g., `mygardenapp.vercel.app`)
2. Create an account (sign up)
3. Your wife can now access it from her iPad at that URL!

---

## Updating the App

Whenever you make changes:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

2. Vercel will automatically detect the push and redeploy (takes ~2 minutes)

---

## Important Notes

### Free Tier Limits
- **Neon**: 512 MB storage, 1 database (more than enough for your garden app)
- **Vercel**: 100 GB bandwidth/month, unlimited deployments (plenty for personal use)

### Environment Variables
- Never commit your `.env` file to GitHub
- Only edit environment variables in Vercel dashboard
- Changes to env vars require a redeploy

### Database Access
- You can view/edit your database at [https://console.neon.tech](https://console.neon.tech)
- Use the built-in SQL editor to run queries if needed

### Custom Domain (Optional)
- You can add a custom domain in Vercel for free
- Or use the provided `.vercel.app` URL

---

## Troubleshooting

### Build fails with Prisma error
- Make sure DATABASE_URL is set in environment variables
- Go to Vercel → Settings → General → scroll down
- Click "Redeploy" without build cache

### Can't log in after deployment
- Make sure NEXTAUTH_SECRET is set
- Make sure NEXTAUTH_URL is set to your Vercel URL (e.g., `https://mygardenapp.vercel.app`)

### Search doesn't work
- Make sure RAPIDAPI_KEY is set in Vercel environment variables
- Check the key is valid at [https://rapidapi.com](https://rapidapi.com)

---

## Next Steps

1. **Test everything**: Sign up, create a garden, add beds, import plants
2. **Share with your wife**: Send her the Vercel URL
3. **Add to home screen** on iPad: In Safari, tap Share → Add to Home Screen (makes it feel like a native app!)

---

## Cost

Everything is **100% FREE**:
- ✅ Neon database (free tier)
- ✅ Vercel hosting (free tier)
- ✅ GitHub (free)
- ✅ RapidAPI Verdantly (free tier allows plenty of searches)

Your app should stay within free limits for personal use.
