import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { pharmacyAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const alternatives = useMemo(() => {
    if (!product) return [] as any[];
    const cat = product.category;
    return (allProducts || []).filter((p) => (p.category === cat) && ((p.prescriptionRequired ?? p.prescription_required ?? false) === false) && p.id !== product.id).slice(0, 3);
  }, [product, allProducts]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Invalid product id');
        setProduct(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await pharmacyAPI.getProductById(id);
        const data = res.data;
        if (!data || typeof data !== 'object' || !data.id) {
          throw new Error('Invalid product response');
        }
        setProduct(data);
      } catch (err: any) {
        try {
          const list = await pharmacyAPI.getProducts();
          const found = (list.data || []).find((p: any) => p.id === id);
          if (found) {
            setProduct(found);
            setError(null);
          } else {
            const msg = err?.response?.data?.message || 'Failed to load product';
            setError(msg);
            setProduct(null);
          }
        } catch (e2: any) {
          const msg = err?.response?.data?.message || 'Failed to load product';
          setError(msg);
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const res = await pharmacyAPI.getProducts();
        setAllProducts(res.data || []);
      } catch (err) {
        console.error('Failed to load products', err);
      }
    };
    loadAll();
  }, []);

  if (loading) return <div className="p-6">Loading product...</div>;
  if (error) return <div className="p-6">{error}. Go back to Pharmacy to browse products.</div>;
  if (!product) return <div className="p-6">Product not found.</div>;

  const presc = product.prescriptionRequired ?? product.prescription_required ?? false;

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{product.name}</CardTitle>
            <Badge variant={presc ? 'destructive' : 'secondary'}>{presc ? 'RX' : 'OTC'}</Badge>
          </div>
          <CardDescription>{product.category}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{product.description}</p>
          <div className="mb-4 font-semibold">Price: ₹{product.price}</div>
          <div className="mb-4 text-sm text-muted-foreground">{presc ? 'Prescription required to order this product.' : 'Available over-the-counter.'}</div>

          <div className="flex items-center gap-2">
            <Input type="number" value={qty} min={1} onChange={(e) => setQty(Math.max(1, Number(e.currentTarget.value)))} />
            <Button onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, quantity: qty, requiresPrescription: presc })} disabled={presc}>Add to cart</Button>
          </div>
        </CardContent>
      </Card>

      {alternatives.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generic alternatives</CardTitle>
            <CardDescription>OTC options in the same category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alternatives.map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">₹{p.price}</div>
                      <Button onClick={() => addItem({ productId: p.id, name: p.name, price: p.price, quantity: 1, requiresPrescription: false })}>Add</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductDetail;
