import React, { useEffect, useMemo, useState } from 'react';
import { appointmentsAPI, doctorsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Filter } from 'lucide-react';

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', reason: '' });
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [visitType, setVisitType] = useState<'in_person' | 'tele'>('in_person');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'accepted' | 'cancelled'>('all');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAll();
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  const loadDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll();
      setDoctors(res.data || []);
    } catch (err) {
      console.error('Failed to load doctors', err);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loadSlots = async () => {
    if (!form.doctorId || !form.date) { setSlots([]); return; }
    try {
      setLoadingSlots(true);
      const res = await appointmentsAPI.getAvailability(form.doctorId, form.date);
      setSlots(res.data?.slots || []);
    } catch (err) {
      console.error('Failed to load availability', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentsAPI.create({ 
        patientId: user?.id, 
        doctorId: form.doctorId, 
        date: form.date, 
        time: form.time, 
        reason: form.reason, 
        visitType 
      });
      setForm({ doctorId: '', date: '', time: '', reason: '' });
      loadAppointments();
    } catch (err) {
      console.error('Create appointment failed', err);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [form.doctorId, form.date, visitType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await appointmentsAPI.delete(id);
      loadAppointments();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await appointmentsAPI.update(id, { status });
      loadAppointments();
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const filteredAppointments = useMemo(() => {
    const ql = q.toLowerCase();
    return appointments
      .filter((a) => `${a.doctorName} ${a.reason} ${a.status}`.toLowerCase().includes(ql))
      .filter((a) => (statusFilter === 'all' ? true : a.status === statusFilter));
  }, [appointments, q, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Create Appointment</CardTitle>
          <CardDescription>Schedule a visit with a doctor</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-sm">Doctor</label>
              <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Date</label>
              <Input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm">Type</label>
              <Select value={visitType} onValueChange={(v) => setVisitType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Visit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In‑person</SelectItem>
                  <SelectItem value="tele">Telemedicine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <label className="text-sm">Available Timeslots</label>
              {loadingSlots ? (
                <div className="text-sm">Loading timeslots…</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.length === 0 && <div className="text-sm col-span-4">Pick a doctor and date to see availability.</div>}
                  {slots.map((s) => (
                    <Button key={s.time} type="button" variant={form.time === s.time ? 'default' : 'outline'} disabled={!s.available} onClick={() => setForm({ ...form, time: s.time })}>
                      {s.time} {!s.available && '(booked)'}
                    </Button>
                  ))}
                </div>
              )}
              {!form.time && slots.some((s) => !s.available) && (
                <div className="mt-2 text-sm text-muted-foreground">If all slots are booked, submit to join the waitlist for your preferred time.</div>
              )}
            </div>
            <div className="md:col-span-4">
              <label className="text-sm">Reason</label>
              <Input name="reason" value={form.reason} onChange={handleChange} placeholder="Brief reason for visit" />
            </div>
            <div className="md:col-span-4 flex gap-2">
              <Button type="submit" className="gradient-primary" disabled={!form.doctorId || !form.date || !form.reason || !form.time}>Book Selected Slot</Button>
              <Button type="button" variant="outline" onClick={async () => {
                if (!form.doctorId || !form.date || !form.reason) return;
                await appointmentsAPI.create({ doctorId: form.doctorId, date: form.date, time: form.time || slots.find((s) => !s.available)?.time || '09:00', reason: form.reason, status: 'waitlist', visitType });
                setForm({ doctorId: '', date: '', time: '', reason: '' });
                loadAppointments();
              }}>Join Waitlist</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Your Appointments</CardTitle>
            <CardDescription>Manage and track your appointments</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 items-end mb-4">
            <div className="md:col-span-2">
              <label className="text-sm">Search</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by doctor, reason, status" />
            </div>
            <div>
              <label className="text-sm">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Filter className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.length === 0 && <div className="text-sm">No appointments found.</div>}
              {filteredAppointments.map((a) => (
                <Card key={a.id} className="border">
                  <CardContent className="pt-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> {a.date} — {a.time}
                      </div>
                      <div className="text-sm">Doctor: {a.doctorName}</div>
                      <div className="text-sm">Reason: {a.reason}</div>
                      {a.visitType && (<div className="text-sm">Type: {a.visitType === 'tele' ? 'Telemedicine' : 'In‑person'}</div>)}
                      <div className="text-sm">Status: <Badge variant="outline">{a.status}</Badge></div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {user?.role === 'doctor' && (
                        <>
                          <Button size="sm" className="gradient-primary" onClick={() => handleUpdateStatus(a.id, 'accepted')}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(a.id, 'cancelled')}>Reject</Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>Delete</Button>
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

export default Appointments;
