import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pharmacyAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Order = {
  id: string;
  date?: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress: string;
  items?: Array<{ id?: string; productId: string; productName?: string; quantity: number; price: number }>;
  payment?: {
    orderId?: string;
    amount?: number;
    currency?: string;
    status?: string;
    upiId?: string;
    upiQRCode?: string;
    stripePaymentLink?: string;
    stripeQRCode?: string;
    paypalPaymentLink?: string;
    paypalQRCode?: string;
    razorpayPaymentLink?: string;
    razorpayQRCode?: string;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
    paymentLink?: string;
  };
  paymentStatus?: 'pending' | 'completed' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};

const steps: Array<{ key: Order['status']; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refilling, setRefilling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  

  const load = async () => {
    if (!id) {
      setError('Invalid order id');
      setOrder(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyAPI.getOrderById(id);
      setOrder(res.data || null);
    } catch (err) {
      console.error('Failed to load order', err);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const currentIndex = useMemo(() => steps.findIndex((s) => s.key === order?.status), [order]);

  const openInvoice = () => {
    if (!order) return;
    const styles = `
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji; }
        .header { padding: 28px; background: linear-gradient(90deg, #111827, #6d28d9); color: white; }
        .brand { font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
        .subline { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .container { padding: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .section { margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 800; margin-bottom: 10px; color: #111827; }
        .row { display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .label { color: #374151; font-weight: 600; }
        .value { color: #111827; font-weight: 700; }
        .muted { color: #6b7280; font-size: 12px; }
        .total { font-size: 22px; font-weight: 900; color: #111827; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #dbeafe; color: #1e3a8a; font-size: 12px; font-weight: 700; }
      </style>
    `;
    const paymentText = order.payment 
      ? (order.payment.stripePaymentLink ? 'Card Payment' : 
         order.payment.upiId ? `UPI • ${order.payment.upiId}` : 
         order.payment.razorpayPaymentLink ? 'Razorpay' : 
         'Payment Method Available')
      : 'Payment Pending';
    const itemsHtml = order.items.map((it) => `<div class="row"><div>${(it.productName || it.productId)} × ${it.quantity}</div><div>$${(it.price * it.quantity).toFixed(2)}</div></div>`).join('');
    const customerName = user?.name || '';
    const customerPhone = user?.phone || '';
    const customerEmail = user?.email || '';
    const html = `
      <div class="header">
        <div class="brand">PRANIKOV UPHILL</div>
        <div class="subline">Order Invoice • #${order.id}</div>
      </div>
      <div class="container">
        <div class="grid section">
          <div>
            <div class="title">Customer</div>
            <div class="row"><div class="label">Name</div><div class="value">${customerName}</div></div>
            <div class="row"><div class="label">Phone</div><div class="value">${customerPhone || '—'}</div></div>
            <div class="row"><div class="label">Email</div><div class="value">${customerEmail || '—'}</div></div>
          </div>
          <div>
            <div class="title">Order</div>
            <div class="row"><div class="label">Status</div><div><span class="badge">${order.status}</span></div></div>
            <div class="row"><div class="label">Date</div><div class="value">${new Date(order.date).toLocaleString()}</div></div>
            <div class="row"><div class="label">Ship To</div><div class="value">${order.shippingAddress}</div></div>
            <div class="row"><div class="label">Payment</div><div class="value">${paymentText}</div></div>
          </div>
        </div>
        <div class="section">
          <div class="title">Items</div>
          ${itemsHtml}
        </div>
        <div class="section">
          <div class="row"><div class="label">Subtotal</div><div class="value">Included in total</div></div>
          <div class="row"><div class="label">Shipping</div><div class="value">Included in total</div></div>
          <div class="row"><div class="total">Total</div><div class="total">$${order.total?.toFixed?.(2) ?? order.total}</div></div>
        </div>
      </div>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(styles + html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 200);
  };

  const refillOrder = async () => {
    if (!order) return;
    try {
      setRefilling(true);
      const items = order.items.map((it) => ({ productId: it.productId, quantity: it.quantity, price: it.price }));
      const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const res = await pharmacyAPI.createOrder({ total, shippingAddress: order.shippingAddress, items });
      const newOrder = res.data;
      toast({ title: 'Refill placed', description: `Order #${newOrder.id}` });
      navigate(`/orders/${newOrder.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to place refill';
      toast({ title: 'Refill failed', description: msg, variant: 'destructive' });
    } finally {
      setRefilling(false);
    }
  };

  if (loading) return <div className="p-6">Loading order...</div>;
  if (error) return <div className="p-6">{error}</div>;
  if (!order) return <div className="p-6">Order not found.</div>;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <Badge>{order.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking</CardTitle>
          <CardDescription>Follow your order progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex-1 flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${idx <= currentIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{idx + 1}</div>
                <div className="text-xs mt-2">{s.label}</div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-full mt-2 ${idx < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>{new Date(order.date).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(order.items || []).map((it) => (
              <div key={it.productId} className="flex items-center justify-between">
                <div className="text-sm">{it.productName || it.productId} × {it.quantity}</div>
                <div className="text-sm">₹{(it.price * it.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Shipping to: {order.shippingAddress}</div>
            <div className="text-xl font-bold">Total: ₹{order.total?.toFixed?.(2) ?? order.total}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>Payment Status: <span className={order.paymentStatus === 'completed' ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{order.paymentStatus || 'pending'}</span></div>
          </div>
          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh Status'}</Button>
            <Button className="ml-2" onClick={openInvoice}>Download Invoice (PDF)</Button>
            <Button className="ml-2" onClick={refillOrder} disabled={refilling}>{refilling ? 'Refilling…' : 'Refill This Order'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
