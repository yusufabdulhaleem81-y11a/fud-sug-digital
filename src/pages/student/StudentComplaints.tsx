import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listMyComplaints, submitAnonymousComplaint, submitIdentifiedComplaint, trackComplaint } from '../../services/complaintService';
import type { CaseSummary } from '../../services/complaintService';
import { REPORT_CATEGORIES } from '../../lib/constants';
import { Badge, Button, Field, FormError, Input, PageHeader, Panel, PanelBody, PanelHead, Select, TextArea, Ticket, useToast } from '../../components/ui';
import { timeAgo } from '../../utils/format';

type Tab = 'mine' | 'lodge' | 'track';
const EMPTY = { category: '', title: '', description: '', against: '', anonymous: false };

export default function StudentComplaints() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('mine');
  const [items, setItems] = useState<CaseSummary[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<{ reference_number: string; tracking_code?: string } | null>(null);
  const [track, setTrack] = useState({ ref: '', code: '' });
  const [tracked, setTracked] = useState<{ status: string; updated_at: string } | null | 'none'>(null);

  useEffect(() => { if (tab === 'mine') listMyComplaints().then(setItems); }, [tab]);

  async function onLodge(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = form.anonymous
        ? await submitAnonymousComplaint(form)
        : await submitIdentifiedComplaint(form);
      setTicket({ reference_number: res.reference_number, tracking_code: form.anonymous ? res.tracking_code : undefined });
      setForm(EMPTY);
      toast('Complaint submitted');
    } catch (err: any) { setError(err.message ?? 'Could not submit the complaint.'); }
    finally { setBusy(false); }
  }

  async function onTrack(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setTracked(null);
    try { setTracked(await trackComplaint(track.ref, track.code)); }
    catch { setTracked('none'); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Lodge a complaint — identified, or fully anonymous — and track it by reference." />
      <div className="chips" style={{ marginBottom: 18 }}>
        {([['mine', 'My complaints'], ['lodge', 'Lodge a complaint'], ['track', 'Track a complaint']] as [Tab, string][])
          .map(([t, label]) => (
            <button key={t} className={tab === t ? 'chip on' : 'chip'} onClick={() => { setTab(t); setTicket(null); setTracked(null); }}>
              {label}
            </button>
          ))}
      </div>

      {tab === 'mine' && (
        <>
          <div className="banner">Anonymous complaints are never linked to your account — track them with the reference number and tracking code you received.</div>
          {items === null ? <div className="spin" /> : items.length === 0 ? (
            <Panel><PanelBody><p className="mut small">No identified complaints yet.</p></PanelBody></Panel>
          ) : (
            <div className="panel">
              {items.map((c) => (
                <Link key={c.id} to={`/student/complaints/${c.id}`} className="row">
                  <div className="row-main">
                    <div className="row-top"><span className="ref">{c.reference_number}</span>{c.category && <span className="cattag">{c.category}</span>}</div>
                    <h4>{c.title ?? c.description.slice(0, 70) + '…'}</h4>
                    <div className="meta"><span>Updated {timeAgo(c.updated_at)}</span></div>
                  </div>
                  <Badge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'lodge' && (
        ticket ? (
          <div className="ticket">
            <h3 className="serif">Complaint received</h3>
            <Ticket reference={ticket.reference_number}
              tracking={ticket.tracking_code}
              onCopy={() => { navigator.clipboard.writeText(`${ticket.reference_number} ${ticket.tracking_code ?? ''}`); toast('Copied'); }} />
          </div>
        ) : (
          <Panel>
            <PanelBody>
              <form onSubmit={onLodge}>
                {error && <FormError>{error}</FormError>}
                <Field label="Category">
                  <Select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select a category…</option>
                    {REPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Title (optional)">
                  <Input value={form.title} placeholder="Short summary" onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </Field>
                <Field label="What happened?">
                  <TextArea required minLength={20} rows={5} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Field label="Against (optional)" hint="The person, office or facility involved.">
                  <Input value={form.against} onChange={(e) => setForm({ ...form, against: e.target.value })} />
                </Field>
                <label className="check" style={{ marginBottom: 16 }}>
                  <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
                  <span>Submit <b>anonymously</b> — your identity will not be stored or visible to anyone, including the President and administrators.</span>
                </label>
                <Button type="submit" disabled={busy || !form.category}>{busy ? 'Submitting…' : 'Submit complaint'}</Button>
              </form>
            </PanelBody>
          </Panel>
        )
      )}

      {tab === 'track' && (
        <Panel>
          <PanelHead title="Track an anonymous complaint" />
          <PanelBody>
            <form onSubmit={onTrack}>
              <Field label="Reference number"><Input required placeholder="CMP-2026-000014" value={track.ref} onChange={(e) => setTrack({ ...track, ref: e.target.value })} /></Field>
              <Field label="Tracking code"><Input required placeholder="TRK-…" value={track.code} onChange={(e) => setTrack({ ...track, code: e.target.value })} /></Field>
              <Button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Check status'}</Button>
            </form>
            {tracked === 'none' && <div className="mt16"><FormError>No complaint matches that reference number and tracking code.</FormError></div>}
            {tracked && tracked !== 'none' && (
              <div className="mt16 fx" style={{ justifyContent: 'space-between' }}>
                <span className="mut small">Last update {timeAgo(tracked.updated_at)}</span>
                <Badge status={tracked.status} />
              </div>
            )}
          </PanelBody>
        </Panel>
      )}
    </div>
  );
}