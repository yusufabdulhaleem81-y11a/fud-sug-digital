import { useEffect, useState } from 'react';
import { listAdministrationRequests, listMyRequests, saveRequestDraft, submitRequest, decideRequest, REQUEST_CATEGORY_LABELS } from '../../services/requestService';
import { Badge, Button, EmptyState, Field, FormError, Input, Modal, PageHeader, Panel, PanelBody, PanelHead, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { naira, timeAgo } from '../../utils/format';

const EDITABLE = ['draft', 'changes_requested'];

export default function RequestsPanel({ mode }: { mode: 'officer' | 'president' }) {
  const toast = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [form, setForm] = useState({ id: null as string | null, title: '', category: 'funding', description: '', amount: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ item: any; status: string } | null>(null);
  const [note, setNote] = useState('');

  async function load() {
    setItems(mode === 'officer' ? await listMyRequests() : await listAdministrationRequests());
  }
  useEffect(() => { load(); }, [mode]);

  const current = items?.find((r) => r.id === form.id);
  const editable = !form.id || (current ? EDITABLE.includes(current.status) : true);

  async function onSave() {
    setBusy(true); setError(null);
    try {
      const id = await saveRequestDraft({
        id: form.id, title: form.title, category: form.category,
        description: form.description, amount: form.amount ? Number(form.amount) : null,
      });
      setForm({ ...form, id });
      toast('Draft saved');
      await load();
    } catch (e: any) { setError(e.message ?? 'Failed'); } finally { setBusy(false); }
  }

  async function onSubmit() {
    if (!form.id) { toast('Save the draft first', true); return; }
    setBusy(true);
    try { await submitRequest(form.id); toast('Request submitted to the President'); setForm({ id: null, title: '', category: 'funding', description: '', amount: '' }); await load(); }
    catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function onDecide() {
    if (!decision) return;
    setBusy(true);
    try {
      await decideRequest(decision.item.id, decision.status, note);
      toast(`Request ${decision.status.replace('_', ' ')}`);
      setDecision(null); setNote('');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Requests to the President"
        subtitle={mode === 'officer'
          ? 'Funding, resources, approvals — submit formally and track the decision.'
          : 'Review and decide on officer requests — every decision is recorded and the officer is notified.'} />

      {mode === 'officer' && (
        <Panel className="mb24">
          <PanelHead title={form.id ? 'Edit request' : 'New request'} right={current ? <Badge status={current.status} /> : <Badge status="draft" />} />
          <PanelBody>
            {error && <FormError>{error}</FormError>}
            <div className="grid sm:grid-cols-2" style={{ gap: 0 }}>
              <Field label="Type">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(REQUEST_CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Amount (₦, optional)">
                <Input type="number" value={form.amount} placeholder="e.g. 50000"
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
            </div>
            <Field label="Title"><Input value={form.title} placeholder="What are you requesting?" onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Details"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            {current?.decision_note && <div className="banner">Presidential decision: {current.decision_note}</div>}
            <div className="fx">
              <Button size="sm" disabled={busy || !editable || !form.title.trim()} onClick={onSave}>{busy ? 'Saving…' : 'Save draft'}</Button>
              <Button size="sm" variant="danger" disabled={busy || !form.id || !editable} onClick={onSubmit}>
                {current?.status === 'changes_requested' ? 'Resubmit' : 'Submit to President'}
              </Button>
            </div>
          </PanelBody>
        </Panel>
      )}

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No requests yet" description={mode === 'officer' ? 'Your requests will appear here.' : 'Officer requests will appear here.'} />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} request${items.length > 1 ? 's' : ''}`} />
          {items.map((r) => (
            <div key={r.id} className="row" style={mode === 'officer' && EDITABLE.includes(r.status) ? { cursor: 'pointer' } : undefined}
              onClick={mode === 'officer' && EDITABLE.includes(r.status) ? () => setForm({
                id: r.id, title: r.title, category: r.category, description: r.description ?? '', amount: r.amount != null ? String(r.amount) : '',
              }) : undefined}>
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{r.reference_number}</span>
                  <span className="cattag">{REQUEST_CATEGORY_LABELS[r.category] ?? r.category}</span>
                  {mode === 'president' && r.officer && <span className="badge b-mint">{r.officer.display_name}</span>}
                </div>
                <h4>{r.title}</h4>
                <div className="meta">
                  <span>{timeAgo(r.updated_at)}</span>
                  {r.amount != null && <span>· {naira(r.amount)}</span>}
                  {r.decision_note && <span>· {r.decision_note}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge status={r.status} />
                {mode === 'president' && ['submitted', 'under_review', 'changes_requested'].includes(r.status) && (
                  <>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDecision({ item: r, status: 'approved' }); }}>Approve</Button>
                    <Button size="sm" variant="dangerOutline" onClick={(e) => { e.stopPropagation(); setDecision({ item: r, status: 'rejected' }); }}>Reject</Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDecision({ item: r, status: 'changes_requested' }); }}>Changes</Button>
                  </>
                )}
                {mode === 'president' && r.status === 'approved' && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDecision({ item: r, status: 'completed' }); }}>Mark completed</Button>
                )}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Modal open={!!decision} onClose={() => setDecision(null)}
        title={`Decision: ${decision?.item?.title ?? ''}`}
        desc="The officer is notified immediately with your note."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setDecision(null)}>Cancel</Button>
          <Button size="sm" disabled={busy} onClick={onDecide}>{busy ? 'Saving…' : 'Send decision'}</Button>
        </>}>
        <Field label="Note to the officer">
          <TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain the decision…" />
        </Field>
      </Modal>
    </div>
  );
}