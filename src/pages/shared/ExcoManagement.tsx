import { useEffect, useState, type FormEvent } from 'react';
import { inviteOfficer } from '../../services/officerService';
import {
  getCurrentAdministration, listAllAdministrations, listDirectorates,
  listOfficers, listPositions,
} from '../../services/administrationService';
import { Badge, Button, Card, Field, PageHeader, inputClass, statusTone } from '../../components/ui';
import type { Administration, Directorate, OfficerRecord, Position } from '../../types/models';

const EMPTY = {
  administration_id: '', position_id: '', directorate_id: '',
  full_name: '', display_name: '', email: '', phone: '',
  biography: '', start_date: '',
};

export default function ExcoManagement() {
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [directorates, setDirectorates] = useState<Directorate[]>([]);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [admins, pos, dirs] = await Promise.all([
        listAllAdministrations(), listPositions(), listDirectorates(),
      ]);
      setAdministrations(admins); setPositions(pos); setDirectorates(dirs);
      const current = admins.find((a) => a.status === 'current') ?? admins[0];
      if (current) {
        setForm((f) => ({ ...f, administration_id: current.id }));
        setOfficers(await listOfficers(current.id));
      }
    })();
  }, []);

  async function onAdministrationChange(id: string) {
    setForm((f) => ({ ...f, administration_id: id }));
    setOfficers(await listOfficers(id));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setInviteResult(null);
    try {
      const result = await inviteOfficer({
        administration_id: form.administration_id,
        position_id: form.position_id,
        directorate_id: form.directorate_id || null,
        full_name: form.full_name.trim(),
        display_name: form.display_name.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        biography: form.biography.trim() || undefined,
        start_date: form.start_date || undefined,
      });
      setInviteResult(result.invited
        ? `${form.full_name.trim()} was invited by email and given EXCO access. Action recorded in the audit log.`
        : result.temp_password
          ? `Account created for ${form.full_name.trim()}. Temporary password (shown once): ${result.temp_password}`
          : `${form.full_name.trim()} already had an account — a new administration assignment was created, preserving their officer history.`);
      setForm((f) => ({ ...EMPTY, administration_id: f.administration_id }));
      setOfficers(await listOfficers(form.administration_id));
    } catch (err: any) {
      setError(err.message ?? 'Failed to add officer');
    } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="EXCO Management" subtitle="Add officers to an administration. Each assignment is preserved permanently in the officer's history." />

      {error && <p className="form-err">{error}</p>}
      {inviteResult && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{inviteResult}</p>}

      <Card className="mb-8 p-6">
        <h2 className="serif mb-4 font-bold">Add EXCO officer</h2>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Administration">
            <select className={inputClass} value={form.administration_id} required
              onChange={(e) => onAdministrationChange(e.target.value)}>
              <option value="">Select…</option>
              {administrations.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
              ))}
            </select>
          </Field>
          <Field label="Position">
            <select className={inputClass} value={form.position_id} required
              onChange={(e) => setForm({ ...form, position_id: e.target.value })}>
              <option value="">Select…</option>
              {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <Field label="Directorate (optional)">
            <select className={inputClass} value={form.directorate_id}
              onChange={(e) => setForm({ ...form, directorate_id: e.target.value })}>
              <option value="">None</option>
              {directorates.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Full name">
            <input className={inputClass} value={form.full_name} required
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email} required
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone (optional)">
            <input className={inputClass} value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Start date (optional)">
            <input type="date" className={inputClass} value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Biography (optional)">
              <textarea className={inputClass} rows={2} value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy || !form.administration_id || !form.position_id}>
              {busy ? 'Adding…' : 'Add officer & invite'}
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="serif mb-3 font-bold">Officers on record</h2>
      <Card className="divide-y divide-stone-100">
        {officers.length === 0 && <p className="p-4 text-sm text-stone-400">No officers yet for this administration.</p>}
        {officers.map((o) => (
          <div key={o.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{o.display_name}</p>
              <p className="text-xs text-stone-500">{o.position?.title}{o.directorate ? ` · ${o.directorate.name}` : ''}</p>
            </div>
            <Badge tone={statusTone(o.status)}>{o.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}