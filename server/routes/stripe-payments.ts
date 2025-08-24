import { Router } from 'express';
import { stripeGateway, StripePaymentRequest, StripeWebhookPayload } from '../lib/stripe-gateway';

const router = Router();

/**
 * Create a Stripe payment link for a spare parts order
 */
router.post('/create', async (req, res) => {
  try {
    console.log('Stripe payment creation request received:', req.body);
    console.log('Parts cost type:', typeof req.body.parts_cost, 'value:', req.body.parts_cost);
    console.log('Freight cost type:', typeof req.body.freight_cost, 'value:', req.body.freight_cost);
    
    const {
      order_id,
      customer_name,
      customer_email,
      customer_phone,
      part_name,
      parts_cost,
      freight_cost
    } = req.body;

    // Validation with detailed error messages
    const missingFields = [];
    if (!order_id) missingFields.push('order_id');
    if (!customer_name) missingFields.push('customer_name');
    if (!customer_email) missingFields.push('customer_email');
    if (parts_cost === undefined || parts_cost === null) missingFields.push('parts_cost');
    if (freight_cost === undefined || freight_cost === null) missingFields.push('freight_cost');

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check for valid numeric values
    if (typeof parts_cost !== 'number' || parts_cost < 0) {
      return res.status(400).json({
        success: false,
        error: 'parts_cost must be a valid positive number'
      });
    }

    if (typeof freight_cost !== 'number' || freight_cost < 0) {
      return res.status(400).json({
        success: false,
        error: 'freight_cost must be a valid positive number'
      });
    }

    const totalAmount = parts_cost + freight_cost;

    console.log('BASE_URL from env:', process.env.BASE_URL);
    
    const paymentRequest: StripePaymentRequest = {
      amount: totalAmount,
      currency: 'SAR',
      customer_name,
      customer_email,
      customer_phone,
      order_id,
      description: part_name,
      parts_cost,
      freight_cost,
      callback_url: `${process.env.BASE_URL || 'http://localhost:8080'}/payment/success`,
      webhook_url: `${process.env.BASE_URL || 'http://localhost:8080'}/api/stripe/webhook`
    };

    console.log('Calling stripeGateway.createPayment with:', paymentRequest);
    const paymentResponse = await stripeGateway.createPayment(paymentRequest);
    console.log('Payment response:', paymentResponse);

    if (!paymentResponse.success) {
      console.log('Payment creation failed:', paymentResponse.error);
      return res.status(400).json({
        success: false,
        error: paymentResponse.error
      });
    }

    // Generate payment breakdown for response
    const breakdown = stripeGateway.generatePaymentBreakdown(parts_cost, freight_cost);

    // Create WhatsApp message
    const whatsappMessage = stripeGateway.createPaymentMessage(
      customer_name,
      part_name,
      breakdown,
      paymentResponse.payment_url!
    );

    res.json({
      success: true,
      data: {
        payment_id: paymentResponse.payment_id,
        payment_url: paymentResponse.payment_url,
        expires_at: paymentResponse.expires_at,
        checkout_session_id: paymentResponse.checkout_session_id,
        breakdown,
        whatsapp_message: whatsappMessage
      }
    });

  } catch (error) {
    console.error('Stripe payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check Stripe payment status using checkout session ID
 */
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('Checking payment status for session:', sessionId);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const status = await stripeGateway.getPaymentStatus(sessionId);
    console.log('Payment status result:', status);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Stripe payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe signature'
      });
    }

    // Process the webhook
    const result = await stripeGateway.processWebhook(req.body, signature);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

/**
 * Generate payment breakdown for frontend
 */
router.post('/breakdown', (req, res) => {
  try {
    const { parts_cost, freight_cost } = req.body;

    if (typeof parts_cost !== 'number' || typeof freight_cost !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Parts cost and freight cost must be numbers'
      });
    }

    const breakdown = stripeGateway.generatePaymentBreakdown(parts_cost, freight_cost);

    res.json({
      success: true,
      data: breakdown
    });

  } catch (error) {
    console.error('Breakdown calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get Stripe configuration for frontend
 */
router.get('/config', (req, res) => {
  try {
    const config = stripeGateway.getStripeConfig();
    
    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Config retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Simulate payment completion for testing (development only)
 */
router.post('/simulate/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action } = req.body; // 'complete', 'fail', or 'expire'

    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Simulation not allowed in production'
      });
    }

    if (!sessionId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and action are required'
      });
    }

    // Create mock webhook payload for testing
    const mockWebhookPayload = {
      type: action === 'complete' ? 'checkout.session.completed' : 
            action === 'fail' ? 'payment_intent.payment_failed' : 'checkout.session.expired',
      data: {
        object: {
          id: sessionId,
          metadata: {
            order_id: `REQ-${Date.now()}`,
            customer_name: 'Test Customer',
            customer_phone: '+966500000000',
            parts_cost: '250.00',
            freight_cost: '50.00',
            description: 'Test Part'
          },
          amount_total: 30000, // 300.00 SAR in cents
          currency: 'sar',
          payment_status: action === 'complete' ? 'paid' : 'unpaid'
        }
      }
    };

    // Process the simulated webhook
    await stripeGateway.processWebhook(mockWebhookPayload, 'mock_signature_for_testing');

    res.json({
      success: true,
      message: `Payment ${action} simulated successfully`,
      data: mockWebhookPayload
    });

  } catch (error) {
    console.error('Payment simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get payment analytics from Stripe
 */
router.get('/analytics', async (req, res) => {
  try {
    // Mock analytics data - in production, you would query Stripe API
    const analytics = {
      total_payments: 156,
      successful_payments: 142,
      failed_payments: 8,
      expired_payments: 6,
      total_revenue: 45600.00,
      average_payment: 321.13,
      success_rate: 91.03,
      payment_methods: {
        'credit_card': 89,
        'debit_card': 45,
        'bank_transfer': 8
      },
      monthly_revenue: [
        { month: 'Jan', revenue: 12500 },
        { month: 'Feb', revenue: 15800 },
        { month: 'Mar', revenue: 17300 },
      ],
      stripe_fees: 1824.00,
      net_revenue: 43776.00
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 