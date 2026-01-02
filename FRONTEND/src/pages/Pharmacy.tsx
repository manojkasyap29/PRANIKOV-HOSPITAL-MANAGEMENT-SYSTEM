import React, { useEffect, useMemo, useState } from 'react';
import { pharmacyAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Filter } from 'lucide-react';

const Pharmacy: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filterOTC, setFilterOTC] = useState<'all' | 'otc' | 'rx'>('all');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const { addItem } = useCart();

  const loadProducts = async () => {
    try {
      const res = await pharmacyAPI.getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };
  const loadOrders = async () => {
    try {
      const res = await pharmacyAPI.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  const handleQtyChange = (id: string, value: number) => {
    setQtys((s) => ({ ...s, [id]: Math.max(1, value) }));
  };

  const handleAdd = (p: any) => {
    const qty = qtys[p.id] || 1;
    const presc = p.prescriptionRequired ?? p.prescription_required ?? false;
    addItem({ productId: p.id, name: p.name, price: p.price, quantity: qty, requiresPrescription: presc });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p: any) => { if (p.category) set.add(p.category); });
    return ['all', ...Array.from(set.values())];
  }, [products]);

  const filtered = products.filter((p) => {
    if (query) {
      const q = query.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
    }
    const presc = p.prescriptionRequired ?? p.prescription_required ?? false;
    if (filterOTC === 'otc' && presc) return false;
    if (filterOTC === 'rx' && !presc) return false;
    if (category !== 'all' && (p.category || 'all') !== category) return false;
    return true;
  });

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'price-asc') arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'price-desc') arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    return arr;
  }, [filtered, sort]);

  const recommended = useMemo(() => {
    const catCount: Record<string, number> = {};
    const byId: Record<string, any> = {};
    products.forEach((p) => { byId[p.id] = p; });
    (orders || []).slice(-10).forEach((o: any) => {
      (o.items || []).forEach((it: any) => {
        const p = byId[it.productId];
        const cat = p?.category;
        if (cat) catCount[cat] = (catCount[cat] || 0) + it.quantity;
      });
    });
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);
    const prescSafe = (p: any) => (p.prescriptionRequired ?? p.prescription_required ?? false) === false;
    const rec = products.filter((p) => p.category && topCats.includes(p.category) && prescSafe(p));
    return rec.slice(0, 6);
  }, [orders, products]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Online Pharmacy</h1>
        <p className="text-muted-foreground">Shop medicines and healthcare products</p>
      </div>

      {recommended.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended for you</CardTitle>
            <CardDescription>Based on your recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {recommended.map((p) => (
                <Card key={p.id} className="flex flex-col overflow-hidden">
                  {p.imageUrl && (
                    <div className="w-full h-48 bg-muted overflow-hidden flex items-center justify-center">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="secondary">OTC</Badge>
                    </div>
                    <CardDescription>{p.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-sm mb-3">{p.description}</p>
                      <div className="font-semibold mb-3">₹{p.price}</div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Input type="number" value={qtys[p.id] ?? 1} min={1} onChange={(e) => handleQtyChange(p.id, Number(e.currentTarget.value))} />
                      <Button onClick={() => handleAdd(p)}>Add to Cart</Button>
                      <Button variant="outline" asChild>
                        <Link to={`/pharmacy/${p.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2 grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm">Search</label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines" />
          </div>
          <div>
            <label className="text-sm">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.filter((c) => c !== 'all').map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm">Type</label>
            <Select value={filterOTC} onValueChange={(v) => setFilterOTC(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="otc">OTC</SelectItem>
                <SelectItem value="rx">Prescription Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm">Sort</label>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {sorted.length === 0 && <div className="text-sm">No products available.</div>}
        {sorted.map((p) => {
          const presc = p.prescriptionRequired ?? p.prescription_required ?? false;
          const inStock = p.in_stock ?? true;
          return (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              {p.imageUrl && (
                <div className="w-full h-48 bg-muted overflow-hidden flex items-center justify-center">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant={presc ? 'destructive' : 'secondary'}>{presc ? 'RX' : 'OTC'}</Badge>
                </div>
                <CardDescription>{p.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm mb-3">{p.description}</p>
                  <div className="font-semibold mb-3">₹{p.price}</div>
                  {!inStock && <Badge variant="outline">Out of stock</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Input type="number" value={qtys[p.id] ?? 1} min={1} onChange={(e) => handleQtyChange(p.id, Number(e.currentTarget.value))} />
                  {presc ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button disabled variant="secondary">Requires Prescription</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Obtain a valid prescription to order this item.
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button onClick={() => handleAdd(p)}>Add to Cart</Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link to={`/pharmacy/${p.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Pharmacy;
