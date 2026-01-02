import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { adminAPI, appointmentsAPI, pharmacyAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

type Stat = { totalUsers: number; totalPatients: number; totalDoctors: number; totalAppointments: number; totalOrders: number };

const months = (n: number) => {
  const arr: { key: string; label: string; date: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString(undefined, { month: 'short' });
    arr.push({ key, label, date: d });
  }
  return arr;
};

const AdminAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stat | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [s, a, o, u] = await Promise.all([
        adminAPI.getStats(),
        appointmentsAPI.getAll(),
        pharmacyAPI.getOrders(),
        adminAPI.getUsers(),
      ]);
      setStats(s.data || null);
      setAppointments(a.data || []);
      setOrders(o.data || []);
      setUsers(u.data || []);
    } catch (err) {
      console.error('Failed to load analytics', err);
      toast({ title: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const windowMonths = months(6);

  const appointmentSeries = useMemo(() => {
    const map = new Map<string, number>();
    windowMonths.forEach((m) => map.set(m.key, 0));
    appointments.forEach((apt) => {
      const d = new Date(apt.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return windowMonths.map((m) => ({ month: m.label, appointments: map.get(m.key) || 0 }));
  }, [appointments]);

  const ordersSeries = useMemo(() => {
    const countMap = new Map<string, number>();
    const revenueMap = new Map<string, number>();
    windowMonths.forEach((m) => { countMap.set(m.key, 0); revenueMap.set(m.key, 0); });
    orders.forEach((o) => {
      const d = new Date(o.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (countMap.has(key)) {
        countMap.set(key, (countMap.get(key) || 0) + 1);
        revenueMap.set(key, (revenueMap.get(key) || 0) + (o.total || 0));
      }
    });
    return windowMonths.map((m) => ({ month: m.label, orders: countMap.get(m.key) || 0, revenue: Math.round((revenueMap.get(m.key) || 0) * 100) / 100 }));
  }, [orders]);

  const rolePieData = useMemo(() => {
    const roles = { patient: 0, doctor: 0, admin: 0 } as Record<string, number>;
    users.forEach((u) => { roles[u.role] = (roles[u.role] || 0) + 1; });
    return [
      { name: 'Patients', value: roles.patient },
      { name: 'Doctors', value: roles.doctor },
      { name: 'Admins', value: roles.admin },
    ];
  }, [users]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin • Analytics</h1>
        <button className="px-3 py-2 border rounded" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardDescription>Total Users</CardDescription></CardHeader>
          <CardContent><CardTitle className="text-3xl">{stats ? stats.totalUsers : '—'}</CardTitle></CardContent>
        </Card>
        <Card>
          <CardHeader><CardDescription>Total Doctors</CardDescription></CardHeader>
          <CardContent><CardTitle className="text-3xl">{stats ? stats.totalDoctors : '—'}</CardTitle></CardContent>
        </Card>
        <Card>
          <CardHeader><CardDescription>Total Appointments</CardDescription></CardHeader>
          <CardContent><CardTitle className="text-3xl">{stats ? stats.totalAppointments : '—'}</CardTitle></CardContent>
        </Card>
        <Card>
          <CardHeader><CardDescription>Total Orders</CardDescription></CardHeader>
          <CardContent><CardTitle className="text-3xl">{stats ? stats.totalOrders : '—'}</CardTitle></CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Distribution of users</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ChartContainer config={{ patients: { label: 'Patients', color: '#6366f1' }, doctors: { label: 'Doctors', color: '#10b981' }, admins: { label: 'Admins', color: '#f59e0b' } }}>
              <PieChart>
                <Pie data={rolePieData} dataKey="value" nameKey="name" outerRadius={100}>
                  {rolePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#6366f1", "#10b981", "#f59e0b"][index]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ChartContainer config={{ appointments: { label: 'Appointments', color: '#6366f1' } }}>
              <LineChart data={appointmentSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="appointments" stroke="#6366f1" strokeWidth={2} dot={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders and Revenue</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ChartContainer config={{ orders: { label: 'Orders', color: '#10b981' }, revenue: { label: 'Revenue', color: '#f59e0b' } }}>
              <BarChart data={ordersSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
