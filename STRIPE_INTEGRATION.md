# Stripe Payment Gateway Integration

This document explains how to set up and use the Stripe payment gateway integration in your Hyundai Spare Parts Management System.

## 🚀 Overview

The Stripe integration allows admins to generate secure payment links for customers when they accept spare part requests. Customers can then complete payments using Stripe's secure checkout system.

## ✨ Features

- **Secure Payment Processing**: Uses Stripe's industry-standard payment processing
- **Admin Payment Generation**: Admins can create payment links for accepted requests
- **Real-time Status Updates**: Payment status is tracked in real-time
- **Webhook Integration**: Automatic order status updates on payment completion
- **WhatsApp Integration**: Automatic WhatsApp messages with payment links
- **Test Mode Support**: Full testing capabilities with Stripe test keys

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe @types/stripe
```

### 2. Environment Variables

Create a `.env` file in your server directory with the following variables:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL for your application
BASE_URL=http://localhost:3000
```

### 3. Get Stripe API Keys

1. Sign up for a [Stripe account](https://stripe.com)
2. Go to the Stripe Dashboard
3. Navigate to Developers → API Keys
4. Copy your publishable key and secret key
5. Use test keys for development, live keys for production

### 4. Configure Webhooks

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Copy the webhook secret and add it to your `.env` file

## 🔧 API Endpoints

### Create Payment Link

```http
POST /api/stripe/create
```

**Request Body:**

```json
{
  "order_id": "REQ-12345",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+966500000000",
  "part_name": "Hyundai Engine Filter",
  "parts_cost": 250.0,
  "freight_cost": 50.0
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "payment_id": "cs_test_...",
    "payment_url": "https://checkout.stripe.com/...",
    "expires_at": "2024-01-01T12:00:00.000Z",
    "checkout_session_id": "cs_test_...",
    "breakdown": {
      "parts_cost": 250.0,
      "freight_cost": 50.0,
      "total_cost": 300.0,
      "currency": "SAR"
    },
    "whatsapp_message": "🚗 Hyundai Spare Parts - Payment Ready..."
  }
}
```

### Check Payment Status

```http
GET /api/stripe/status/:sessionId
```

### Get Stripe Configuration

```http
GET /api/stripe/config
```

## 🎯 Usage Flow

### 1. Admin Accepts Request

- Admin reviews spare part request
- Sets parts cost and freight cost
- Clicks "Create Payment Link"

### 2. Payment Link Generation

- System creates Stripe checkout session
- Generates secure payment URL
- Creates WhatsApp message with payment details

### 3. Customer Payment

- Customer receives payment link via WhatsApp
- Completes payment on Stripe checkout page
- Receives confirmation email

### 4. Order Processing

- Webhook updates order status to "Paid"
- System automatically moves order to "Processing"
- Admin can track payment status in dashboard

## 🔒 Security Features

- **Webhook Signature Verification**: All webhooks are verified using Stripe's signature
- **Environment Variable Protection**: Sensitive keys are stored in environment variables
- **HTTPS Required**: Production endpoints require HTTPS
- **Input Validation**: All input data is validated before processing

## 🧪 Testing

### Test Mode

- Use Stripe test keys for development
- Test payments won't charge real money
- Full webhook testing capabilities

### Test Cards

Use these test card numbers:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

### Test Webhooks

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 📱 WhatsApp Integration

The system automatically generates WhatsApp messages with:

- Customer greeting
- Part details
- Payment breakdown
- Secure payment link
- Expiration information

## 🎨 Frontend Components

### PaymentManagementDialog

- Admin interface for creating payment links
- Cost calculation and breakdown
- WhatsApp message generation

### PaymentSuccess

- Customer success page after payment
- Order confirmation details
- Next steps information

### PaymentCancel

- Customer page for cancelled payments
- Support contact information
- Retry payment options

## 🔧 Configuration

### StripeConfigDialog

Admin interface for:

- Setting Stripe API keys
- Configuring webhook secrets
- Testing connections
- Switching between test/live modes

## 🚨 Error Handling

The system handles various error scenarios:

- Invalid API keys
- Network failures
- Webhook verification failures
- Payment processing errors
- Expired sessions

## 📊 Monitoring

### Dashboard Integration

- Payment status tracking
- Revenue analytics
- Order processing metrics
- Payment success rates

### Webhook Logging

- All webhook events are logged
- Payment status changes tracked
- Error logging for debugging

## 🔄 Webhook Events

### checkout.session.completed

- Updates order status to "Paid"
- Sends confirmation notifications
- Triggers order processing workflow

### checkout.session.expired

- Updates order status to "Payment Expired"
- Sends expiration notifications
- Optionally creates new payment link

### payment_intent.payment_failed

- Updates order status to "Payment Failed"
- Sends failure notifications
- Logs failure reasons

## 🚀 Deployment

### Production Checklist

- [ ] Use live Stripe keys
- [ ] Configure production webhook URL
- [ ] Enable HTTPS
- [ ] Set proper environment variables
- [ ] Test webhook endpoints
- [ ] Monitor payment processing

### Environment Variables

```env
NODE_ENV=production
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BASE_URL=https://your-domain.com
```

## 🆘 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check server logs for errors

2. **Payment Links Not Working**
   - Verify Stripe API keys
   - Check environment variables
   - Test with Stripe dashboard

3. **Order Status Not Updating**
   - Check webhook configuration
   - Verify webhook events
   - Check database connections

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=stripe:*
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Testing](https://stripe.com/docs/testing)

## 🤝 Support

For technical support:

- Check the logs for error messages
- Verify your Stripe configuration
- Test with Stripe's test mode
- Contact the development team

---

**Note**: This integration is designed for production use and follows Stripe's best practices for security and reliability.
