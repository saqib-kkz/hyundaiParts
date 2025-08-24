interface OttuConfig {
  apiKey: string;
  merchantId: string;
  baseUrl: string; // e.g., 'https://api.ottu.com' or sandbox URL
  webhookSecret: string;
}

interface OttuPaymentRequest {
  amount: number;
  currency: string;
  session_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  order: {
    reference: string;
    description: string;
  };
  notifications: {
    webhook_url: string;
    return_url: string;
  };
}

interface OttuPaymentResponse {
  session_id: string;
  checkout_url: string;
  payment_url: string;
  status: string;
  amount: number;
  currency: string;
}

interface OttuWebhookPayload {
  session_id: string;
  order_no: string;
  status: string;
  amount: number;
  currency: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  payment_gateway: string;
  created_datetime: string;
  paid_datetime?: string;
}

export class OttuPaymentService {
  private config: OttuConfig;

  constructor(config: OttuConfig) {
    this.config = config;
  }

  // Create payment session
  async createPaymentSession(
    requestId: string,
    partPrice: number,
    freightPrice: number,
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    }
  ): Promise<{ success: boolean; paymentUrl?: string; sessionId?: string; error?: string }> {
    try {
      const totalAmount = partPrice + freightPrice;
      const [firstName, ...lastNameParts] = customerInfo.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const paymentRequest: OttuPaymentRequest = {
        amount: totalAmount,
        currency: 'SAR',
        session_id: `spare_parts_${requestId}_${Date.now()}`,
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: customerInfo.email,
          phone: customerInfo.phone.replace(/\D/g, ''), // Remove non-digits
        },
        order: {
          reference: requestId,
          description: `Hyundai Spare Parts - Request ${requestId} (Part: ${partPrice} SAR + Freight: ${freightPrice} SAR)`,
        },
        notifications: {
          webhook_url: `${process.env.API_BASE_URL || ''}/api/payments/ottu/webhook`,
          return_url: `${process.env.FRONTEND_URL || ''}/payment-success?request=${requestId}`,
        },
      };

      const response = await fetch(`${this.config.baseUrl}/b/checkout/v1/pymt-txn/`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Ottu API Error:', errorData);
        return {
          success: false,
          error: `Payment gateway error: ${response.status}`,
        };
      }

      const paymentData: OttuPaymentResponse = await response.json();

      return {
        success: true,
        paymentUrl: paymentData.checkout_url,
        sessionId: paymentData.session_id,
      };
    } catch (error) {
      console.error('Ottu payment creation error:', error);
      return {
        success: false,
        error: 'Failed to create payment session',
      };
    }
  }

  // Verify payment status
  async verifyPayment(sessionId: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/b/checkout/v1/pymt-txn/${sessionId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Api-Key ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to verify payment: ${response.status}`,
        };
      }

      const paymentData = await response.json();

      return {
        success: true,
        status: paymentData.status,
        amount: paymentData.amount,
      };
    } catch (error) {
      console.error('Ottu payment verification error:', error);
      return {
        success: false,
        error: 'Failed to verify payment',
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  // Process webhook payload
  processWebhook(payload: OttuWebhookPayload): {
    requestId: string;
    status: 'paid' | 'failed' | 'pending';
    amount: number;
    currency: string;
    sessionId: string;
  } {
    // Extract request ID from order reference
    const requestId = payload.order_no;

    // Map Ottu status to our internal status
    let status: 'paid' | 'failed' | 'pending' = 'pending';
    switch (payload.status.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'completed':
        status = 'paid';
        break;
      case 'failed':
      case 'cancelled':
      case 'expired':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }

    return {
      requestId,
      status,
      amount: payload.amount,
      currency: payload.currency,
      sessionId: payload.session_id,
    };
  }

  // Generate WhatsApp payment message
  generatePaymentMessage(
    customerName: string,
    requestId: string,
    paymentUrl: string,
    partPrice: number,
    freightPrice: number
  ): string {
    const totalAmount = partPrice + freightPrice;
    
    return `🚗 Hyundai Spare Parts - Payment Required

Hello ${customerName},

Great news! Your requested spare part is available.

📋 Request ID: ${requestId}
💰 Part Price: ${partPrice} SAR
🚚 Freight Cost: ${freightPrice} SAR
💳 Total Amount: ${totalAmount} SAR

To complete your order, please make payment using the secure link below:

🔗 Payment Link: ${paymentUrl}

⚠️ Important:
• This link expires in 24 hours
• Payment is processed securely through Ottu
• You will receive confirmation once payment is received

Need help? Reply to this message.

Best regards,
Hyundai Saudi Arabia × Wallan Group`;
  }

  // Generate payment confirmation message
  generatePaymentConfirmationMessage(
    customerName: string,
    requestId: string,
    amount: number
  ): string {
    return `✅ Payment Confirmed

Hello ${customerName},

Thank you! Your payment has been received successfully.

📋 Request ID: ${requestId}
💰 Amount Paid: ${amount} SAR
⏰ Payment Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })}

📦 Next Steps:
• Your order is now being processed
• Our team will prepare your spare part for dispatch
• You'll receive tracking information once shipped

Estimated delivery: 2-3 business days

Best regards,
Hyundai Saudi Arabia × Wallan Group`;
  }

  // Generate dispatch notification message
  generateDispatchMessage(
    customerName: string,
    requestId: string,
    trackingNumber?: string
  ): string {
    return `🚚 Your Spare Part Has Been Dispatched!

Hello ${customerName},

Your Hyundai spare part has been shipped and is on its way to you.

📋 Request ID: ${requestId}
📦 Status: Dispatched
🚛 Tracking Number: ${trackingNumber || 'Will be provided by carrier'}
📅 Expected Delivery: 1-2 business days

📍 You can track your shipment using the tracking number provided by our courier partner.

📞 For any delivery questions, please contact our support team.

Thank you for choosing Hyundai Saudi Arabia!

Best regards,
Hyundai Saudi Arabia × Wallan Group`;
  }
}

// Singleton instance
let ottuInstance: OttuPaymentService | null = null;

export function initializeOttu(config: OttuConfig): OttuPaymentService {
  ottuInstance = new OttuPaymentService(config);
  return ottuInstance;
}

export function getOttuInstance(): OttuPaymentService | null {
  return ottuInstance;
}

// Default configuration for development
export const OTTU_CONFIG = {
  // Sandbox/Development URLs
  sandbox: {
    baseUrl: 'https://api.ottu.net', // Ottu sandbox URL
    apiKey: process.env.OTTU_SANDBOX_API_KEY || '',
    merchantId: process.env.OTTU_SANDBOX_MERCHANT_ID || '',
    webhookSecret: process.env.OTTU_SANDBOX_WEBHOOK_SECRET || '',
  },
  // Production URLs
  production: {
    baseUrl: 'https://api.ottu.com', // Ottu production URL
    apiKey: process.env.OTTU_API_KEY || '',
    merchantId: process.env.OTTU_MERCHANT_ID || '',
    webhookSecret: process.env.OTTU_WEBHOOK_SECRET || '',
  },
};
