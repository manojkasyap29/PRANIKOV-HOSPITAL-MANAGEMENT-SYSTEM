import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Activity, CalendarDays, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsAPI, prescriptionsAPI, healthRecordsAPI } from '@/lib/api';

type Appointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  doctorName?: string;
};

type Prescription = any;

type HealthRecord = {
  id: string;
  type: string;
  description: string;
  date: string;
  doctorName?: string;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
};

export const HealthSummaryCard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [aptRes, rxRes, recRes] = await Promise.all([
          appointmentsAPI.getAll(),
          prescriptionsAPI.getAll(),
          healthRecordsAPI.getAll(),
        ]);
        setAppointments(aptRes.data || []);
        setPrescriptions(rxRes.data || []);
        setRecords(recRes.data || []);
      } catch (err) {
        console.error('Failed to load health summary', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = (appointments || [])
      .filter(a => {
        try { return new Date(a.date) >= now; } catch { return false; }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0];
  }, [appointments]);

  const recentRecord = useMemo(() => {
    const sorted = (records || [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  }, [records]);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={(user as any)?.avatar} alt={user?.name || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{user?.name || 'Your Health'}</CardTitle>
            <CardDescription>{user?.email || 'Health Overview'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading health summary…</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs uppercase">Next Appointment</span>
              </div>
              {nextAppointment ? (
                <div>
                  <div className="font-medium">{formatDate(nextAppointment.date)} • {nextAppointment.time}</div>
                  <div className="text-sm text-muted-foreground">With {nextAppointment.doctorName || 'Doctor'}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No upcoming appointments</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs uppercase">Active Prescriptions</span>
              </div>
              <div className="font-medium">{(prescriptions || []).length}</div>
              <div className="text-sm text-muted-foreground">Managed medications</div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-xs uppercase">Recent Health Record</span>
              </div>
              {recentRecord ? (
                <div>
                  <div className="font-medium">{recentRecord.type}</div>
                  <div className="text-sm text-muted-foreground">{formatDate(recentRecord.date)} • {recentRecord.doctorName || '—'}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No records available</div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline" size="sm">
            <a href="/appointments">Manage Appointments</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/prescriptions">View Prescriptions</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/health-records">Browse Records</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthSummaryCard;