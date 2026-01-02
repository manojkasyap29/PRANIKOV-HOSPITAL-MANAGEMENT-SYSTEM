import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

const AdminSettings: React.FC = () => {
  const { toast } = useToast();
  const { theme, toggle } = useTheme();
  const [profile, setProfile] = useState<any>({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [analyticsWindow, setAnalyticsWindow] = useState<string>('30d');
  const [notifications, setNotifications] = useState<boolean>(true);

  const load = async () => {
    try {
      const res = await authAPI.getProfile();
      setProfile(res.data || {});
      const wnd = localStorage.getItem('admin.analytics.window') || '30d';
      const notif = localStorage.getItem('admin.notifications') || 'true';
      setAnalyticsWindow(wnd);
      setNotifications(notif === 'true');
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await authAPI.updateProfile({ name: profile.name, phone: profile.phone, address: profile.address });
      toast({ title: 'Profile updated' });
    } catch (err) {
      console.error('Failed to save profile', err);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = () => {
    localStorage.setItem('admin.analytics.window', analyticsWindow);
    localStorage.setItem('admin.notifications', notifications ? 'true' : 'false');
    toast({ title: 'Preferences saved' });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin • Settings</h1>
        <Button variant="outline" onClick={load}>Reload</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Admin contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm">Name</label>
              <Input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Phone</label>
              <Input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm">Address</label>
              <Input value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Theme and analytics options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm">Theme</label>
              <div className="flex items-center gap-3 p-2 border rounded">
                <span className="text-sm">Dark Mode</span>
                <Switch checked={theme === 'dark'} onCheckedChange={() => toggle()} />
              </div>
            </div>
            <div>
              <label className="text-sm">Analytics Window</label>
              <Select value={analyticsWindow} onValueChange={setAnalyticsWindow}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Notifications</label>
              <div className="flex items-center gap-3 p-2 border rounded">
                <span className="text-sm">Enable</span>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={savePreferences}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;