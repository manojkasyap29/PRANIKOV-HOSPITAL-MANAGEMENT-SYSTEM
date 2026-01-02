import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pharmacyAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type PaymentInfo = {
  orderId: string;
  amount: number;
  status: string;
  payment?: {
    upiId?: string;
    upiQRCode?: string;
    status?: string;
  };
};

const Payment: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadPayment = async () => {
    if (!orderId) {
      setError('Invalid order ID');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch payment info with QR code from backend
      const paymentRes = await pharmacyAPI.getPaymentInfo(orderId);
      const paymentInfo = paymentRes.data;
      
      setPaymentInfo({
        orderId: paymentInfo.orderId,
        amount: paymentInfo.amount,
        status: paymentInfo.status || 'pending',
        payment: paymentInfo,
      });
    } catch (err) {
      console.error('Failed to load payment info', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [orderId]);

  const confirmPayment = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      // Call new endpoint that doesn't require admin
      await (pharmacyAPI as any).confirmPayment(orderId);
      toast({ title: 'Payment confirmed', description: 'Your order is being processed' });
      navigate(`/orders/${orderId}`);
    } catch (err: any) {
      console.error('Failed to confirm payment', err);
      const message = err?.response?.data?.message || 'Failed to confirm payment';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading payment information...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!paymentInfo) return <div className="p-6">Payment information not found</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment for Order #{paymentInfo.orderId}</h1>
        <Badge variant={paymentInfo.status === 'completed' ? 'default' : 'secondary'}>
          {paymentInfo.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>💳 UPI Payment</CardTitle>
          <CardDescription>Scan the QR code with any UPI app to complete payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-blue-900">₹{paymentInfo.amount.toFixed(2)}</div>
              <div className="text-sm text-blue-700">Order ID: {paymentInfo.orderId}</div>
            </div>
          </div>

          {paymentInfo.payment?.upiQRCode ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-700 mb-2">Scan to Pay</div>
                <img
                  src={paymentInfo.payment.upiQRCode}
                  alt="UPI Payment QR Code"
                  className="w-64 h-64 border-4 border-blue-200 rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center text-sm text-gray-600 max-w-md">
                <p>1️⃣ Open any UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.)</p>
                <p>2️⃣ Tap "Send Money" or "Pay" option</p>
                <p>3️⃣ Scan this QR code</p>
                <p>4️⃣ Confirm and complete payment</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">QR code generation in progress...</p>
            </div>
          )}

          {paymentInfo.payment?.upiId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Merchant UPI ID</div>
              <div className="font-mono text-sm font-semibold">{paymentInfo.payment.upiId}</div>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Order Amount</span>
              <span className="font-semibold">₹{paymentInfo.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment Status</span>
              <Badge variant={paymentInfo.status === 'completed' ? 'default' : 'secondary'}>
                {paymentInfo.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={confirmPayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Processing...' : 'I have completed the payment'}
            </Button>
            <Button
              variant="outline"
              onClick={loadPayment}
              disabled={loading}
              className="w-full"
            >
              Refresh Payment Status
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/orders/${orderId}`)}
              className="w-full"
            >
              View Order Details
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <strong>Note:</strong> Please ensure you have scanned and completed the UPI payment before confirming. 
            Do not close this page until payment is complete.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;
