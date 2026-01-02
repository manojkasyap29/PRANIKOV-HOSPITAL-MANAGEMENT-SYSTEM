import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const Cart: React.FC = () => {
  const { items, removeItem, updateQuantity, total, clear } = useCart();
  const navigate = useNavigate();
  const hasRx = items.some((i) => (i as any).requiresPrescription);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Your Cart</h1>
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p>Your cart is empty.</p>
            <Button asChild variant="default" className="mt-3"><Link to="/pharmacy">Browse Pharmacy</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((i) => (
              <Card key={i.productId}>
                <CardContent className="pt-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{i.name}</span>
                      {(i as any).requiresPrescription && <Badge variant="destructive">RX</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">₹{i.price} x {i.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} value={i.quantity} onChange={(e) => updateQuantity(i.productId, Math.max(1, Number(e.currentTarget.value)))} />
                    <Button variant="outline" onClick={() => removeItem(i.productId)}>Remove</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">Total: ₹{total().toFixed(2)}</div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={clear}>Clear</Button>
                  <Button disabled={hasRx} onClick={() => navigate('/checkout')}>{hasRx ? 'Prescription Required' : 'Proceed to Checkout'}</Button>
                </div>
              </div>
              {hasRx && (
                <div className="text-sm text-muted-foreground">
                  Prescription items detected. Upload a valid prescription or consult your doctor to proceed.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Cart;
