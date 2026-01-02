import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '@/lib/api';
import type { UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type User = { id: string; name: string; email: string; role: UserRole; phone?: string };

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s));
  }, [users, q]);

  const updateRole = async (id: string, role: User['role']) => {
    try {
      await adminAPI.updateUser(id, { role });
      toast({ title: 'Role updated', description: `User ${id} set to ${role}` });
      load();
    } catch (err) {
      console.error('Failed to update role', err);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    try {
      await adminAPI.deleteUser(id);
      toast({ title: 'User deleted', description: `Removed ${id}` });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user', err);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin • Users</h1>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Search, update roles, and remove users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, or role" />
          </div>
          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm text-muted-foreground">No users found.</div>}
            {filtered.map((u) => (
              <Card key={u.id}>
                <CardContent className="pt-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{u.name} <span className="text-sm text-muted-foreground">({u.email})</span></div>
                    <div className="text-sm text-muted-foreground">Role: {u.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={u.role} onValueChange={(v) => updateRole(u.id, v as any)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">patient</SelectItem>
                        <SelectItem value="doctor">doctor</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="destructive" onClick={() => remove(u.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;