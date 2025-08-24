# Hyundai Spare Parts System - Deployment Guide

## 🚀 Production Deployment

This guide will help you deploy the complete Hyundai Spare Parts system to production with full functionality.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Google Cloud Project** with BigQuery enabled
2. **WhatsApp Business API** credentials
3. **Payment Gateway** account (Stripe/HyperPay/PayTabs)
4. **Domain name** (optional but recommended)

## 🔧 Environment Setup

### 1. Configure Environment Variables

Copy `.env.production` and update with your actual credentials:

```bash
cp .env.production .env.local
```

### 2. Required Integrations

#### BigQuery Setup
1. Create a Google Cloud Project
2. Enable BigQuery API
3. Create a service account with BigQuery permissions
4. Download the service account key JSON
5. Set the credentials in your environment

#### WhatsApp Business API
1. Set up WhatsApp Business Account
2. Get API credentials from Facebook Developer Console
3. Configure webhook URL: `https://your-domain.com/api/payments/webhook`

#### Payment Gateway
Choose one and configure:
- **Stripe**: Get API keys from Stripe Dashboard
- **HyperPay**: Saudi-specific payment solution
- **PayTabs**: MENA region payment gateway

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

1. **Connect Repository:**
   - Link your Git repository to Netlify
   - Set build command: `pnpm build`
   - Set publish directory: `dist/spa`

2. **Environment Variables:**
   - Add all environment variables in Netlify dashboard
   - Go to Site Settings → Environment Variables

3. **Deploy:**
   - Push to your main branch
   - Netlify will automatically build and deploy

### Option 2: Vercel

1. **Connect Repository:**
   - Import project from Git
   - Vercel will auto-detect the framework

2. **Environment Variables:**
   - Add in Vercel dashboard under Settings → Environment Variables

3. **Deploy:**
   - Push to main branch for automatic deployment

### Option 3: Railway/Render

1. **Connect Repository**
2. **Set Environment Variables**
3. **Deploy with custom domain**

## 📊 Database Setup

### BigQuery Table Creation

The system will automatically create the required table with this schema:

```sql
CREATE TABLE `your-project.spare_parts.requests` (
  request_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  customer_name STRING NOT NULL,
  phone_number STRING NOT NULL,
  email STRING NOT NULL,
  vehicle_estamra STRING NOT NULL,
  vin_number STRING NOT NULL,
  part_name STRING NOT NULL,
  part_photo_url STRING,
  status STRING NOT NULL,
  price FLOAT64,
  payment_link STRING,
  payment_status STRING NOT NULL,
  notes STRING,
  whatsapp_sent BOOLEAN NOT NULL,
  dispatched_on TIMESTAMP
);
```

## 🔐 Security Configuration

### 1. Authentication
- Admin users are created through the Settings panel
- Default admin: `admin@hyundai-sa.com` / `admin123`
- **Change default credentials immediately**

### 2. API Security
- All admin routes require authentication
- Rate limiting enabled
- CORS configured for your domain

### 3. Data Protection
- All sensitive data encrypted
- Regular backups to BigQuery
- Access logs maintained

## 📱 WhatsApp Integration

### Webhook Setup
1. Configure webhook URL in Facebook Developer Console:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```

2. Set verify token in environment variables

3. Test webhook connection in Settings → WhatsApp tab

## 💳 Payment Integration

### Testing Payments
1. Use test credentials first
2. Test the complete flow:
   - Request submission
   - Status update to "Available"
   - Payment link generation
   - WhatsApp notification

### Production Setup
1. Switch to live credentials
2. Update webhook URLs
3. Test with small amounts

## 🔍 Monitoring & Maintenance

### Health Checks
- API health: `https://your-domain.com/api/ping`
- Database connection: Settings → BigQuery → Test Connection
- WhatsApp status: Settings → WhatsApp → Test Connection

### Regular Maintenance
1. **Data Backup**: Automatic BigQuery backups
2. **Log Monitoring**: Check application logs
3. **Performance**: Monitor response times
4. **Security**: Regular security updates

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version (require 18+)
- Verify all dependencies installed
- Check environment variables

**Database Connection:**
- Verify BigQuery credentials
- Check project permissions
- Ensure billing enabled

**WhatsApp Integration:**
- Verify webhook URL
- Check access tokens
- Confirm business verification

**Payment Issues:**
- Test with sandbox credentials
- Check webhook endpoints
- Verify SSL certificates

## 📞 Support

For deployment assistance:
1. Check application logs
2. Test individual components
3. Use the built-in diagnostics in Settings

## 🔄 Updates

To update the system:
1. Pull latest changes
2. Run `pnpm build`
3. Deploy through your chosen platform
4. Test all integrations

## 📈 Scaling

For high traffic:
1. **Database**: BigQuery scales automatically
2. **API**: Use serverless functions
3. **Files**: Implement CDN for images
4. **Monitoring**: Add performance tracking

---

## 🎯 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] BigQuery connection tested
- [ ] WhatsApp integration working
- [ ] Payment gateway tested
- [ ] Admin access configured
- [ ] Sample data cleared
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring setup
- [ ] Backup strategy confirmed

Your Hyundai Spare Parts system is now ready for production use! 🎉
