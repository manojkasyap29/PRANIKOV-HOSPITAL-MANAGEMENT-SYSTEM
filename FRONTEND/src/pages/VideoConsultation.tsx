import React, { useEffect, useState } from 'react';
import { doctorsAPI } from '@/lib/api';

const VideoConsultation: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);

  const loadDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll();
      setDoctors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const startCall = (doctorId: string) => {
    // Placeholder: in a future iteration this will create a room and start WebRTC.
    alert(`Starting video call with doctor ${doctorId} (placeholder)`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Video Consultation</h1>
      <p className="mb-4">Select an available doctor to start a video consultation (prototype).</p>

      <ul className="space-y-3">
        {doctors.length === 0 && <li>No doctors found.</li>}
        {doctors.map((d) => (
          <li key={d.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{d.name}</div>
              <div className="text-sm">{d.specialization}</div>
            </div>
            <div>
              <button onClick={() => startCall(d.id)} className="btn btn-primary">Start Video</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VideoConsultation;
