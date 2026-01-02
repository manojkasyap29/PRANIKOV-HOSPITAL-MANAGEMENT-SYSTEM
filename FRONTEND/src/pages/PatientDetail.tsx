import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { prescriptionsAPI, patientsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PatientDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ medication: '', dosage: '', frequency: '', duration: '', notes: '' });

  useEffect(() => {
    const loadPatient = async () => {
      try {
        if (id) {
          const res = await patientsAPI.getById(id);
          setPatient(res.data);
        }
      } catch (err) {
        console.error('Failed to load patient', err);
        setPatient({ id });
      } finally {
        setLoading(false);
      }
    };
    
    loadPatient();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await prescriptionsAPI.create({
        patientId: id,
        medication: form.medication,
        dosage: form.dosage,
        frequency: form.frequency,
        duration: form.duration,
        notes: form.notes,
      });
      alert('Prescription sent');
      setForm({ medication: '', dosage: '', frequency: '', duration: '', notes: '' });
    } catch (err) {
      console.error('Failed to create prescription', err);
      alert('Failed to send prescription');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Patient Details</h1>
      
      {loading ? (
        <p>Loading patient information...</p>
      ) : (
        <>
          <div className="bg-gray-50 p-4 rounded mb-6">
            <p className="mb-2"><strong>Name:</strong> {patient?.name || 'N/A'}</p>
            <p className="mb-2"><strong>Email:</strong> {patient?.email || 'N/A'}</p>
            <p className="mb-2"><strong>Phone:</strong> {patient?.phone || 'N/A'}</p>
            <p className="mb-2"><strong>Date of Birth:</strong> {patient?.dateOfBirth || 'N/A'}</p>
            <p><strong>Address:</strong> {patient?.address || 'N/A'}</p>
          </div>

          {user?.role === 'doctor' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Create Prescription</h2>
              <form onSubmit={handlePrescribe} className="grid gap-2">
                <label>
                  Medication
                  <input name="medication" value={form.medication} onChange={handleChange} className="w-full" />
                </label>
                <label>
                  Dosage
                  <input name="dosage" value={form.dosage} onChange={handleChange} className="w-full" />
                </label>
                <label>
                  Frequency
                  <input name="frequency" value={form.frequency} onChange={handleChange} className="w-full" />
                </label>
                <label>
                  Duration
                  <input name="duration" value={form.duration} onChange={handleChange} className="w-full" />
                </label>
                <label>
                  Notes
                  <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full" />
                </label>
                <button className="btn btn-primary" type="submit">Send Prescription</button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientDetail;
