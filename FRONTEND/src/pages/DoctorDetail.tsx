import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doctorsAPI } from '@/lib/api';

const DoctorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await doctorsAPI.getById(id);
      setDoctor(res.data);
    } catch (err) {
      console.error('Failed to load doctor', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!doctor) return <div className="p-6">Doctor not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{doctor.name}</h1>
      <div className="text-sm text-muted-foreground mb-4">{doctor.specialty}</div>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <div className="font-semibold">About</div>
          <div className="mt-2">{doctor.bio || 'No bio available.'}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="font-semibold">Book Appointment</div>
          <div className="mt-2">
            <a href={`/appointments/new?doctorId=${doctor.id}`} className="btn">
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
