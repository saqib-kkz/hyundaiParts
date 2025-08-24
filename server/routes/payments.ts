import { Router } from 'express';
import { paymentGateway, PaymentRequest, WebhookPayload } from '../lib/payment-gateway';

const router = Router();

/**
 * Create a payment link for a spare parts order
 */
router.post('/create', async (req, res) => {
  try {
    const {
      order_id,
      customer_name,
      customer_email,
      customer_phone,
      part_name,
      parts_cost,
      freight_cost
    } = req.body;

    // Validation
    if (!order_id || !customer_name || !customer_email || !parts_cost || !freight_cost) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const totalAmount = parts_cost + freight_cost;

    const paymentRequest: PaymentRequest = {
      amount: totalAmount,
      currency: 'SAR',
      customer_name,
      customer_email,
      customer_phone,
      order_id,
      description: `Hyundai Spare Part: ${part_name}`,
      parts_cost,
      freight_cost,
      callback_url: `${process.env.BASE_URL}/payment/success`,
      webhook_url: `${process.env.BASE_URL}/api/payments/webhook`
    };

    const paymentResponse = await paymentGateway.createPayment(paymentRequest);

    if (!paymentResponse.success) {
      return res.status(400).json({
        success: false,
        error: paymentResponse.error
      });
    }

    // Generate payment breakdown for response
    const breakdown = paymentGateway.generatePaymentBreakdown(parts_cost, freight_cost);

    // Create WhatsApp message
    const whatsappMessage = paymentGateway.createPaymentMessage(
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
        breakdown,
        whatsapp_message: whatsappMessage
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Check payment status
 */
router.get('/status/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID is required'
      });
    }

    const status = await paymentGateway.getPaymentStatus(payment_id);

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
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Handle payment webhooks
 */
router.post('/webhook', async (req, res) => {
  try {
    const webhookPayload: WebhookPayload = req.body;
    
    // Process the webhook
    const result = await paymentGateway.processWebhook(webhookPayload);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    // Additional processing based on webhook event
    await handleWebhookEvent(webhookPayload);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
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

    const breakdown = paymentGateway.generatePaymentBreakdown(parts_cost, freight_cost);

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
 * Simulate payment completion for testing (sandbox only)
 */
router.post('/simulate/:payment_id', async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { action } = req.body; // 'complete', 'fail', or 'expire'

    // Only allow in development/sandbox mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Simulation not allowed in production'
      });
    }

    if (!payment_id || !action) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID and action are required'
      });
    }

    // Create mock webhook payload
    const webhookPayload: WebhookPayload = {
      event: action === 'complete' ? 'payment.completed' : 
             action === 'fail' ? 'payment.failed' : 'payment.expired',
      payment_id,
      order_id: `REQ-${Date.now()}`,
      status: action === 'complete' ? 'completed' : 
              action === 'fail' ? 'failed' : 'expired',
      amount: 450.00,
      currency: 'SAR',
      transaction_id: action === 'complete' ? `txn_${Date.now()}` : undefined,
      paid_at: action === 'complete' ? new Date().toISOString() : undefined,
      customer_email: 'test@example.com',
      signature: 'mock_signature_for_testing'
    };

    // Process the simulated webhook
    await handleWebhookEvent(webhookPayload);

    res.json({
      success: true,
      message: `Payment ${action} simulated successfully`,
      data: webhookPayload
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
 * Handle webhook events and trigger appropriate actions
 */
async function handleWebhookEvent(payload: WebhookPayload): Promise<void> {
  try {
    switch (payload.event) {
      case 'payment.completed':
        await handlePaymentCompleted(payload);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      case 'payment.expired':
        await handlePaymentExpired(payload);
        break;
    }
  } catch (error) {
    console.error('Webhook event handling error:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentCompleted(payload: WebhookPayload): Promise<void> {
  console.log('Processing payment completion:', payload.order_id);

  try {
    // 1. Update order status to "Paid"
    // In production, this would update the database
    console.log(`Updating order ${payload.order_id} status to Paid`);

    // 2. Send payment confirmation WhatsApp message
    const confirmationMessage = paymentGateway.createConfirmationMessage(
      'Customer', // In production, get from database
      payload.transaction_id || 'N/A',
      'Spare Part' // In production, get from database
    );

    // 3. Trigger automatic status update to "Processing"
    setTimeout(async () => {
      console.log(`Auto-updating order ${payload.order_id} to Processing`);
      // Update status to Processing
      // Send processing notification if needed
    }, 5000); // 5 seconds delay for demo

    console.log('Payment completion handled successfully');
  } catch (error) {
    console.error('Error handling payment completion:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payload: WebhookPayload): Promise<void> {
  console.log('Processing payment failure:', payload.order_id);

  try {
    // 1. Update order status to reflect payment failure
    console.log(`Updating order ${payload.order_id} status to Payment Failed`);

    // 2. Send failure notification
    // 3. Optionally generate new payment link
    // 4. Log failure for admin review

    console.log('Payment failure handled successfully');
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle expired payment
 */
async function handlePaymentExpired(payload: WebhookPayload): Promise<void> {
  console.log('Processing payment expiration:', payload.order_id);

  try {
    // 1. Update order status
    console.log(`Updating order ${payload.order_id} status to Payment Expired`);

    // 2. Send expiration notification
    // 3. Prompt for new payment link generation

    console.log('Payment expiration handled successfully');
  } catch (error) {
    console.error('Error handling payment expiration:', error);
  }
}

/**
 * Get payment analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    // Mock analytics data - in production, query from database
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
      ]
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
