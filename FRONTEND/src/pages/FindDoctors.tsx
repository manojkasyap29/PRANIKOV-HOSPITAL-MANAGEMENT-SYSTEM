import React, { useEffect, useState } from 'react';
import { doctorsAPI } from '@/lib/api';
import { Link } from 'react-router-dom';

const FindDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await doctorsAPI.getAll();
      setDoctors(res.data || []);
    } catch (err) {
      console.error('Failed to load doctors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = doctors.filter((d) =>
    `${d.name} ${d.specialty || ''}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Find Doctors</h1>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or specialty"
          className="border p-2 rounded w-full"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="p-4 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-muted-foreground">{d.specialty}</div>
                </div>
                <div className="space-x-2">
                  <Link to={`/doctors/${d.id}`} className="btn btn-sm">
                    View
                  </Link>
                  <Link to={`/appointments/new?doctorId=${d.id}`} className="btn btn-outline btn-sm">
                    Book
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindDoctors;
