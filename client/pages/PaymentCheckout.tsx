import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Package,
  Truck
} from 'lucide-react';

interface PaymentSession {
  session_id: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  part_name: string;
  order_id: string;
  parts_cost: number;
  freight_cost: number;
  expires_at: string;
}

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export default function PaymentCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchPaymentSession(sessionId);
    } else {
      setError('No payment session found');
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchPaymentSession = async (sessionId: string) => {
    try {
      // For mock sessions, create session data
      if (sessionId.startsWith('cs_mock_')) {
        setSession({
          session_id: sessionId,
          amount: 150, // Mock amount
          currency: 'SAR',
          customer_name: 'Ubaid Ur rehman',
          customer_email: 'ubaidurrehman78611@gmail.com',
          part_name: 'Front mirror',
          order_id: 'REQ-1755947420692-cngh1o8be',
          parts_cost: 100,
          freight_cost: 50,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        setIsLoading(false);
        return;
      }

      // For real Stripe sessions, fetch from API
      const response = await fetch(`/api/stripe/status/${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setSession(result.data);
      } else {
        setError(result.error || 'Failed to fetch payment session');
      }
    } catch (error) {
      console.error('Error fetching payment session:', error);
      setError('Failed to fetch payment session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    if (!formData.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!formData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!formData.cvv.match(/^\d{3,4}$/)) {
      setError('Please enter a valid CVV');
      return false;
    }
    if (!formData.cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For mock payments, always succeed
      if (session?.session_id.startsWith('cs_mock_')) {
        // Redirect to success page
        navigate(`/payment/success?session_id=${session.session_id}&mock=true`);
        return;
      }

      // For real payments, call Stripe API
      const response = await fetch('/api/stripe/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session?.session_id,
          payment_method: {
            card_number: formData.cardNumber.replace(/\s/g, ''),
            expiry_date: formData.expiryDate,
            cvv: formData.cvv,
            cardholder_name: formData.cardholderName
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        navigate(`/payment/success?session_id=${session?.session_id}`);
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>
              {error || 'Unable to load payment details. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-lg text-gray-600">
            Secure payment powered by Stripe
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Payment Information</span>
              </CardTitle>
              <CardDescription>
                Enter your card details to complete the payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.cardholderName}
                    onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Pay {session.amount.toFixed(2)} {session.currency}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Your payment is secured by SSL encryption</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-600" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-medium">{session.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-medium">{session.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Part</span>
                  <span className="font-medium">{session.part_name}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Parts Cost</span>
                  <span>{session.parts_cost.toFixed(2)} {session.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Freight Cost</span>
                  <span>{session.freight_cost.toFixed(2)} {session.currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">{session.amount.toFixed(2)} {session.currency}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Free Shipping</p>
                    <p className="text-sm text-blue-700">Your order will be delivered within 2-3 business days</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Secure Payment</p>
                    <p className="text-sm text-green-700">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 