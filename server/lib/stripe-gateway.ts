import Stripe from 'stripe';
import crypto from 'crypto';

export interface StripePaymentRequest {
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

export interface StripePaymentResponse {
  success: boolean;
  payment_id?: string;
  payment_url?: string;
  expires_at?: string;
  error?: string;
  checkout_session_id?: string;
}

export interface StripePaymentStatus {
  payment_id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  transaction_id?: string;
  paid_at?: string;
  failure_reason?: string;
  checkout_session_id?: string;
}

export interface StripeWebhookPayload {
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
  checkout_session_id?: string;
}

class StripePaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    // Only initialize Stripe if keys are provided
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-07-30.basil',
      });
    } else {
      console.warn('STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
      this.stripe = null as any;
    }
    
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  }

  /**
   * Create a Stripe checkout session for parts and freight
   */
  async createPayment(request: StripePaymentRequest): Promise<StripePaymentResponse> {
    try {
      // If Stripe is not configured, use mock mode with Stripe-like checkout
      if (!this.stripe) {
        console.log('Stripe not configured - using mock payment mode');
        
        // Generate mock payment data
        const mockPaymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        
        return {
          success: true,
          payment_id: mockPaymentId,
          payment_url: `${this.baseUrl}/payment/stripe-checkout?session_id=${mockSessionId}&mock=true`,
          expires_at: expiresAt.toISOString(),
          checkout_session_id: mockSessionId,
        };
      }

      // Convert amount to cents (Stripe expects amounts in smallest currency unit)
      const amountInCents = Math.round(request.amount * 100);
      
      // Create line items for the checkout session
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: request.currency.toLowerCase(),
            product_data: {
              name: `Hyundai Spare Part: ${request.description}`,
              description: `Parts Cost: ${request.parts_cost} ${request.currency}, Freight: ${request.freight_cost} ${request.currency}`,
              images: ['https://via.placeholder.com/150x150?text=Hyundai+Part'],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ];

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${this.baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.baseUrl}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
        customer_email: request.customer_email,
        metadata: {
          order_id: request.order_id,
          customer_name: request.customer_name,
          customer_phone: request.customer_phone,
          parts_cost: request.parts_cost.toString(),
          freight_cost: request.freight_cost.toString(),
          description: request.description,
        },
        expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      });

      return {
        success: true,
        payment_id: session.id,
        payment_url: session.url!,
        expires_at: new Date(session.expires_at! * 1000).toISOString(),
        checkout_session_id: session.id,
      };
    } catch (error) {
      console.error('Stripe payment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Stripe payment',
      };
    }
  }

  /**
   * Check payment status using checkout session ID
   */
  async getPaymentStatus(checkoutSessionId: string): Promise<StripePaymentStatus | null> {
    try {
      // Handle mock sessions when Stripe is not configured
      if (!this.stripe) {
        console.log('Stripe not configured - checking mock payment status');
        
        // Check if this is a mock session ID
        if (checkoutSessionId.startsWith('cs_mock_')) {
          return {
            payment_id: checkoutSessionId,
            status: 'completed',
            amount: 150, // Mock amount
            currency: 'SAR',
            transaction_id: `txn_mock_${Date.now()}`,
            paid_at: new Date().toISOString(),
            failure_reason: undefined,
            checkout_session_id: checkoutSessionId,
          };
        }
        
        console.warn('Stripe not configured - cannot check payment status');
        return null;
      }

      const session = await this.stripe.checkout.sessions.retrieve(checkoutSessionId);
      
      if (!session) {
        return null;
      }

      let status: 'pending' | 'completed' | 'failed' | 'expired';
      let failureReason: string | undefined;
      let transactionId: string | undefined;
      let paidAt: string | undefined;

      // Map Stripe payment status to our internal status
      if (session.payment_status === 'paid') {
        status = 'completed';
        paidAt = new Date().toISOString();
        // Get payment intent for transaction ID
        if (session.payment_intent) {
          const paymentIntent = await this.stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );
          transactionId = paymentIntent.id;
        }
      } else if (session.payment_status === 'unpaid') {
        status = 'pending';
      } else {
        status = 'failed';
        failureReason = 'Payment failed';
      }

      // Check if session has expired
      if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
        status = 'expired';
      }

      return {
        payment_id: session.id,
        status,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        currency: session.currency?.toUpperCase() || 'SAR',
        transaction_id: transactionId,
        paid_at: paidAt,
        failure_reason: failureReason,
        checkout_session_id: session.id,
      };
    } catch (error) {
      console.error('Stripe payment status check error:', error);
      return null;
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.stripe) {
        console.warn('Stripe not configured - cannot verify webhook signature');
        return false;
      }

      if (!this.webhookSecret) {
        console.warn('No webhook secret configured, skipping signature verification');
        return true;
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      
      return !!event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process Stripe webhook events
   */
  async processWebhook(payload: any, signature: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(payload), signature)) {
        return {
          success: false,
          message: 'Invalid webhook signature',
        };
      }

      const event = payload;

      // Process different webhook events
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handlePaymentCompleted(event.data.object);
          break;
        case 'checkout.session.expired':
          await this.handlePaymentExpired(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log('Unhandled Stripe webhook event:', event.type);
      }

      return { success: true };
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      return {
        success: false,
        message: 'Failed to process webhook',
      };
    }
  }

  /**
   * Handle successful payment completion
   */
  private async handlePaymentCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Stripe payment completed:', session.id);
    
    try {
      // Extract metadata
      const orderId = session.metadata?.order_id;
      const customerName = session.metadata?.customer_name;
      const customerPhone = session.metadata?.customer_phone;
      const partsCost = session.metadata?.parts_cost;
      const freightCost = session.metadata?.freight_cost;
      const description = session.metadata?.description;

      console.log(`Payment completed for order ${orderId} - ${customerName}`);
      console.log(`Amount: ${(session.amount_total || 0) / 100} ${session.currency?.toUpperCase()}`);
      console.log(`Parts: ${partsCost}, Freight: ${freightCost}`);

      // Here you would typically:
      // 1. Update order status in database
      // 2. Send confirmation notifications
      // 3. Trigger next workflow step
      
    } catch (error) {
      console.error('Error handling payment completion:', error);
    }
  }

  /**
   * Handle payment expiration
   */
  private async handlePaymentExpired(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Stripe payment expired:', session.id);
    
    try {
      const orderId = session.metadata?.order_id;
      console.log(`Payment expired for order ${orderId}`);
      
      // Here you would typically:
      // 1. Update order status
      // 2. Send expiration notifications
      // 3. Optionally create new payment link
      
    } catch (error) {
      console.error('Error handling payment expiration:', error);
    }
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log('Stripe payment failed:', paymentIntent.id);
    
    try {
      // Get the checkout session from the payment intent
      const sessions = await this.stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });

      if (sessions.data.length > 0) {
        const session = sessions.data[0];
        const orderId = session.metadata?.order_id;
        console.log(`Payment failed for order ${orderId}`);
        
        // Here you would typically:
        // 1. Update order status
        // 2. Send failure notifications
        // 3. Optionally create new payment link
      }
      
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Generate payment breakdown for frontend
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
      currency: 'SAR',
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

🔗 *Secure Payment Link:*
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
   * Get Stripe configuration for frontend
   */
  getStripeConfig() {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      currency: 'SAR',
      supportedPaymentMethods: ['card'],
    };
  }
}

// Export singleton instance
export const stripeGateway = new StripePaymentGateway();

// Export types and classes
export { StripePaymentGateway }; 