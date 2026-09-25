import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport } from '../../services/reportService';
import { REPORT_CATEGORIES, PRIORITY_OPTIONS } from '../../lib/constants';
import { Button, Field, FormError, Input, PageHeader, Panel, PanelBody, Select, TextArea, Ticket, useToast } from '../../components/ui';

export default function NewReport() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    category: '', title: '', description: '', priority: 'Medium',
    matric_no: '', faculty: '', department: '', phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await submitReport({
        title: form.title, description: form.description, category: form.category,
        priority: form.priority.toLowerCase() as any,
        matric_no: form.matric_no, faculty: form.faculty,
        department: form.department, phone: form.phone,
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
        <p className="mut small">Your faculty and department help the Union track which areas need the most attention.</p>
        <div className="fx mt16">
          <Button onClick={() => navigate('/student/reports')}>Go to my reports</Button>
          <Button variant="ghost" onClick={() => { setRef(null); setForm({ category: '', title: '', description: '', priority: 'Medium', matric_no: '', faculty: '', department: '', phone: '' }); }}>
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
            <div className="grid gap-0 sm:grid-cols-2" style={{ gap: 0 }}>
              <Field label="Matric number">
                <Input required value={form.matric_no} placeholder="e.g. CSC/2021/0142"
                  onChange={(e) => setForm({ ...form, matric_no: e.target.value })} />
              </Field>
              <Field label="Phone (optional)">
                <Input value={form.phone} placeholder="080…"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Faculty">
                <Input required value={form.faculty} placeholder="e.g. Faculty of Science"
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
              </Field>
              <Field label="Department">
                <Input required value={form.department} placeholder="e.g. Computer Science"
                  onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </Field>
            </div>
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