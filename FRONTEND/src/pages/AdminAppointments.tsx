import React, { useEffect, useMemo, useState } from 'react';
import { appointmentsAPI, doctorsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Appointment = { id: string; patientId?: string; doctorId?: string; patientName?: string; doctorName?: string; date: string; time: string; status: 'scheduled' | 'completed' | 'cancelled' };

const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const res = await appointmentsAPI.getAll();
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return appointments;
    return appointments.filter((a) => a.patientName?.toLowerCase().includes(s) || a.doctorName?.toLowerCase().includes(s) || a.status?.toLowerCase().includes(s));
  }, [appointments, q]);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await appointmentsAPI.update(id, { status });
      toast({ title: 'Appointment updated', description: `#${id} → ${status}` });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      console.error('Failed to update appointment', err);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin • Appointments</h1>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointments Control</CardTitle>
          <CardDescription>Update statuses and review schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient, doctor, or status" />
          </div>
          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm text-muted-foreground">No appointments found.</div>}
            {filtered.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{a.patientName || '—'} • {a.doctorName || '—'}</div>
                    <div className="text-sm text-muted-foreground">{new Date(a.date).toLocaleDateString()} • {a.time}</div>
                  </div>
                  <div className="text-right">
                    <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v as any)}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">scheduled</SelectItem>
                        <SelectItem value="completed">completed</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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

export default AdminAppointments;
