import React, { useEffect, useState } from 'react';
import { patientsAPI } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Patients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const navigate = useNavigate();

  const loadPatients = async () => {
    try {
      if (user?.id) {
        const res = await patientsAPI.getByDoctor(user.id);
        setPatients(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'doctor') loadPatients();
    else navigate('/dashboard');
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patients</h1>
      <p className="mb-4">Patients you have appointments with. Click a patient to view details and prescribe.</p>

      <ul className="space-y-3">
        {patients.length === 0 && <li>No patients found.</li>}
        {patients.map((p) => (
          <li key={p.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{p.name || p.id}</div>
              <div className="text-sm text-muted-foreground">ID: {p.id}</div>
            </div>
            <div className="flex gap-2">
              <Link to={`/patients/${p.id}`} className="btn btn-ghost">View</Link>
              <button onClick={() => navigate(`/patients/${p.id}`)} className="btn btn-primary">Prescribe</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Patients;
