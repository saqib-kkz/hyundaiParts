import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Save,
  TestTube,
  Globe
} from "lucide-react";

interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isTestMode: boolean;
  isConfigured: boolean;
}

interface StripeConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StripeConfigDialog({
  isOpen,
  onClose,
}: StripeConfigDialogProps) {
  const [config, setConfig] = useState<StripeConfig>({
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    isTestMode: true,
    isConfigured: false
  });
  
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStripeConfig();
    }
  }, [isOpen]);

  const loadStripeConfig = async () => {
    try {
      const response = await fetch('/api/stripe/config');
      const result = await response.json();
      
      if (result.success) {
        setConfig({
          publishableKey: result.data.publishableKey || '',
          secretKey: result.data.secretKey ? '••••••••••••••••' : '',
          webhookSecret: result.data.webhookSecret || '',
          isTestMode: result.data.isTestMode !== false,
          isConfigured: !!result.data.publishableKey
        });
      }
    } catch (error) {
      console.error('Error loading Stripe config:', error);
    }
  };

  const handleSave = async () => {
    if (!config.publishableKey || !config.secretKey || !config.webhookSecret) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    
    try {
      // In a real implementation, you would save this to your backend
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfig(prev => ({ ...prev, isConfigured: true }));
      alert('Stripe configuration saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving Stripe config:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.publishableKey || !config.secretKey) {
      alert('Please configure your Stripe keys first');
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Test the Stripe connection by creating a test payment session
      const response = await fetch('/api/stripe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: 'TEST-' + Date.now(),
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+966500000000',
          part_name: 'Test Spare Part',
          parts_cost: 100,
          freight_cost: 20
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({
          success: true,
          message: 'Stripe connection successful! Test payment session created.'
        });
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: ${result.error}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection failed: Network error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getKeyType = (key: string) => {
    if (key.startsWith('pk_test_')) return 'Test Publishable Key';
    if (key.startsWith('pk_live_')) return 'Live Publishable Key';
    if (key.startsWith('sk_test_')) return 'Test Secret Key';
    if (key.startsWith('sk_live_')) return 'Live Secret Key';
    return 'Unknown Key Type';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Stripe Payment Gateway Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Configure your Stripe payment gateway settings for processing customer payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>Configuration Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {config.isConfigured ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Configured</span>
                    <Badge variant="outline" className="ml-2">
                      {config.isTestMode ? 'Test Mode' : 'Live Mode'}
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">Not Configured</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stripe Keys Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stripe API Keys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publishable-key">Publishable Key *</Label>
                <Input
                  id="publishable-key"
                  value={config.publishableKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                  placeholder="pk_test_... or pk_live_..."
                  className="font-mono text-sm"
                />
                {config.publishableKey && (
                  <p className="text-xs text-gray-500">
                    {getKeyType(config.publishableKey)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key *</Label>
                <div className="relative">
                  <Input
                    id="secret-key"
                    type={showSecretKey ? "text" : "password"}
                    value={config.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="sk_test_... or sk_live_..."
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {config.secretKey && config.secretKey !== '••••••••••••••••' && (
                  <p className="text-xs text-gray-500">
                    {getKeyType(config.secretKey)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret *</Label>
                <Input
                  id="webhook-secret"
                  value={config.webhookSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  placeholder="whsec_..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Found in your Stripe Dashboard under Webhooks
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="test-mode"
                  checked={config.isTestMode}
                  onChange={(e) => setConfig(prev => ({ ...prev, isTestMode: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="test-mode">Enable Test Mode (Recommended for development)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Test your Stripe configuration by creating a test payment session
              </p>
              
              <Button
                onClick={handleTestConnection}
                disabled={isLoading || !config.publishableKey || !config.secretKey}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Testing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-4 w-4" />
                    <span>Test Stripe Connection</span>
                  </div>
                )}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure this webhook URL in your Stripe Dashboard:
              </p>
              
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm break-all">
                  {process.env.REACT_APP_BASE_URL || 'https://your-domain.com'}/api/stripe/webhook
                </code>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Go to Stripe Dashboard → Webhooks</p>
                <p>• Add endpoint with the URL above</p>
                <p>• Select events: checkout.session.completed, checkout.session.expired, payment_intent.payment_failed</p>
                <p>• Copy the webhook secret and paste it above</p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Your Stripe secret key should never be exposed to the frontend. 
              In production, these settings should be configured through environment variables on your server.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !config.publishableKey || !config.secretKey || !config.webhookSecret}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 