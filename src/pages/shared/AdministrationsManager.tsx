import { useEffect, useState, type FormEvent } from 'react';
import {
  createAdministration, listAllAdministrations, setAdministrationStatus,
  type CreateAdministrationInput,
} from '../../services/administrationService';
import { Badge, Button, Card, Field, PageHeader, formatDate, inputClass, statusTone } from '../../components/ui';
import type { Administration } from '../../types/models';

const EMPTY = {
  academic_session: '', name: '', start_date: '', end_date: '',
  theme: '', description: '', priorities: '', status: 'planned' as Administration['status'],
};

export default function AdministrationsManager() {
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() { setAdministrations(await listAllAdministrations()); }
  useEffect(() => { load(); }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    const input: CreateAdministrationInput = {
      academic_session: form.academic_session.trim(),
      name: form.name.trim() || `${form.academic_session.trim()} Administration`,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      theme: form.theme.trim() || null,
      description: form.description.trim() || null,
      priorities: form.priorities.split('\n').map((s) => s.trim()).filter(Boolean),
      status: form.status,
    };
    try {
      await createAdministration(input);
      setNotice(`Created ${input.name}.`);
      setForm(EMPTY);
      await load();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create administration');
    } finally { setBusy(false); }
  }

  async function changeStatus(id: string, status: Administration['status']) {
    setError(null);
    try { await setAdministrationStatus(id, status); await load(); }
    catch (err: any) { setError(err.message); }
  }

  return (
    <div>
      <PageHeader title="Administrations" subtitle="Institutional record of every SUG administration. Nothing is ever deleted — only archived." />

      {error && <p className="form-err">{error}</p>}
      {notice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      <Card className="mb-8 p-6">
        <h2 className="serif mb-4 font-bold">Create administration</h2>
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <Field label="Academic session" hint="Format: 2025/2026">
            <input className={inputClass} value={form.academic_session} required placeholder="2025/2026"
              onChange={(e) => setForm({ ...form, academic_session: e.target.value })} />
          </Field>
          <Field label="Display name" hint="Leave blank to auto-generate">
            <input className={inputClass} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Start date">
            <input type="date" className={inputClass} value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="End date">
            <input type="date" className={inputClass} value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Field>
          <Field label="Theme">
            <input className={inputClass} value={form.theme} placeholder="e.g. Students First, Progress for All"
              onChange={(e) => setForm({ ...form, theme: e.target.value })} />
          </Field>
          <Field label="Status" hint="Only one administration can be 'current' at a time">
            <select className={inputClass} value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Administration['status'] })}>
              {['planned', 'upcoming', 'current'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea className={inputClass} rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Priorities" hint="One per line">
              <textarea className={inputClass} rows={3} value={form.priorities}
                onChange={(e) => setForm({ ...form, priorities: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy || !form.academic_session.trim()}>
              {busy ? 'Creating…' : 'Create administration'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="divide-y divide-stone-100">
        {administrations.map((a) => (
          <div key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{a.name}</p>
                <Badge tone={statusTone(a.status)}>{a.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-stone-400">
                {a.academic_session} · {formatDate(a.start_date)} — {formatDate(a.end_date)}
              </p>
            </div>
            <select className="input" style={{ minWidth: 170 }}
              value={a.status}
              onChange={(e) => changeStatus(a.id, e.target.value as Administration['status'])}>
              {['planned', 'upcoming', 'current', 'transitioning', 'completed', 'archived'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </Card>
    </div>
  );
}