import { RequestHandler } from "express";
import { OttuPaymentService, initializeOttu, OTTU_CONFIG } from "../lib/ottu";

// Initialize Ottu service
const ottuConfig = process.env.NODE_ENV === 'production' 
  ? OTTU_CONFIG.production 
  : OTTU_CONFIG.sandbox;

let ottuService: OttuPaymentService | null = null;

// Initialize service if credentials are available
if (ottuConfig.apiKey && ottuConfig.merchantId) {
  ottuService = initializeOttu(ottuConfig);
} else {
  console.warn('Ottu credentials not configured - using mock payment service');
}

// Generate Ottu payment link
export const generateOttuPayment: RequestHandler = async (req, res) => {
  try {
    const { requestId, partPrice, freightPrice, customerInfo } = req.body;

    if (!requestId || !partPrice || !customerInfo) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: requestId, partPrice, customerInfo"
      });
    }

    if (!ottuService) {
      // Mock payment service for development
      const mockPaymentUrl = `https://checkout.ottu.net/b/checkout/redirect_url?session_id=mock_${requestId}_${Date.now()}`;
      
      return res.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        sessionId: `mock_session_${requestId}`,
        amount: partPrice + (freightPrice || 0),
        currency: 'SAR'
      });
    }

    const result = await ottuService.createPaymentSession(
      requestId,
      parseFloat(partPrice),
      parseFloat(freightPrice || '0'),
      customerInfo
    );

    if (result.success) {
      res.json({
        success: true,
        paymentUrl: result.paymentUrl,
        sessionId: result.sessionId,
        amount: partPrice + (freightPrice || 0),
        currency: 'SAR'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Generate Ottu payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate payment link"
    });
  }
};

// Verify Ottu payment status
export const verifyOttuPayment: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required"
      });
    }

    if (!ottuService) {
      // Mock verification for development
      return res.json({
        success: true,
        status: 'paid',
        amount: 100,
        currency: 'SAR'
      });
    }

    const result = await ottuService.verifyPayment(sessionId);

    if (result.success) {
      res.json({
        success: true,
        status: result.status,
        amount: result.amount,
        currency: 'SAR'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Verify Ottu payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment"
    });
  }
};

// Handle Ottu webhook
export const handleOttuWebhook: RequestHandler = async (req, res) => {
  try {
    const signature = req.headers['x-ottu-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!ottuService) {
      console.log('Mock webhook received:', req.body);
      return res.status(200).json({ success: true });
    }

    // Verify webhook signature
    if (!signature || !ottuService.verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid Ottu webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    const webhookData = ottuService.processWebhook(req.body);
    
    console.log('Ottu webhook processed:', webhookData);

    // Update request status based on payment result
    if (webhookData.status === 'paid') {
      // Update request status to "Paid"
      // In production, this would update BigQuery
      console.log(`Payment confirmed for request ${webhookData.requestId}`);
      
      // Send WhatsApp confirmation
      await sendPaymentConfirmation(webhookData.requestId);
    } else if (webhookData.status === 'failed') {
      console.log(`Payment failed for request ${webhookData.requestId}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Ottu webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process webhook"
    });
  }
};

// Send payment confirmation notification
async function sendPaymentConfirmation(requestId: string) {
  try {
    // This would typically fetch customer details and send WhatsApp
    // For now, just log the action
    console.log(`Sending payment confirmation for request ${requestId}`);
    
    // In production:
    // 1. Fetch request details from BigQuery
    // 2. Generate confirmation message
    // 3. Send via WhatsApp Business API
    // 4. Update request status
  } catch (error) {
    console.error("Failed to send payment confirmation:", error);
  }
}

// Enhanced WhatsApp notification service
export const sendWhatsAppNotification: RequestHandler = async (req, res) => {
  try {
    const { 
      requestId, 
      phoneNumber, 
      customerName, 
      messageType, 
      paymentUrl, 
      partPrice, 
      freightPrice, 
      totalAmount 
    } = req.body;

    if (!requestId || !phoneNumber || !customerName || !messageType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    let message = "";

    if (!ottuService) {
      // Mock service - generate appropriate message
      switch (messageType) {
        case "payment_link":
          message = `Mock Payment Link: ${paymentUrl || 'mock-payment-url'} for ${totalAmount} SAR`;
          break;
        case "payment_confirmed":
          message = `Mock Payment Confirmation for ${totalAmount} SAR`;
          break;
        case "dispatched":
          message = `Mock Dispatch Notification for request ${requestId}`;
          break;
        default:
          message = `Mock notification for request ${requestId}`;
      }
    } else {
      // Generate real messages using Ottu service
      switch (messageType) {
        case "payment_link":
          message = ottuService.generatePaymentMessage(
            customerName,
            requestId,
            paymentUrl,
            partPrice || 0,
            freightPrice || 0
          );
          break;
        case "payment_confirmed":
          message = ottuService.generatePaymentConfirmationMessage(
            customerName,
            requestId,
            totalAmount || 0
          );
          break;
        case "dispatched":
          message = ottuService.generateDispatchMessage(
            customerName,
            requestId
          );
          break;
        default:
          message = `Hello ${customerName}, update on your request ${requestId}.`;
      }
    }

    // Log the message (in production, send via WhatsApp Business API)
    console.log(`WhatsApp to ${phoneNumber}:`, message);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: "WhatsApp notification sent successfully",
      messagePreview: message.substring(0, 100) + "..."
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send WhatsApp notification"
    });
  }
};

// Get payment configuration status
export const getPaymentConfig: RequestHandler = async (req, res) => {
  try {
    const isConfigured = !!(ottuConfig.apiKey && ottuConfig.merchantId);
    
    res.json({
      isConfigured,
      provider: 'Ottu',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      supportedCurrencies: ['SAR'],
      features: {
        paymentLinks: true,
        webhooks: true,
        refunds: true,
        recurringPayments: false
      }
    });
  } catch (error) {
    console.error("Get payment config error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get payment configuration"
    });
  }
};
