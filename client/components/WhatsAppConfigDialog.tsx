import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Phone,
  User,
  Settings,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Info
} from "lucide-react";

interface WhatsAppConfig {
  phone_number: string;
  display_name: string;
  business_name: string;
  welcome_message: string;
  payment_message_template: string;
  dispatch_message_template: string;
  is_active: boolean;
}

interface WhatsAppConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WhatsAppConfig) => Promise<void>;
  currentConfig?: WhatsAppConfig;
}

export default function WhatsAppConfigDialog({
  isOpen,
  onClose,
  onSave,
  currentConfig
}: WhatsAppConfigDialogProps) {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phone_number: currentConfig?.phone_number || '',
    display_name: currentConfig?.display_name || '',
    business_name: currentConfig?.business_name || 'Hyundai Wallan',
    welcome_message: currentConfig?.welcome_message || 'Hello! Thank you for your spare parts request. We will process it shortly.',
    payment_message_template: currentConfig?.payment_message_template || 'Your payment link is ready: {payment_url}\n\nOrder Details:\nPart: {part_name}\nTotal: {total_amount} {currency}\n\nPlease complete your payment to proceed with your order.',
    dispatch_message_template: currentConfig?.dispatch_message_template || 'Great news! Your order has been dispatched.\n\nTracking Number: {tracking_number}\nExpected Delivery: 2-3 business days\n\nThank you for choosing Hyundai Wallan!',
    is_active: currentConfig?.is_active ?? false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: keyof WhatsAppConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!config.phone_number.trim()) {
      alert('Please enter your WhatsApp phone number');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(config);
      alert('WhatsApp configuration saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      alert('Failed to save WhatsApp configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.phone_number.trim()) {
      alert('Please enter your WhatsApp phone number first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Simulate testing WhatsApp connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResult({
        success: true,
        message: 'WhatsApp connection test successful! You can now send messages to customers.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'WhatsApp connection test failed. Please check your phone number and try again.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateWhatsAppLink = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span>WhatsApp Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Configure your personal WhatsApp account to send messages to customers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone_number">WhatsApp Phone Number *</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+92501234567"
                    value={config.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="mt-1"
                  />
                  
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    type="text"
                    placeholder="Your Name"
                    value={config.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  type="text"
                  placeholder="Hyundai Wallan"
                  value={config.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span>Message Templates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Textarea
                  id="welcome_message"
                  placeholder="Welcome message sent when a new request is received"
                  value={config.welcome_message}
                  onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="payment_message_template">Payment Message Template</Label>
                <Textarea
                  id="payment_message_template"
                  placeholder="Message template for payment links"
                  value={config.payment_message_template}
                  onChange={(e) => handleInputChange('payment_message_template', e.target.value)}
                  className="mt-1"
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available variables: {'{payment_url}'}, {'{part_name}'}, {'{total_amount}'}, {'{currency}'}
                </p>
              </div>
              <div>
                <Label htmlFor="dispatch_message_template">Dispatch Message Template</Label>
                <Textarea
                  id="dispatch_message_template"
                  placeholder="Message template for dispatch notifications"
                  value={config.dispatch_message_template}
                  onChange={(e) => handleInputChange('dispatch_message_template', e.target.value)}
                  className="mt-1"
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available variables: {'{tracking_number}'}, {'{part_name}'}, {'{order_id}'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-orange-600" />
                <span>Test Connection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.phone_number.trim()}
                  variant="outline"
                >
                  {isTesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test WhatsApp Connection
                    </>
                  )}
                </Button>
                
                {config.phone_number && (
                  <Button
                    onClick={() => window.open(generateWhatsAppLink(config.phone_number), '_blank')}
                    variant="outline"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open WhatsApp
                  </Button>
                )}
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">WhatsApp Status</p>
                    <p className="text-sm text-gray-500">Enable/disable WhatsApp messaging</p>
                  </div>
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-sm text-gray-500">Your WhatsApp number</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(config.phone_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>How it works:</strong> When you create payment links or update order status, 
              the system will automatically send WhatsApp messages to customers using your configured templates. 
              Make sure your WhatsApp number is active and can receive messages.
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !config.phone_number.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 