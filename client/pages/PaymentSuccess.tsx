import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Truck, Clock, Home, Receipt } from 'lucide-react';

interface PaymentDetails {
  session_id: string;
  amount: number;
  currency: string;
  customer_name: string;
  part_name: string;
  order_id: string;
  payment_status: string;
  paid_at: string;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchPaymentDetails(sessionId);
    } else {
      setError('No payment session found');
      setIsLoading(false);
    }
  }, [sessionId]);

  const fetchPaymentDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/status/${sessionId}`);
      const result = await response.json();

      if (result.success) {
        // Mock payment details for now - in production, this would come from the database
        setPaymentDetails({
          session_id: sessionId,
          amount: result.data.amount,
          currency: result.data.currency,
          customer_name: 'Customer Name', // Would come from database
          part_name: 'Hyundai Spare Part', // Would come from database
          order_id: 'REQ-' + Date.now().toString().slice(-8), // Would come from database
          payment_status: result.data.status,
          paid_at: new Date().toISOString()
        });
      } else {
        setError(result.error || 'Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      setError('Failed to fetch payment details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
            <CardDescription>
              {error || 'Unable to verify your payment. Please contact support.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your payment. Your order is now being processed.
          </p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span>Payment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{paymentDetails.order_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Session ID</p>
                <p className="font-medium font-mono text-sm">{paymentDetails.session_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="font-bold text-lg text-green-600">
                  {paymentDetails.amount.toFixed(2)} {paymentDetails.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {paymentDetails.payment_status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid At</p>
              <p className="font-medium">
                {new Date(paymentDetails.paid_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-600" />
              <span>Order Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Payment Confirmed</p>
                  <p className="text-sm text-gray-600">Your payment has been processed successfully</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Processing Order</p>
                  <p className="text-sm text-gray-600">We're preparing your spare part for dispatch</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-400">Dispatching</p>
                  <p className="text-sm text-gray-500">Your order will be dispatched within 24-48 hours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span>What Happens Next?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <p className="text-sm">You'll receive a confirmation email with your order details</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <p className="text-sm">Our team will process your order within 24 hours</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <p className="text-sm">You'll receive tracking information once your order is dispatched</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <p className="text-sm">Expected delivery: 2-3 business days</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </Link>
          
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Receipt className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>

        {/* Support Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Need help? Contact our support team at support@hyundai-wallan.com</p>
          <p className="mt-1">or call us at +966 11 123 4567</p>
        </div>
      </div>
    </div>
    );
} 