import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { healthRecordsAPI, adminAPI } from '@/lib/api';

type UserLite = { id: string; name: string; role: string };
type RecordItem = { id: string; patientId: string; doctorId?: string; type: string; description: string; date: string; doctorName?: string };

const DoctorRecords = () => {
  const { user } = useAuth();
  const isDoctor = (user?.role || '').toLowerCase() === 'doctor';

  const [patients, setPatients] = useState<UserLite[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('General');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const myRecords = useMemo(() => records.filter(r => r.doctorId === user?.id), [records, user?.id]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load patients (admin API returns all users, filter to patients)
      try {
        const usersRes = await adminAPI.getUsers();
        const users = (usersRes.data || []) as any[];
        setPatients(users.filter(u => (u.role || '').toLowerCase() === 'patient'));
      } catch (e) {
        // If doctor cannot access admin API, fallback to manual entry
        setPatients([]);
      }

      // Load health records
      const recRes = await healthRecordsAPI.getAll();
      setRecords(recRes.data || []);
    } catch (err: any) {
      console.error('Failed to load doctor records', err);
      setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetCreateForm = () => {
    setPatientId('');
    setType('General');
    setDescription('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleCreate = async () => {
    if (!patientId || !type || !description) return;
    try {
      await healthRecordsAPI.create({
        // Backend expects camelCase keys and derives doctor_id from JWT
        patientId: patientId,
        type,
        description,
        attachments: [],
      });
      resetCreateForm();
      await load();
    } catch (err) {
      console.error('Failed to create record', err);
    }
  };

  const startEdit = (rec: RecordItem) => {
    setEditingId(rec.id);
    setEditType(rec.type);
    setEditDescription(rec.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditType('');
    setEditDescription('');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await healthRecordsAPI.update(editingId, { type: editType, description: editDescription });
      cancelEdit();
      await load();
    } catch (err) {
      console.error('Failed to update record', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await healthRecordsAPI.delete(id);
      await load();
    } catch (err) {
      console.error('Failed to delete record', err);
    }
  };

  if (!isDoctor) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only doctors can create and manage health records.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Doctor: Manage Health & Lab Records</h1>
        <p className="text-muted-foreground">Create new records and update patient reports</p>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Record */}
        <Card>
          <CardHeader>
            <CardTitle>Create Record</CardTitle>
            <CardDescription>Assign to patient and fill report details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patients.length > 0 ? (
              <div>
                <label className="text-sm">Patient</label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <option value="" disabled>Select patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            ) : (
              <div>
                <label className="text-sm">Patient ID</label>
                <Input value={patientId} onChange={(e) => setPatientId(e.currentTarget.value)} placeholder="Enter patient ID" />
                <p className="text-xs text-muted-foreground mt-1">Type the patient identifier if list is unavailable</p>
              </div>
            )}

            <div>
              <label className="text-sm">Record Type</label>
              <Input value={type} onChange={(e) => setType(e.currentTarget.value)} placeholder="e.g., Lab Report, Diagnosis" />
            </div>

            <div>
              <label className="text-sm">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
            </div>

            <div>
              <label className="text-sm">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder="Enter record details, findings, notes" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={loading || !patientId || !type || !description}>Create Record</Button>
              <Button variant="outline" onClick={resetCreateForm} disabled={loading}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        {/* Manage Records */}
        <Card>
          <CardHeader>
            <CardTitle>Manage My Records</CardTitle>
            <CardDescription>Edit or remove records you created</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="space-y-4">
                {myRecords.length === 0 && <p className="text-sm">No records created yet.</p>}
                {myRecords.map(rec => (
                  <div key={rec.id} className="p-4 border rounded-lg space-y-2">
                    {editingId === rec.id ? (
                      <div className="space-y-2">
                        <Input value={editType} onChange={(e) => setEditType(e.currentTarget.value)} />
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.currentTarget.value)} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdate}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium">{rec.type}</div>
                          <div className="text-sm text-muted-foreground">{new Date(rec.date).toLocaleDateString()} • Patient ID: {rec.patientId}</div>
                          <div className="mt-1">{rec.description}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(rec)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(rec.id)}>Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorRecords;