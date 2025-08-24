import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/payments', '');
  const method = req.method;

  try {
    // POST /api/payments/create - Create payment link
    if (method === 'POST' && path === '/create') {
      const body = await req.json();
      const {
        order_id,
        customer_name,
        customer_email,
        customer_phone,
        part_name,
        parts_cost,
        freight_cost
      } = body;

      // Validation
      if (!order_id || !customer_name || !customer_email || !parts_cost || !freight_cost) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const totalAmount = parts_cost + freight_cost;
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentUrl = `https://sandbox-payments.netlify.app/pay/${paymentId}`;

      // Generate payment breakdown
      const breakdown = {
        parts_cost: parts_cost,
        freight_cost: freight_cost,
        total_cost: totalAmount,
        currency: 'SAR'
      };

      // Create WhatsApp message
      const whatsappMessage = `🚗 *Hyundai Spare Parts - Payment Ready*

Hello ${customer_name},

Your requested part is available:
*${part_name}*

💰 *Payment Breakdown:*
• Parts Cost: ${parts_cost.toFixed(2)} SAR
• Freight Cost: ${freight_cost.toFixed(2)} SAR
• *Total: ${totalAmount.toFixed(2)} SAR*

🔗 *Payment Link:*
${paymentUrl}

⏰ This link expires in 24 hours.

After payment confirmation, we'll immediately start processing your order for dispatch.

Thank you for choosing Hyundai × Wallan Group!`;

      return new Response(JSON.stringify({
        success: true,
        data: {
          payment_id: paymentId,
          payment_url: paymentUrl,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          breakdown,
          whatsapp_message: whatsappMessage
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST /api/payments/breakdown - Calculate breakdown
    if (method === 'POST' && path === '/breakdown') {
      const body = await req.json();
      const { parts_cost, freight_cost } = body;

      if (typeof parts_cost !== 'number' || typeof freight_cost !== 'number') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Parts cost and freight cost must be numbers'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const breakdown = {
        parts_cost: parts_cost,
        freight_cost: freight_cost,
        total_cost: parts_cost + freight_cost,
        currency: 'SAR'
      };

      return new Response(JSON.stringify({
        success: true,
        data: breakdown
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // GET /api/payments/analytics - Payment analytics
    if (method === 'GET' && path === '/analytics') {
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

      return new Response(JSON.stringify({
        success: true,
        data: analytics
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Payment endpoint not found'
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Payment API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Payment processing failed'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config: Config = {
  path: "/api/payments/*"
};
