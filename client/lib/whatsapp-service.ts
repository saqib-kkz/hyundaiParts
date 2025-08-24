interface WhatsAppConfig {
  phone_number: string;
  display_name: string;
  business_name: string;
  welcome_message: string;
  payment_message_template: string;
  dispatch_message_template: string;
  is_active: boolean;
}

interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'welcome' | 'payment' | 'dispatch';
}

class WhatsAppService {
  private config: WhatsAppConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const savedConfig = localStorage.getItem('whatsapp_config');
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
    }
  }

  public getConfig(): WhatsAppConfig | null {
    return this.config;
  }

  public isConfigured(): boolean {
    return this.config !== null && this.config.is_active;
  }

  public generateWelcomeMessage(customerName: string, partName: string): string {
    if (!this.config) {
      return `Hello ${customerName}! Thank you for your spare parts request for ${partName}. We will process it shortly.`;
    }

    return this.config.welcome_message
      .replace('{customer_name}', customerName)
      .replace('{part_name}', partName);
  }

  public generatePaymentMessage(
    customerName: string,
    partName: string,
    paymentUrl: string,
    totalAmount: number,
    currency: string = 'SAR'
  ): string {
    if (!this.config) {
      return `Hello ${customerName}! Your payment link is ready: ${paymentUrl}\n\nOrder Details:\nPart: ${partName}\nTotal: ${totalAmount.toFixed(2)} ${currency}\n\nPlease complete your payment to proceed with your order.`;
    }

    return this.config.payment_message_template
      .replace('{customer_name}', customerName)
      .replace('{part_name}', partName)
      .replace('{payment_url}', paymentUrl)
      .replace('{total_amount}', totalAmount.toFixed(2))
      .replace('{currency}', currency);
  }

  public generateDispatchMessage(
    customerName: string,
    partName: string,
    trackingNumber: string,
    orderId: string
  ): string {
    if (!this.config) {
      return `Great news ${customerName}! Your order has been dispatched.\n\nTracking Number: ${trackingNumber}\nOrder ID: ${orderId}\nPart: ${partName}\nExpected Delivery: 2-3 business days\n\nThank you for choosing our service!`;
    }

    return this.config.dispatch_message_template
      .replace('{customer_name}', customerName)
      .replace('{part_name}', partName)
      .replace('{tracking_number}', trackingNumber)
      .replace('{order_id}', orderId);
  }

  public async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp is not configured. Please configure your WhatsApp account first.'
      };
    }

    try {
      // In a real implementation, this would call your backend API
      // which would then use WhatsApp Business API or similar service
      
      // For now, we'll simulate sending the message
      console.log('Sending WhatsApp message:', {
        to: message.to,
        message: message.message,
        type: message.type,
        from: this.config?.phone_number
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, this would be:
      // const response = await fetch('/api/whatsapp/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: message.to,
      //     message: message.message,
      //     from: this.config?.phone_number
      //   })
      // });

      return { success: true };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: 'Failed to send WhatsApp message'
      };
    }
  }

  public generateWhatsAppLink(phoneNumber: string, message?: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = message ? encodeURIComponent(message) : '';
    return `https://wa.me/${cleanNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
  }

  public openWhatsAppChat(phoneNumber: string, message?: string): void {
    const whatsappUrl = this.generateWhatsAppLink(phoneNumber, message);
    window.open(whatsappUrl, '_blank');
  }

  public async sendWelcomeMessage(customerPhone: string, customerName: string, partName: string): Promise<{ success: boolean; error?: string }> {
    const message = this.generateWelcomeMessage(customerName, partName);
    return this.sendMessage({
      to: customerPhone,
      message,
      type: 'welcome'
    });
  }

  public async sendPaymentMessage(
    customerPhone: string,
    customerName: string,
    partName: string,
    paymentUrl: string,
    totalAmount: number,
    currency: string = 'SAR'
  ): Promise<{ success: boolean; error?: string }> {
    const message = this.generatePaymentMessage(customerName, partName, paymentUrl, totalAmount, currency);
    return this.sendMessage({
      to: customerPhone,
      message,
      type: 'payment'
    });
  }

  public async sendDispatchMessage(
    customerPhone: string,
    customerName: string,
    partName: string,
    trackingNumber: string,
    orderId: string
  ): Promise<{ success: boolean; error?: string }> {
    const message = this.generateDispatchMessage(customerName, partName, trackingNumber, orderId);
    return this.sendMessage({
      to: customerPhone,
      message,
      type: 'dispatch'
    });
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
export type { WhatsAppConfig, WhatsAppMessage }; 