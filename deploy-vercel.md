# 🚀 Vercel Frontend Deployment Guide

## Step 1: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended) or email
3. Create a new account

## Step 2: Import Your Project

1. Click "New Project"
2. Choose "Import Git Repository"
3. Select your repository
4. Vercel will automatically detect it's a Vite/React project

## Step 3: Configure Build Settings

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build:client`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

## Step 4: Set Environment Variables

1. In project settings, go to "Environment Variables"
2. Add this variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-app-name.railway.app` (your Railway backend URL)
   - **Environment**: Production, Preview, Development

## Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## Step 6: Update Frontend API Calls

1. Update your frontend code to use the environment variable:

   ```typescript
   const API_BASE_URL =
     import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
   ```

2. Or update the fetch calls to use your Railway backend:
   ```typescript
   // Instead of: fetch('/api/stripe/create')
   // Use: fetch('https://your-app-name.railway.app/api/stripe/create')
   ```

## Step 7: Test Your Deployment

1. Test the frontend: `https://your-project-name.vercel.app`
2. Test API calls to your Railway backend
3. Test Stripe payment flow

## Step 8: Custom Domain (Optional)

1. Go to "Domains" in Vercel dashboard
2. Add your custom domain
3. Configure DNS settings
4. Update environment variables with new domain

## Troubleshooting

- Check Vercel build logs for errors
- Verify environment variables are set correctly
- Ensure your Railway backend is running
- Test API endpoints directly
- Check CORS settings in Railway backend
