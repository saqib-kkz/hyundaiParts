# 🚂 Railway Backend Deployment Guide

## Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Create a new account

## Step 2: Create New Project

1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect it's a Node.js project

## Step 3: Configure Environment Variables

1. In your Railway project dashboard, go to "Variables" tab
2. Add these environment variables (copy from `production.env`):

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://your-app-name.railway.app
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
JWT_SECRET=your_very_long_and_secure_jwt_secret_here_minimum_32_characters
SESSION_SECRET=your_very_long_and_secure_session_secret_here_minimum_32_characters
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## Step 4: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" button in dashboard
3. Wait for build to complete

## Step 5: Get Your Domain

1. Go to "Settings" tab
2. Copy your Railway domain (e.g., `https://your-app-name.railway.app`)
3. Update your `BASE_URL` environment variable with this domain

## Step 6: Test Your API

1. Test health check: `https://your-app-name.railway.app/api/health`
2. Test Stripe endpoint: `https://your-app-name.railway.app/api/stripe/config`

## Step 7: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → Webhooks
3. Add endpoint: `https://your-app-name.railway.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Copy webhook secret and add to Railway environment variables

## Troubleshooting

- Check Railway logs in dashboard
- Verify environment variables are set correctly
- Ensure your Stripe keys are live (not test) keys
- Check CORS settings match your frontend domain
