import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { assistantsAPI, appointmentsAPI } from '@/lib/api';
import type { Assistant, AssistantRun } from '@/types';

const Assistants: React.FC = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('Operations Assistant');
  const [description, setDescription] = useState('Helps manage appointments and orders');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<AssistantRun | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await assistantsAPI.list();
      setAssistants(res.data || []);
    } catch (err) {
      console.error('Failed to load assistants', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    try {
      const res = await assistantsAPI.create({
        name,
        description,
        skills: {
          appointments_review: true,
          orders_review: true,
          waiting_list_confirm: true,
        },
      });
      setName('');
      setDescription('');
      await load();
      setSelectedId(res.data?.id || null);
    } catch (err) {
      console.error('Failed to create assistant', err);
    }
  };

  const runTask = async (
    task: 'appointments_review' | 'orders_review' | 'waiting_list_confirm'
  ) => {
    if (!selectedId) return;
    try {
      const res = await assistantsAPI.run(selectedId, task);
      setLastRun(res.data || null);
    } catch (err) {
      console.error('Failed to run task', err);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => setActionMsg('Copied to clipboard')).catch(() => setActionMsg('Copy failed'));
  };

  const markWaitingConfirmed = async (appointmentId: number | string) => {
    try {
      await appointmentsAPI.update(String(appointmentId), { status: 'scheduled' });
      setActionMsg(`Appointment ${appointmentId} marked as scheduled`);
    } catch (e) {
      console.error(e);
      setActionMsg('Failed to update appointment');
    }
  };

  // Removed reschedule and phone verification helpers to focus on 3 tasks

  const renderTaskResult = () => {
    if (!lastRun) return null;
    const { task, result } = lastRun;

    if (task === 'appointments_review') {
      const summary = result?.summary || {};
      const byStatus: Record<string, number> = summary.byStatus || {};
      const upcoming: any[] = summary.upcoming7d || [];
      const suggestions: string[] = result?.suggestions || [];
      return (
        <div className="space-y-3">
          <div className="text-sm">Total appointments: <span className="font-semibold">{summary.total ?? 0}</span></div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byStatus).map(([k, v]) => (
              <span key={k} className="px-2 py-1 text-xs border rounded bg-muted">{k}: {v}</span>
            ))}
          </div>
          {upcoming.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-1">Upcoming (7 days)</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1 pr-2">Date</th>
                      <th className="py-1 pr-2">Time</th>
                      <th className="py-1 pr-2">Patient</th>
                      <th className="py-1 pr-2">Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="py-1 pr-2">{u.date}</td>
                        <td className="py-1 pr-2">{u.time}</td>
                        <td className="py-1 pr-2">{u.patientName}</td>
                        <td className="py-1 pr-2">{u.doctorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-1">Suggestions</div>
              <ul className="list-disc ml-5 text-sm">
                {suggestions.map((s, i) => (<li key={i}>{s}</li>))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (task === 'orders_review') {
      const summary = result?.summary || {};
      const byStatus: Record<string, number> = summary.byStatus || {};
      const delayed: any[] = summary.delayed || [];
      const pendingProcessing: any[] = summary.pendingProcessing || [];
      return (
        <div className="space-y-3">
          <div className="text-sm">Total orders: <span className="font-semibold">{summary.total ?? 0}</span></div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byStatus).map(([k, v]) => (
              <span key={k} className="px-2 py-1 text-xs border rounded bg-muted">{k}: {v}</span>
            ))}
          </div>
          {pendingProcessing.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-1">Pending & Processing</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1 pr-2">Order</th>
                      <th className="py-1 pr-2">Age (days)</th>
                      <th className="py-1 pr-2">Status</th>
                      <th className="py-1 pr-2">Total</th>
                      <th className="py-1 pr-2">Customer</th>
                      <th className="py-1 pr-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProcessing.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="py-1 pr-2">#{d.id}</td>
                        <td className="py-1 pr-2">{d.ageDays}</td>
                        <td className="py-1 pr-2">{d.status}</td>
                        <td className="py-1 pr-2">${d.total?.toFixed ? d.total.toFixed(2) : d.total}</td>
                        <td className="py-1 pr-2">{d.userName || d.userId}</td>
                        <td className="py-1 pr-2">{d.userPhone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {delayed.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-1">Delayed (older than 2 days)</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1 pr-2">Order</th>
                      <th className="py-1 pr-2">Age (days)</th>
                      <th className="py-1 pr-2">Status</th>
                      <th className="py-1 pr-2">Total</th>
                      <th className="py-1 pr-2">Customer</th>
                      <th className="py-1 pr-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayed.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="py-1 pr-2">#{d.id}</td>
                        <td className="py-1 pr-2">{d.ageDays}</td>
                        <td className="py-1 pr-2">{d.status}</td>
                        <td className="py-1 pr-2">${d.total?.toFixed ? d.total.toFixed(2) : d.total}</td>
                        <td className="py-1 pr-2">{d.userName || d.userId}</td>
                        <td className="py-1 pr-2">{d.userPhone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (task === 'waiting_list_confirm') {
      const items: any[] = result?.actions?.sendConfirmations || [];
      return (
        <div className="space-y-3">
          {items.length === 0 && <div className="text-sm text-muted-foreground">No waiting list confirmations needed.</div>}
          {items.map((it) => (
            <div key={it.appointmentId} className="p-2 border rounded">
              <div className="text-sm font-semibold">{it.patientName} • Dr. {it.doctorName}</div>
              <div className="text-xs text-muted-foreground">{it.date || 'TBD'} {it.time || ''} • {it.phone || 'No phone'}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyText(it.message)}>Copy SMS</Button>
                <Button size="sm" onClick={() => markWaitingConfirmed(it.appointmentId)}>Mark Confirmed</Button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Removed renderers for reschedule, order follow-up, and phone verification

    return <div className="text-sm text-muted-foreground">No renderer for task: {task}</div>;
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => assistants.find(a => a.id === selectedId) || null, [assistants, selectedId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assistants</h1>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Assistant</CardTitle>
            <CardDescription>Configure a helper for operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Assistant name" />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this assistant do?" />
              </div>
              <div className="flex justify-end">
                <Button onClick={create} disabled={!name.trim()}>Create</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assistants</CardTitle>
            <CardDescription>Select to run tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {assistants.length === 0 && <div className="text-sm text-muted-foreground">No assistants yet.</div>}
              {assistants.map((a) => (
                <button key={a.id} onClick={() => setSelectedId(a.id)} className={`w-full text-left p-2 border rounded ${selectedId===a.id?'bg-muted':''}`}>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.description || '—'}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Tasks</CardTitle>
            <CardDescription>{selected ? selected.name : 'Select an assistant'}</CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => runTask('appointments_review')}>Review Appointments</Button>
                  <Button onClick={() => runTask('orders_review')}>Review Orders</Button>
                  <Button onClick={() => runTask('waiting_list_confirm')}>Confirm Waiting List</Button>
                </div>
                {lastRun && (
                  <div className="p-3 border rounded">
                    <div className="text-sm text-muted-foreground">Task: {lastRun.task} • {new Date(lastRun.createdAt).toLocaleString()}</div>
                    {actionMsg && <div className="mt-2 text-xs">{actionMsg}</div>}
                    <div className="mt-2">
                      {renderTaskResult()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Pick an assistant to run tasks.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assistants;