import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, Home, RefreshCw, MessageSquare, Phone } from 'lucide-react';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-lg text-gray-600">
            Your payment was not completed. Don't worry, you can try again anytime.
          </p>
        </div>

        {/* Session Info Card */}
        {sessionId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Payment Session</CardTitle>
              <CardDescription>
                Session ID: {sessionId}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* What Happened Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              <span>What Happened?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm">You cancelled the payment process before completion</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm">No charges were made to your account</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
              <p className="text-sm">Your order is still pending and can be paid for later</p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What Can You Do Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium mb-1">Try Again</h3>
                <p className="text-sm text-gray-600">Complete your payment with the same link</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-medium mb-1">Contact Support</h3>
                <p className="text-sm text-gray-600">Get help with your payment or order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>
              Our support team is here to help you complete your order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">WhatsApp Support</p>
                <p className="text-sm text-gray-600">+966 50 123 4567</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-gray-600">+966 11 123 4567</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-gray-600">support@hyundai-wallan.com</p>
              </div>
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
          
          <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Payment Again
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Your order details are safe and can be accessed anytime</p>
          <p className="mt-1">No charges were made to your account</p>
        </div>
      </div>
    </div>
  );
} 