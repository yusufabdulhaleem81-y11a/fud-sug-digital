import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport } from '../../services/reportService';
import { REPORT_CATEGORIES, PRIORITY_OPTIONS } from '../../lib/constants';
import { Button, Field, FormError, Input, PageHeader, Panel, PanelBody, Select, TextArea, Ticket, useToast } from '../../components/ui';

export default function NewReport() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ category: '', title: '', description: '', priority: 'Medium' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await submitReport({
        title: form.title, description: form.description, category: form.category,
        priority: form.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
      });
      setRef(res.reference_number);
      toast('Report submitted');
    } catch (err: any) {
      setError(err.message ?? 'Could not submit the report.');
    } finally { setBusy(false); }
  }

  if (ref) {
    return (
      <div className="ticket">
        <PageHeader title="Report received" subtitle="Your report has been recorded and auto-routed to the right officer." />
        <Ticket reference={ref} onCopy={() => { navigator.clipboard.writeText(ref); toast('Reference copied'); }} />
        <p className="mut small">
          You will see responses and updates in the case timeline. Officers never see more of your
          identity than the platform requires — anonymous mode is available for complaints.
        </p>
        <div className="fx mt16">
          <Button onClick={() => navigate('/student/reports')}>Go to my reports</Button>
          <Button variant="ghost" onClick={() => { setRef(null); setForm({ category: '', title: '', description: '', priority: 'Medium' }); }}>
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket">
      <PageHeader title="Submit a report" subtitle="Routed automatically to the officer responsible for the category you choose." />
      <Panel>
        <PanelBody>
          <form onSubmit={onSubmit}>
            {error && <FormError>{error}</FormError>}
            <Field label="Category">
              <Select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select a category…</option>
                {REPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Title">
              <Input required minLength={5} maxLength={120} value={form.title}
                placeholder="Short summary of the issue" onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <TextArea required minLength={20} rows={5} value={form.description}
                placeholder="Give the details the officer will need to act…"
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Priority" hint="Only mark Urgent for issues affecting safety or deadlines.">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Button type="submit" disabled={busy || !form.category}>{busy ? 'Submitting…' : 'Submit report'}</Button>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}