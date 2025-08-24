import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  CreditCard,
  MessageSquare,
  Truck,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Calculator,
  Send,
  Eye,
  ArrowRight
} from "lucide-react";
import { SparePartRequest, RequestStatus } from "@shared/types";
import { API_ENDPOINTS } from "@/lib/api";
import { whatsappService } from "@/lib/whatsapp-service";

interface PaymentManagementDialogProps {
  request: SparePartRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRequest: (requestId: string, updates: Partial<SparePartRequest>) => Promise<void>;
}

interface PaymentBreakdown {
  parts_cost: number;
  freight_cost: number;
  total_cost: number;
  currency: string;
}

export default function PaymentManagementDialog({
  request,
  isOpen,
  onClose,
  onUpdateRequest,
}: PaymentManagementDialogProps) {
  const [partsCost, setPartsCost] = useState<number>(request?.parts_cost || 0);
  const [freightCost, setFreightCost] = useState<number>(request?.freight_cost || 0);
  const [notes, setNotes] = useState<string>(request?.notes || "");
  const [newStatus, setNewStatus] = useState<RequestStatus>(request?.status || "Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [whatsappMessage, setWhatsappMessage] = useState<string>("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!request) return null;

  const totalCost = partsCost + freightCost;

  const calculateBreakdown = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENTS_BREAKDOWN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parts_cost: partsCost,
          freight_cost: freightCost
        })
      });

      const result = await response.json();
      if (result.success) {
        setPaymentBreakdown(result.data);
        setShowBreakdown(true);
      }
    } catch (error) {
      console.error('Error calculating breakdown:', error);
    }
  };

  const createPaymentLink = async () => {
    if (!partsCost || !freightCost) {
      alert('Please enter both parts cost and freight cost');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use Stripe payment endpoint
      const response = await fetch(API_ENDPOINTS.STRIPE_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: request.request_id,
          customer_name: request.customer_name,
          customer_email: request.email,
          customer_phone: request.phone_number,
          part_name: request.part_name,
          parts_cost: partsCost,
          freight_cost: freightCost
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPaymentUrl(result.data.payment_url);
        setWhatsappMessage(result.data.whatsapp_message);
        setPaymentBreakdown(result.data.breakdown);
        
        // Update request with payment details
        await onUpdateRequest(request.request_id, {
          price: totalCost,
          parts_cost: partsCost,
          freight_cost: freightCost,
          payment_link: result.data.payment_url,
          status: "Payment Sent",
          notes: notes
        });

        // Send WhatsApp message if configured
        if (whatsappService.isConfigured()) {
          try {
            const whatsappResult = await whatsappService.sendPaymentMessage(
              request.phone_number,
              request.customer_name,
              request.part_name,
              result.data.payment_url,
              totalCost,
              'SAR'
            );
            
            if (whatsappResult.success) {
              // Update request to mark WhatsApp as sent
              await onUpdateRequest(request.request_id, {
                whatsapp_sent: true
              });
            }
          } catch (error) {
            console.error('Error sending WhatsApp message:', error);
          }
        }

        alert('Stripe payment link created successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      alert('Failed to create Stripe payment link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async () => {
    setIsSubmitting(true);

    try {
      await onUpdateRequest(request.request_id, {
        status: newStatus,
        notes: notes,
        parts_cost: partsCost,
        freight_cost: freightCost,
        price: totalCost
      });

      // If status is changed to "Dispatched", simulate sending dispatch notification
      if (newStatus === "Dispatched") {
        setTimeout(() => {
          sendDispatchNotification();
        }, 1000);
      }

      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendDispatchNotification = async () => {
    // Simulate sending WhatsApp dispatch notification
    const trackingNumber = `TRK${Date.now().toString().slice(-8)}`;
    console.log(`Sending dispatch notification to ${request.phone_number}`);
    console.log(`Tracking number: ${trackingNumber}`);

    await onUpdateRequest(request.request_id, {
      tracking_number: trackingNumber,
      dispatched_on: new Date().toISOString()
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Available": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "Not Available": return <XCircle className="h-4 w-4 text-red-600" />;
      case "Payment Sent": return <CreditCard className="h-4 w-4 text-purple-600" />;
      case "Paid": return <DollarSign className="h-4 w-4 text-green-600" />;
      case "Processing": return <Package className="h-4 w-4 text-orange-600" />;
      case "Dispatched": return <Truck className="h-4 w-4 text-emerald-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "Pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Available": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Not Available": return "bg-red-50 text-red-700 border-red-200";
      case "Payment Sent": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Paid": return "bg-green-50 text-green-700 border-green-200";
      case "Processing": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Dispatched": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Payment & Order Management</span>
          </DialogTitle>
          <DialogDescription>
            Manage pricing, payment links, and order status for request {request.request_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>Customer Details</span>
                <Badge variant="outline" className={getStatusColor(request.status)}>
                  {getStatusIcon(request.status)}
                  <span className="ml-1">{request.status}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="font-medium">{request.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="font-medium">{request.phone_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="font-medium">{request.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Vehicle</Label>
                  <p className="font-medium">{request.vehicle_estamra}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Part Request</Label>
                <p className="font-medium">{request.part_name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-green-600" />
                <span>Pricing & Payment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parts-cost">Parts Cost (SAR) *</Label>
                  <Input
                    id="parts-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={partsCost}
                    onChange={(e) => setPartsCost(parseFloat(e.target.value) || 0)}
                    placeholder="Enter parts cost"
                    className="text-lg font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="freight-cost">Freight Cost (SAR) *</Label>
                  <Input
                    id="freight-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={freightCost}
                    onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                    placeholder="Enter freight cost"
                    className="text-lg font-medium"
                  />
                </div>
              </div>

              {/* Total Cost Display */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Total Cost:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {(Number(totalCost) || 0).toFixed(2)} SAR
                  </span>
                </div>
                {totalCost > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Parts: {(Number(partsCost) || 0).toFixed(2)} SAR + Freight: {(Number(freightCost) || 0).toFixed(2)} SAR
                  </div>
                )}
              </div>

              {/* Payment Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={calculateBreakdown}
                  variant="outline"
                  className="flex items-center space-x-2"
                  disabled={!partsCost || !freightCost}
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview Breakdown</span>
                </Button>
                
                <Button
                  onClick={createPaymentLink}
                  disabled={isSubmitting || !partsCost || !freightCost}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  <span>Create Payment Link</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Link Section */}
          {paymentUrl && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Payment Link Generated</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-green-700 font-medium">Payment URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={paymentUrl}
                      readOnly
                      className="bg-white border-green-300 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(paymentUrl)}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(paymentUrl, '_blank')}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {whatsappMessage && (
                  <div className="space-y-2">
                    <Label className="text-green-700 font-medium">WhatsApp Message</Label>
                    <Textarea
                      value={whatsappMessage}
                      readOnly
                      rows={8}
                      className="bg-white border-green-300 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(whatsappMessage)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Copy WhatsApp Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Breakdown Preview */}
          {showBreakdown && paymentBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span>Payment Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Parts Cost:</span>
                    <span className="font-medium">{(Number(paymentBreakdown.parts_cost) || 0).toFixed(2)} {paymentBreakdown.currency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Freight Cost:</span>
                    <span className="font-medium">{(Number(paymentBreakdown.freight_cost) || 0).toFixed(2)} {paymentBreakdown.currency}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">{(Number(paymentBreakdown.total_cost) || 0).toFixed(2)} {paymentBreakdown.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                <span>Status Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as RequestStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Not Available">Not Available</SelectItem>
                    <SelectItem value="Payment Sent">Payment Sent</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Dispatched">Dispatched</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this request..."
                  rows={3}
                />
              </div>

              {/* Workflow Guidance */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Workflow:</strong> Pending → Available → Payment Sent → Paid → Processing → Dispatched
                </AlertDescription>
              </Alert>

              <Button
                onClick={updateStatus}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Update Status</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
