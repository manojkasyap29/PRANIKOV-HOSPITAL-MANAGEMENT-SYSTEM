import React, { useEffect, useMemo, useState } from 'react';
import { pharmacyAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const statusVariant = (s: Order['status']) => {
  switch (s) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'shipped':
      return 'default';
    case 'delivered':
      return 'default';
    default:
      return 'secondary';
  }
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      String(o.total).includes(q) ||
      (o.items || []).some((it) => (it.productName || '').toLowerCase().includes(q))
    );
  }, [orders, search]);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Track and manage your medicine orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, item, or total" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No orders found.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((o) => (
                <Card key={o.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Order #{o.id}</span>
                          <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}</div>
                        
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
                        
                        <div className="text-sm text-muted-foreground mt-2">
                          Payment: <Badge variant={o.paymentStatus === 'completed' ? 'default' : 'secondary'}>{o.paymentStatus || 'pending'}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{o.total?.toFixed?.(2) ?? o.total}</div>
                        <div className="text-sm text-muted-foreground mt-1">{o.items?.length || 0} items</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button variant="ghost" onClick={() => navigate(`/orders/${o.id}`)}>View</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
