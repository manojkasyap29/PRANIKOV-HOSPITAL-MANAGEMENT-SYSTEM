import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { appointmentsAPI, prescriptionsAPI } from '@/lib/api';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuth();

  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [pendingPrescriptions, setPendingPrescriptions] = useState(0);

  const loadData = async () => {
    try {
      const [aptRes, rxRes] = await Promise.all([appointmentsAPI.getAll(), prescriptionsAPI.getAll()]);
      const apts = aptRes.data || [];
      const today = new Date().toISOString().slice(0, 10);
      const todays = apts.filter((a: any) => a.date === today);
      setTodayAppointments(todays);

      // Count unique patients from appointments
      const uniquePatients = new Set((apts || []).map((a: any) => a.patientId));
      setPatientCount(uniquePatients.size);

      setPendingPrescriptions((rxRes.data || []).length);
    } catch (err) {
      console.error('Failed to load doctor dashboard data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome, Dr. {user?.name}!</h1>
        <p className="text-muted-foreground text-lg">
          {user?.specialization && `${user.specialization} Specialist`}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Today's Appointments</CardDescription>
            <CardTitle className="text-3xl">{todayAppointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Patients</CardDescription>
            <CardTitle className="text-3xl">{patientCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Prescriptions</CardDescription>
            <CardTitle className="text-3xl">{pendingPrescriptions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-3xl">{(todayAppointments || []).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>Your appointments for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.length === 0 && <p className="text-sm">No appointments for today.</p>}
            {todayAppointments.map((appointment: any) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{appointment.time}</span>
                  </div>
                  <div>
                    <p className="font-medium">{appointment.patientName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm" className="gradient-primary">Start Consultation</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-medium transition-smooth cursor-pointer">
          <CardHeader>
            <Users className="h-10 w-10 text-primary mb-2" />
            <CardTitle>Patient Records</CardTitle>
            <CardDescription>View and manage patient information</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/doctor/records">
              <Button variant="outline" className="w-full">Manage Health Records</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-smooth cursor-pointer">
          <CardHeader>
            <FileText className="h-10 w-10 text-secondary mb-2" />
            <CardTitle>Write Prescription</CardTitle>
            <CardDescription>Create new prescriptions for patients</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">New Prescription</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-medium transition-smooth cursor-pointer">
          <CardHeader>
            <Calendar className="h-10 w-10 text-accent mb-2" />
            <CardTitle>Manage Schedule</CardTitle>
            <CardDescription>Update your availability</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">View Schedule</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
