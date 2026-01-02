import React, { useEffect, useMemo, useState } from 'react';
import { prescriptionsAPI, doctorsAPI, patientsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Filter } from 'lucide-react';

const Prescriptions: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [form, setForm] = useState({ patientId: '', medication: '', dosage: '', frequency: '', duration: '', notes: '' });
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      const res = await prescriptionsAPI.getAll();
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll();
      setDoctors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await patientsAPI.getAll();
      setPatients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : patientId;
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : doctorId;
  };

  useEffect(() => {
    load();
    loadDoctors();
    loadPatients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await prescriptionsAPI.create({
        patientId: form.patientId,
        doctorId: user?.id,
        medication: form.medication,
        dosage: form.dosage,
        frequency: form.frequency,
        duration: form.duration,
        notes: form.notes,
      });
      setForm({ patientId: '', medication: '', dosage: '', frequency: '', duration: '', notes: '' });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return prescriptions.filter((p) =>
      `${p.medication} ${getPatientName(p.patientId)} ${getDoctorName(p.doctorId)} ${p.notes}`.toLowerCase().includes(ql)
    );
  }, [prescriptions, q, patients, doctors]);

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-soft max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Create Prescription</CardTitle>
          <CardDescription>Write a prescription for a patient</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm">Patient ID</label>
              <Input name="patientId" value={form.patientId} onChange={handleChange} placeholder="e.g., patient UUID" />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm">Medication</label>
              <Input name="medication" value={form.medication} onChange={handleChange} />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm">Dosage</label>
              <Input name="dosage" value={form.dosage} onChange={handleChange} placeholder="e.g., 500mg" />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm">Frequency</label>
              <Input name="frequency" value={form.frequency} onChange={handleChange} placeholder="e.g., twice daily" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Duration</label>
              <Input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g., 7 days" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Notes</label>
              <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional instructions or notes" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="gradient-primary">Create Prescription</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> All Prescriptions</CardTitle>
            <CardDescription>Browse and search prescriptions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 items-end mb-4">
            <div className="md:col-span-3">
              <label className="text-sm">Search</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by medication, patient, doctor" />
            </div>
            <div className="flex items-end">
              <Filter className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm">No prescriptions found.</div>}
            {filtered.map((p) => (
              <Card key={p.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        {p.medication} <Badge variant="outline">{p.dosage}</Badge>
                      </div>
                      <div className="text-sm">Patient: <span className="font-medium">{getPatientName(p.patientId)}</span></div>
                      <div className="text-sm">Doctor: <span className="font-medium">{getDoctorName(p.doctorId)}</span></div>
                      <div className="text-sm">Frequency: {p.frequency}</div>
                      <div className="text-sm">Duration: {p.duration}</div>
                      <div className="text-sm">Notes: {p.notes || '—'}</div>
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

export default Prescriptions;
