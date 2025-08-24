# 🚀 Complete Deployment Guide: Railway + Vercel

## 📋 **What We're Deploying**

- **Backend**: Node.js/Express server with Stripe integration → **Railway**
- **Frontend**: React/Vite application → **Vercel**
- **Payment Gateway**: Stripe for secure payment processing
- **Database**: Your existing database solution

## 🎯 **Deployment Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Stripe        │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   Dashboard     │
│                 │    │                 │    │                 │
│   - React App   │    │   - Express API │    │   - Webhooks    │
│   - Static      │    │   - Stripe      │    │   - Payments    │
│   - HTTPS       │    │   - Database    │    │   - Security    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚂 **Step 1: Deploy Backend to Railway**

### **1.1 Sign Up & Create Project**

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create "New Project" → "Deploy from GitHub repo"
4. Select your repository

### **1.2 Configure Environment Variables**

In Railway dashboard → Variables tab, add:

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://your-app-name.railway.app
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
JWT_SECRET=your_very_long_jwt_secret_here
SESSION_SECRET=your_very_long_session_secret_here
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### **1.3 Deploy & Get Domain**

1. Railway auto-deploys on GitHub push
2. Go to Settings → Copy your domain
3. Update `BASE_URL` with your Railway domain

### **1.4 Test Backend**

```bash
# Health check
curl https://your-app-name.railway.app/api/health

# Stripe config
curl https://your-app-name.railway.app/api/stripe/config
```

## 🚀 **Step 2: Deploy Frontend to Vercel**

### **2.1 Sign Up & Import Project**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. "New Project" → "Import Git Repository"
4. Select your repository

### **2.2 Configure Build Settings**

- **Framework Preset**: Vite
- **Build Command**: `npm run build:client`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### **2.3 Set Environment Variables**

In Vercel dashboard → Environment Variables:

```env
VITE_API_BASE_URL=https://your-app-name.railway.app
```

### **2.4 Deploy**

1. Click "Deploy"
2. Wait for build completion
3. Your app is live at `https://your-project-name.vercel.app`

## 🔐 **Step 3: Configure Stripe Production**

### **3.1 Get Production Keys**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to "Live" mode (not test)
3. Developers → API Keys
4. Copy `pk_live_...` and `sk_live_...`

### **3.2 Configure Webhooks**

1. Developers → Webhooks → "Add endpoint"
2. URL: `https://your-app-name.railway.app/api/stripe/webhook`
3. Events to select:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copy webhook secret (`whsec_...`)

### **3.3 Update Environment Variables**

Add these to Railway:

```env
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🔄 **Step 4: Update Frontend API Calls**

The frontend is already updated to use environment variables. It will automatically use your Railway backend URL.

## 🧪 **Step 5: Test Complete Flow**

### **5.1 Test Frontend**

1. Visit your Vercel app
2. Test customer form submission
3. Test admin login

### **5.2 Test Payment Flow**

1. Admin creates payment link
2. Customer receives WhatsApp message
3. Customer completes payment on Stripe
4. Webhook updates order status
5. Admin sees payment confirmation

### **5.3 Test API Endpoints**

```bash
# Frontend
curl https://your-frontend.vercel.app

# Backend Health
curl https://your-backend.railway.app/api/health

# Stripe Config
curl https://your-backend.railway.app/api/stripe/config
```

## 🔧 **Step 6: Production Optimizations**

### **6.1 Custom Domain (Optional)**

1. **Vercel**: Add custom domain in dashboard
2. **Railway**: Custom domains available on paid plans
3. Update environment variables with new domains

### **6.2 SSL & Security**

- ✅ Vercel: Automatic HTTPS
- ✅ Railway: Automatic HTTPS
- ✅ Stripe: PCI DSS compliant

### **6.3 Monitoring**

- **Vercel**: Built-in analytics and monitoring
- **Railway**: Logs and metrics in dashboard
- **Stripe**: Payment analytics and fraud detection

## 🚨 **Troubleshooting Common Issues**

### **Issue 1: CORS Errors**

**Solution**: Update `CORS_ORIGIN` in Railway to match your Vercel domain

### **Issue 2: Stripe Webhook Failures**

**Solution**:

1. Check webhook URL is correct
2. Verify webhook secret in environment variables
3. Check Railway logs for errors

### **Issue 3: Frontend Can't Connect to Backend**

**Solution**:

1. Verify `VITE_API_BASE_URL` is set correctly
2. Check Railway backend is running
3. Test API endpoints directly

### **Issue 4: Build Failures**

**Solution**:

1. Check Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Verify build commands are correct

## 💰 **Costs & Pricing**

### **Vercel (Frontend)**

- **Free Tier**: 100GB bandwidth/month, 100 serverless function executions
- **Pro**: $20/month for unlimited bandwidth and functions

### **Railway (Backend)**

- **Free Tier**: $5 credit/month
- **Paid**: Pay-as-you-use, typically $5-20/month for small apps

### **Stripe**

- **No monthly fees**
- **Transaction fees**: 2.9% + 30¢ per successful charge
- **International cards**: Additional 1% fee

## 🎉 **Success Checklist**

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Stripe production keys configured
- [ ] Webhooks working correctly
- [ ] Payment flow tested end-to-end
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] SSL certificates active
- [ ] Domain names configured (if using custom domains)

## 🆘 **Support & Resources**

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Your App**: Check logs in both Railway and Vercel dashboards

---

**🎯 Your Hyundai Spare Parts app is now production-ready with secure Stripe payments!**
