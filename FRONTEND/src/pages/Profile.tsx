import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { authAPI, phoneAPI } from '@/lib/api';
import { Camera, Save, X, ShieldCheck, ShieldAlert, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HealthSummaryCard from '@/pages/HealthSummaryCard';

const Profile: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: (user as any)?.address || '',
    email: user?.email || '',
    dateOfBirth: (user as any)?.dateOfBirth || '',
    specialization: (user as any)?.specialization || '',
    license: (user as any)?.license || '',
    avatarUrl: (user as any)?.avatarUrl || '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState<boolean>((user as any)?.phoneVerified || false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await authAPI.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        dateOfBirth: form.dateOfBirth,
        ...(user?.role === 'doctor' && {
          specialization: form.specialization,
          license: form.license, 
          avatarUrl: form.avatarUrl,
        }),
      });
      setEditing(false);
      if (refreshProfile) await refreshProfile();
      toast({ title: 'Profile Updated', description: 'Your changes have been saved' });
      try {
        const st = await phoneAPI.status();
        setPhoneVerified(!!st.data?.verified);
      } catch {}
    } catch (e) {
      console.error(e);
      toast({ title: 'Update Failed', description: 'Could not save changes', variant: 'destructive' });
    }
  };

  const sendOtp = async () => {
    try {
      const digits = (form.phone || '').replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        toast({ title: 'Invalid phone', description: 'Enter a valid number (10–15 digits)', variant: 'destructive' });
        return;
      }
      const res = await phoneAPI.sendOTP(form.phone);
      setOtpSent(true);
      const devOtp = res?.data?.devOtp;
      if (devOtp) {
        setOtpCode(devOtp);
        toast({ title: 'OTP sent (dev)', description: `Code: ${devOtp}` });
      } else {
        toast({ title: 'OTP sent', description: 'Enter the 6-digit code received' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send OTP';
      toast({ title: 'Failed', description: msg, variant: 'destructive' });
    }
  };

  const verifyOtp = async () => {
    try {
      await phoneAPI.verifyOTP(otpCode);
      setPhoneVerified(true);
      setOtpSent(false);
      setOtpCode('');
      toast({ title: 'Phone verified' });
      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Incorrect OTP';
      toast({ title: 'Verification failed', description: msg, variant: 'destructive' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      await authAPI.uploadAvatar(file, (p) => setUploadProgress(p));
      if (refreshProfile) await refreshProfile();
      toast({ title: 'Avatar Updated', description: 'Your profile picture has been changed' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Upload Failed', description: 'Could not upload avatar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14">
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user?.name || 'Profile'} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  )}
                </Avatar>
                <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Camera className="h-4 w-4" />
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                {uploading ? (
                  <div className="absolute -bottom-6 left-0 right-0">
                    <div className="h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-center">Uploading {uploadProgress}%</div>
                  </div>
                ) : null}
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)}>Edit</Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!editing ? (
              <div className="space-y-2">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-sm">Email: {user?.email}</p>
                <div className="text-sm flex items-center gap-2">Phone: {user?.phone || '-'} {phoneVerified ? (<Badge className="bg-green-100 text-green-700"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>) : (<Badge className="bg-yellow-100 text-yellow-700"><ShieldAlert className="h-3 w-3 mr-1" />Unverified</Badge>)}
                </div>
                <p className="text-sm">Address: {(user as any)?.address || '-'}</p>
                <p className="text-sm">Date of Birth: {(user as any)?.dateOfBirth || '-'}</p>
                <p className="text-sm">Role: {user?.role}</p>
                {user?.role === 'doctor' ? (
                  <>
                    <p className="text-sm">Specialization: {(user as any)?.specialization || '-'}</p>
                    <p className="text-sm">License: {(user as any)?.license || '-'}</p>
                  </>
                ) : null}
                {user && (user as any).bloodgroup && (
                  <p className="text-sm">Blood Group: {(user as any).bloodgroup}</p>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input name="name" value={form.name} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <div className="flex gap-2">
                    <Input name="phone" value={form.phone} onChange={handleChange} />
                    <Button type="button" variant="outline" onClick={sendOtp} disabled={!form.phone}><Send className="h-4 w-4 mr-1" />Send OTP</Button>
                  </div>
                  {otpSent && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} placeholder="Enter 6-digit OTP" maxLength={6} />
                      <Button type="button" onClick={verifyOtp} disabled={otpCode.length !== 6}>Verify</Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Textarea name="address" value={form.address} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                </div>
                {user?.role === 'doctor' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Specialization</label>
                      <Input name="specialization" value={form.specialization} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">License</label>
                      <Input name="license" value={form.license} onChange={handleChange} />
                    </div>
                  </>
                ) : null}
                <div>
                  <label className="text-sm font-medium">Email (readonly)</label>
                  <Input name="email" value={user?.email} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6">
        <HealthSummaryCard />
      </div>
    </div>
  );
};

export default Profile;
