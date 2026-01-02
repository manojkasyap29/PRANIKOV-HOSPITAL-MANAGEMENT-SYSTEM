import React, { useEffect, useMemo, useState } from 'react';
import { healthRecordsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const HealthRecords: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return records
      .filter((r) => (typeFilter === 'all' ? true : r.type === typeFilter))
      .filter((r) => `${r.type} ${r.description} ${r.doctorName}`.toLowerCase().includes(ql))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, q, typeFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await healthRecordsAPI.getAll();
      setRecords(res.data || []);
    } catch (err) {
      console.error('Failed to load health records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCSV = () => {
    const rows = filtered.map((r) => ({
      id: r.id,
      date: new Date(r.date).toISOString(),
      type: r.type,
      doctorName: r.doctorName || '',
      description: r.description || '',
    }));
    const header = 'id,date,type,doctorName,description';
    const csv = [header, ...rows.map((r) => `${r.id},${r.date},${r.type},${r.doctorName.replace(/,/g,';')},${(r.description||'').replace(/,/g,';')}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health-records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Health Records</h1>
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>Export CSV</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter your records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-sm">Search</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search type, description, doctor" />
            </div>
            <div>
              <label className="text-sm">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 && <p>No health records available.</p>}
          {filtered.map((r) => (
            <div key={r.id} className="p-4 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.type}</div>
                  <div className="text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString()}</div>
                </div>
                <div className="text-sm">By: {r.doctorName || '—'}</div>
              </div>
              <div className="mt-2">{r.description}</div>
              {r.attachments && r.attachments.length > 0 && (
                <div className="mt-2 text-sm">
                  Attachments: {r.attachments.length}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthRecords;
