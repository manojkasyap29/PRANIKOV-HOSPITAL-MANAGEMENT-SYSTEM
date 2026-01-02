import React, { useEffect, useMemo, useState } from 'react';
import { pharmacyAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type Order = {
  id: string;
  date?: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress?: string;
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

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await pharmacyAPI.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => o.id.toLowerCase().includes(s) || (o.items || []).some((it) => (it.productName || '').toLowerCase().includes(s)) || o.status.toLowerCase().includes(s));
  }, [orders, q]);

  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      await pharmacyAPI.updateOrderStatus(id, status);
      toast({ title: 'Order updated', description: `Order #${id} → ${status}` });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      console.error('Failed to update status', err);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin • Orders</h1>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders Control</CardTitle>
          <CardDescription>Update status, search, and inspect details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, item, or status" />
          </div>
          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm text-muted-foreground">No orders found.</div>}
            {filtered.map((o) => (
              <Card key={o.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        <span>Order #{o.id}</span>
                        <Badge>{o.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Ship to: {o.shippingAddress || 'N/A'}</div>
                      
                      {/* Display order items */}
                      {(o.items && o.items.length > 0) && (
                        <div className="mt-2 pl-2 border-l-2 border-muted">
                          <div className="text-xs font-semibold text-muted-foreground mb-1">Items:</div>
                          {o.items.map((it) => (
                            <div key={it.id || it.productId} className="text-xs text-muted-foreground">
                              {it.productName || it.productId} × {it.quantity}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        Payment Status: <Badge variant={o.paymentStatus === 'completed' ? 'default' : 'secondary'}>{o.paymentStatus || 'pending'}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold mb-2">₹{o.total?.toFixed?.(2) ?? o.total}</div>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as any)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">pending</SelectItem>
                          <SelectItem value="processing">processing</SelectItem>
                          <SelectItem value="shipped">shipped</SelectItem>
                          <SelectItem value="delivered">delivered</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/orders/${o.id}`)}>View Tracking</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
