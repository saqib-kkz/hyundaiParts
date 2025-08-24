import crypto from 'crypto';

export interface PaymentRequest {
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_id: string;
  description: string;
  parts_cost: number;
  freight_cost: number;
  callback_url?: string;
  webhook_url?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;
  payment_url?: string;
  expires_at?: string;
  error?: string;
}

export interface PaymentStatus {
  payment_id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  transaction_id?: string;
  paid_at?: string;
  failure_reason?: string;
}

export interface WebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'payment.expired';
  payment_id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  transaction_id?: string;
  paid_at?: string;
  customer_email: string;
  signature: string;
}

class SandboxPaymentGateway {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiKey = process.env.PAYMENT_API_KEY || 'sandbox_pk_test_12345';
    this.apiSecret = process.env.PAYMENT_API_SECRET || 'sandbox_sk_test_67890';
    this.baseUrl = process.env.PAYMENT_BASE_URL || 'https://sandbox-api.payment-gateway.com';
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_sandbox_abc123';
  }

  /**
   * Create a payment session for parts and freight
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Generate a unique payment ID for sandbox
      const paymentId = `pay_${crypto.randomBytes(16).toString('hex')}`;
      
      // In production, this would make an actual API call
      // For sandbox, we'll simulate the response
      const sandboxResponse = await this.simulatePaymentCreation(request, paymentId);
      
      if (!sandboxResponse.success) {
        return {
          success: false,
          error: sandboxResponse.error || 'Failed to create payment'
        };
      }

      // Create a sandbox payment URL
      const paymentUrl = `${this.baseUrl}/payment/${paymentId}?sandbox=true`;
      
      // Store payment in temporary storage (in production, this would be in the database)
      await this.storePaymentSession(paymentId, request);

      return {
        success: true,
        payment_id: paymentId,
        payment_url: paymentUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: 'Internal payment gateway error'
      };
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
      // In production, this would make an API call to check status
      // For sandbox, we'll simulate based on payment ID patterns
      const mockStatus = this.simulatePaymentStatus(paymentId);
      return mockStatus;
    } catch (error) {
      console.error('Payment status check error:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook payload
   */
  async processWebhook(payload: WebhookPayload): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify the webhook signature
      const payloadString = JSON.stringify(payload);
      if (!this.verifyWebhookSignature(payloadString, payload.signature)) {
        return {
          success: false,
          message: 'Invalid webhook signature'
        };
      }

      // Process different webhook events
      switch (payload.event) {
        case 'payment.completed':
          await this.handlePaymentCompleted(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'payment.expired':
          await this.handlePaymentExpired(payload);
          break;
        default:
          console.log('Unhandled webhook event:', payload.event);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process webhook'
      };
    }
  }

  /**
   * Handle payment completed webhook
   */
  private async handlePaymentCompleted(payload: WebhookPayload): Promise<void> {
    console.log('Payment completed:', payload);
    
    // Update order status in database
    // Send confirmation notifications
    // Trigger next workflow step
    
    // For now, just log the successful payment
    console.log(`Payment ${payload.payment_id} completed for order ${payload.order_id}`);
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(payload: WebhookPayload): Promise<void> {
    console.log('Payment failed:', payload);
    
    // Update order status
    // Send failure notifications
    // Optionally create new payment link
    
    console.log(`Payment ${payload.payment_id} failed for order ${payload.order_id}`);
  }

  /**
   * Handle payment expired webhook
   */
  private async handlePaymentExpired(payload: WebhookPayload): Promise<void> {
    console.log('Payment expired:', payload);
    
    // Update order status
    // Send expiration notifications
    
    console.log(`Payment ${payload.payment_id} expired for order ${payload.order_id}`);
  }

  /**
   * Simulate payment creation for sandbox
   */
  private async simulatePaymentCreation(request: PaymentRequest, paymentId: string): Promise<PaymentResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      return {
        success: false,
        error: 'Sandbox: Simulated payment creation failure'
      };
    }

    return {
      success: true,
      payment_id: paymentId
    };
  }

  /**
   * Simulate payment status for sandbox
   */
  private simulatePaymentStatus(paymentId: string): PaymentStatus {
    // Create deterministic status based on payment ID
    const hash = crypto.createHash('md5').update(paymentId).digest('hex');
    const statusCode = parseInt(hash.slice(0, 2), 16) % 100;
    
    if (statusCode < 60) {
      return {
        payment_id: paymentId,
        status: 'completed',
        amount: 450.00,
        currency: 'SAR',
        transaction_id: `txn_${crypto.randomBytes(8).toString('hex')}`,
        paid_at: new Date().toISOString()
      };
    } else if (statusCode < 80) {
      return {
        payment_id: paymentId,
        status: 'pending',
        amount: 450.00,
        currency: 'SAR'
      };
    } else if (statusCode < 95) {
      return {
        payment_id: paymentId,
        status: 'failed',
        amount: 450.00,
        currency: 'SAR',
        failure_reason: 'Insufficient funds'
      };
    } else {
      return {
        payment_id: paymentId,
        status: 'expired',
        amount: 450.00,
        currency: 'SAR'
      };
    }
  }

  /**
   * Store payment session (in production, this would be in database)
   */
  private async storePaymentSession(paymentId: string, request: PaymentRequest): Promise<void> {
    // In production, store in database with expiration
    console.log(`Storing payment session ${paymentId} for order ${request.order_id}`);
  }

  /**
   * Generate payment link with breakdown
   */
  generatePaymentBreakdown(partsCost: number, freightCost: number): {
    parts_cost: number;
    freight_cost: number;
    total_cost: number;
    currency: string;
  } {
    return {
      parts_cost: partsCost,
      freight_cost: freightCost,
      total_cost: partsCost + freightCost,
      currency: 'SAR'
    };
  }

  /**
   * Create WhatsApp payment message
   */
  createPaymentMessage(customerName: string, partName: string, breakdown: any, paymentUrl: string): string {
    return `
🚗 *Hyundai Spare Parts - Payment Ready*

Hello ${customerName},

Your requested part is available:
*${partName}*

💰 *Payment Breakdown:*
• Parts Cost: ${breakdown.parts_cost.toFixed(2)} SAR
• Freight Cost: ${breakdown.freight_cost.toFixed(2)} SAR
• *Total: ${breakdown.total_cost.toFixed(2)} SAR*

🔗 *Payment Link:*
${paymentUrl}

⏰ This link expires in 24 hours.

After payment confirmation, we'll immediately start processing your order for dispatch.

Thank you for choosing Hyundai × Wallan Group!
`.trim();
  }

  /**
   * Create payment confirmation message
   */
  createConfirmationMessage(customerName: string, transactionId: string, partName: string): string {
    return `
✅ *Payment Confirmed - Hyundai Spare Parts*

Hello ${customerName},

Your payment has been successfully processed!

📋 *Order Details:*
• Part: ${partName}
• Transaction ID: ${transactionId}
• Status: Paid ✅

🚚 *Next Steps:*
Your order is now being processed and will be dispatched within 24-48 hours. You'll receive tracking information once shipped.

Thank you for your business!

Hyundai × Wallan Group
`.trim();
  }

  /**
   * Create dispatch notification message
   */
  createDispatchMessage(customerName: string, trackingNumber: string, partName: string): string {
    return `
🚚 *Order Dispatched - Hyundai Spare Parts*

Hello ${customerName},

Great news! Your order has been dispatched.

📦 *Shipment Details:*
• Part: ${partName}
• Tracking Number: ${trackingNumber}
• Status: Dispatched 🚚

🔍 You can track your package using the tracking number above.

Expected delivery: 2-3 business days

Thank you for choosing Hyundai × Wallan Group!
`.trim();
  }
}

// Export singleton instance
export const paymentGateway = new SandboxPaymentGateway();

// Export types and classes
export { SandboxPaymentGateway };
