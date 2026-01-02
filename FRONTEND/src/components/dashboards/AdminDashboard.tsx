import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, DollarSign, TrendingUp, UserPlus, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminAPI, appointmentsAPI, pharmacyAPI } from '@/lib/api';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

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

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    try {
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
      console.error('Failed to load admin dashboard', err);
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

  const userGrowthSeries = useMemo(() => {
    const map = new Map<string, number>();
    windowMonths.forEach((m) => map.set(m.key, 0));
    users.forEach((u) => {
      const d = new Date(u.createdAt || u.created_at || u.createdAtDate || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return windowMonths.map((m) => ({ month: m.label, users: map.get(m.key) || 0 }));
  }, [users]);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">Platform overview and management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Users</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats ? stats.totalUsers : '—'}</CardTitle>
            <p className="text-xs text-success mt-1">{stats ? '+auto' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Appointments</CardDescription>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats ? stats.totalAppointments : '—'}</CardTitle>
            <p className="text-xs text-success mt-1">{stats ? '+auto' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Revenue</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats ? `$${stats.revenue || 0}` : '—'}</CardTitle>
            <p className="text-xs text-success mt-1">{stats ? '+auto' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active Doctors</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{stats ? stats.totalDoctors : '—'}</CardTitle>
            <p className="text-xs text-success mt-1">{stats ? '+auto' : ''}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user registrations</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ users: { label: 'Users', color: '#6366f1' } }}>
              <LineChart data={userGrowthSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Statistics</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ appointments: { label: 'Appointments', color: '#10b981' } }}>
              <LineChart data={appointmentSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="appointments" stroke="#10b981" strokeWidth={2} dot={false} />
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
          <CardContent className="h-[340px]">
            <ChartContainer config={{ orders: { label: 'Orders', color: '#10b981' }, revenue: { label: 'Revenue', color: '#f59e0b' } }}>
              <BarChart data={ordersSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="orders" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} />
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

export default AdminDashboard;
