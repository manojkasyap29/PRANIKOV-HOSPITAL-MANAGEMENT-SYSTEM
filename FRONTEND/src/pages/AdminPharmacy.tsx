import React, { useEffect, useMemo, useState } from 'react';
import { pharmacyAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

type Product = { id: string; name: string; description: string; price: number; category: string; inStock: boolean; prescriptionRequired: boolean };

const AdminPharmacy: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inStock: true,
    prescriptionRequired: false,
  });
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const res = await pharmacyAPI.getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const defaultCategories = ['Pain Relief', 'Cold & Flu', 'Digestive', 'Vitamins', 'Skin Care', 'First Aid'];
    const productCats = Array.from(new Set(products.map((p) => p.category).filter(c => c && c !== 'all')));
    const allCats = Array.from(new Set([...defaultCategories, ...productCats]));
    return ['all', ...allCats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => (category === 'all' || p.category === category) && (!s || p.name.toLowerCase().includes(s)));
  }, [products, q, category]);

  const updateProduct = async (id: string, patch: Partial<Product>) => {
    try {
      await pharmacyAPI.updateProduct(id, patch);
      toast({ title: 'Product updated' });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    } catch (err) {
      console.error('Failed to update product', err);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.category) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      console.log('Validation failed:', newProduct);
      return;
    }

    try {
      const payload = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        category: newProduct.category,
        inStock: newProduct.inStock,
        prescriptionRequired: newProduct.prescriptionRequired,
      };
      
      console.log('Creating product with payload:', payload);
      await pharmacyAPI.createProduct(payload);
      
      toast({ title: 'Product added successfully' });
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        inStock: true,
        prescriptionRequired: false,
      });
      setShowAddForm(false);
      load();
    } catch (err: any) {
      console.error('Failed to add product', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add product';
      toast({ title: errorMsg, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin • Pharmacy</h1>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products Control</CardTitle>
          <CardDescription>Manage stock and pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-2"
            >
              <Plus size={20} />
              Add Product
            </Button>
          </div>

          {showAddForm && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Product Name</label>
                    <Input 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="E.g., Aspirin 500mg"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Product description..."
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c !== 'all').map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">In Stock</label>
                      <Select value={String(newProduct.inStock)} onValueChange={(v) => setNewProduct({...newProduct, inStock: v === 'true'})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Prescription Required</label>
                      <Select value={String(newProduct.prescriptionRequired)} onValueChange={(v) => setNewProduct({...newProduct, prescriptionRequired: v === 'true'})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewProduct({
                          name: '',
                          description: '',
                          price: '',
                          category: '',
                          inStock: true,
                          prescriptionRequired: false,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Product</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4 items-end mb-4">
            <div className="md:col-span-2">
              <label className="text-sm">Search</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" />
            </div>
            <div>
              <label className="text-sm">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm text-muted-foreground">No products found.</div>}
            {filtered.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.category} • {p.prescriptionRequired ? 'RX' : 'OTC'}</div>
                      <div className="text-sm text-muted-foreground">{p.description}</div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm">Price</div>
                      <Input type="number" value={p.price} onChange={(e) => updateProduct(p.id, { price: Number(e.currentTarget.value) })} />
                      <div className="text-sm">In Stock</div>
                      <Select value={String(p.inStock)} onValueChange={(v) => updateProduct(p.id, { inStock: v === 'true' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
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

export default AdminPharmacy;