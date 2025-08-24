import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Package,
  Truck,
  Eye,
  EyeOff
} from 'lucide-react';

interface CheckoutSession {
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
  email: string;
  billingAddress: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function StripeCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCvv, setShowCvv] = useState(false);
  const [formData, setFormData] = useState<PaymentForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    billingAddress: '',
    city: '',
    postalCode: '',
    country: 'Saudi Arabia'
  });

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchCheckoutSession(sessionId);
    } else {
      setError('No checkout session found');
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchCheckoutSession = async (sessionId: string) => {
    try {
      // For mock sessions, create session data
      if (sessionId.startsWith('cs_mock_')) {
        setSession({
          session_id: sessionId,
          amount: 150,
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
        setError(result.error || 'Failed to fetch checkout session');
      }
    } catch (error) {
      console.error('Error fetching checkout session:', error);
      setError('Failed to fetch checkout session');
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
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
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
      await new Promise(resolve => setTimeout(resolve, 3000));

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Checkout Error</h2>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to load checkout session. Please try again.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Stripe Checkout</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  {/* Card Number */}
                  <div>
                    <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                      Card number
                    </Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 1234 1234 1234"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="mt-1 font-mono text-lg"
                    />
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                        Expiry date
                      </Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                        CVC
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="cvv"
                          type={showCvv ? "text" : "password"}
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                          maxLength={4}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCvv(!showCvv)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <Label htmlFor="cardholderName" className="text-sm font-medium text-gray-700">
                      Name on card
                    </Label>
                    <Input
                      id="cardholderName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Billing Address */}
                  <div>
                    <Label htmlFor="billingAddress" className="text-sm font-medium text-gray-700">
                      Billing address
                    </Label>
                    <Input
                      id="billingAddress"
                      type="text"
                      placeholder="123 Main St"
                      value={formData.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        City
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Riyadh"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                        Postal code
                      </Label>
                      <Input
                        id="postalCode"
                        type="text"
                        placeholder="12345"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                `Pay ${session.amount.toFixed(2)} ${session.currency}`
              )}
            </Button>

            <div className="mt-4 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Your payment is secured by SSL encryption</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{session.part_name}</p>
                      <p className="text-sm text-gray-500">Order #{session.order_id}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Parts cost</span>
                      <span>{session.parts_cost.toFixed(2)} {session.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span>{session.freight_cost.toFixed(2)} {session.currency}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-lg">{session.amount.toFixed(2)} {session.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Free shipping included</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 