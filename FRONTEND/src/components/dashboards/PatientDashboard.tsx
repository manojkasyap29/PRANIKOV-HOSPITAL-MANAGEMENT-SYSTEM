import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, ShoppingBag, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentsAPI, prescriptionsAPI, healthRecordsAPI, pharmacyAPI } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import HealthSummaryCard from '@/pages/HealthSummaryCard';

const PatientDashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      icon: Calendar,
      title: 'Book Appointment',
      description: 'Schedule a visit with a doctor',
      path: '/appointments',
      color: 'text-primary'
    },
    {
      icon: ShoppingBag,
      title: 'Order Medicine',
      description: 'Browse pharmacy products',
      path: '/pharmacy',
      color: 'text-secondary'
    },
    {
      icon: FileText,
      title: 'View Prescriptions',
      description: 'Check your prescriptions',
      path: '/prescriptions',
      color: 'text-accent'
    },
    {
      icon: Activity,
      title: 'Health Records',
      description: 'Access medical history',
      path: '/health-records',
      color: 'text-info'
    }
  ];

  const [counts, setCounts] = useState({ appointments: 0, prescriptions: 0, records: 0, orders: 0 });
  const [recent, setRecent] = useState<Array<{ type: string; title: string; date: string; link: string }>>([]);

  const loadCounts = async () => {
    try {
      const [aptRes, rxRes, recRes, ordersRes] = await Promise.all([
        appointmentsAPI.getAll(),
        prescriptionsAPI.getAll(),
        healthRecordsAPI.getAll(),
        pharmacyAPI.getOrders()
      ]);

      setCounts({
        appointments: (aptRes.data || []).length,
        prescriptions: (rxRes.data || []).length,
        records: (recRes.data || []).length,
        orders: (ordersRes.data || []).length,
      });

      const items: Array<{ type: string; title: string; date: string; link: string }> = [];
      (aptRes.data || []).slice(-5).forEach((a: any) => {
        items.push({ type: 'Appointment', title: `With ${a.doctorName || 'Doctor'}`, date: a.date, link: '/appointments' });
      });
      (rxRes.data || []).slice(-5).forEach((p: any) => {
        items.push({ type: 'Prescription', title: `${p.medication}`, date: p.date, link: '/prescriptions' });
      });
      (recRes.data || []).slice(-5).forEach((r: any) => {
        items.push({ type: 'Record', title: `${r.type}`, date: r.date, link: '/health-records' });
      });
      (ordersRes.data || []).slice(-5).forEach((o: any) => {
        items.push({ type: 'Order', title: `Order #${o.id} • ${o.status}`, date: o.date, link: `/orders/${o.id}` });
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecent(items.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard counts', err);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground text-lg">Here's your health dashboard overview</p>
      </div>

      {/* Health Summary Card */}
      <HealthSummaryCard />

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming Appointments</CardDescription>
            <CardTitle className="text-3xl">{counts.appointments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Prescriptions</CardDescription>
            <CardTitle className="text-3xl">{counts.prescriptions}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Health Records</CardDescription>
            <CardTitle className="text-3xl">{counts.records}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Orders</CardDescription>
            <CardTitle className="text-3xl">{counts.orders}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.path}>
              <Card className="hover:shadow-medium transition-smooth cursor-pointer h-full">
                <CardHeader>
                  <action.icon className={`h-10 w-10 ${action.color} mb-2`} />
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    Go <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest healthcare interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recent.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              recent.map((r, idx) => (
                <div key={idx} className={`flex items-center justify-between ${idx < recent.length - 1 ? 'pb-4 border-b' : ''}`}>
                  <div>
                    <p className="font-medium">{r.type}: {r.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(r.date).toLocaleString()}</p>
                  </div>
                  <Button asChild variant="outline" size="sm"><a href={r.link}>View</a></Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
