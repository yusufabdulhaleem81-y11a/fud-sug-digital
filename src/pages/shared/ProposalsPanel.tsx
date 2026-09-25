import { useEffect, useState } from 'react';
import { listAdministrationProposals, listMyProposals, saveProposalDraft, submitProposal, decideProposal, type ProposalContent } from '../../services/proposalService';
import { Badge, Button, EmptyState, Field, FormError, Input, Modal, PageHeader, Panel, PanelBody, PanelHead, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { timeAgo } from '../../utils/format';

const EDITABLE = ['draft', 'changes_requested'];
const SECTIONS: { key: keyof ProposalContent; label: string }[] = [
  { key: 'problem', label: 'The problem' },
  { key: 'solution', label: 'Proposed solution' },
  { key: 'objectives', label: 'Objectives' },
  { key: 'benefits', label: 'Benefits to students' },
  { key: 'implementation', label: 'Implementation plan' },
  { key: 'resources', label: 'Resources needed' },
  { key: 'budget', label: 'Estimated budget (₦)' },
  { key: 'risks', label: 'Risks & mitigation' },
  { key: 'timeline', label: 'Timeline' },
];
const EMPTY_FORM = { id: null as string | null, title: '', problem: '', solution: '', objectives: '', benefits: '', implementation: '', resources: '', budget: '', risks: '', timeline: '' };

export default function ProposalsPanel({ mode }: { mode: 'officer' | 'president' }) {
  const toast = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ item: any; status: string } | null>(null);
  const [note, setNote] = useState('');
  const [view, setView] = useState<any | null>(null);

  async function load() {
    setItems(mode === 'officer' ? await listMyProposals() : await listAdministrationProposals());
  }
  useEffect(() => { load(); }, [mode]);

  const current = items?.find((p) => p.id === form.id);
  const editable = !form.id || (current ? EDITABLE.includes(current.status) : true);

  async function onSave() {
    setBusy(true); setError(null);
    try {
      const content: ProposalContent = {
        problem: form.problem, solution: form.solution, objectives: form.objectives,
        benefits: form.benefits, implementation: form.implementation, resources: form.resources,
        budget: form.budget, risks: form.risks, timeline: form.timeline,
      };
      const id = await saveProposalDraft({ id: form.id, title: form.title, content });
      setForm({ ...form, id });
      toast('Draft saved');
      await load();
    } catch (e: any) { setError(e.message ?? 'Failed'); } finally { setBusy(false); }
  }

  async function onSubmit() {
    if (!form.id) { toast('Save the draft first', true); return; }
    setBusy(true);
    try { await submitProposal(form.id); toast('Proposal submitted to the President'); setForm(EMPTY_FORM); await load(); }
    catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function onDecide() {
    if (!decision) return;
    setBusy(true);
    try {
      await decideProposal(decision.item.id, decision.status, note);
      toast(`Proposal ${decision.status}`);
      setDecision(null); setNote('');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Proposals"
        subtitle={mode === 'officer'
          ? 'Formally propose initiatives to the President — problem, solution, budget and timeline.'
          : 'Review officer proposals — approve to move to implementation, or request changes.'} />

      {mode === 'officer' && (
        <Panel className="mb24">
          <PanelHead title={form.id ? 'Edit proposal' : 'New proposal'} right={current ? <Badge status={current.status} /> : <Badge status="draft" />} />
          <PanelBody>
            {error && <FormError>{error}</FormError>}
            <Field label="Title"><Input value={form.title} placeholder="e.g. Campus Night Study Initiative" onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2" style={{ gap: 0 }}>
              {SECTIONS.map((s) => (
                <Field key={s.key} label={s.label}>
                  <TextArea rows={2} value={form[s.key] as string} onChange={(e) => setForm({ ...form, [s.key]: e.target.value })} />
                </Field>
              ))}
            </div>
            {current?.review_note && <div className="banner">Presidential review: {current.review_note}</div>}
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
        <EmptyState title="No proposals yet" />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} proposal${items.length > 1 ? 's' : ''}`} />
          {items.map((p) => (
            <div key={p.id} className="row" style={mode === 'officer' && EDITABLE.includes(p.status) ? { cursor: 'pointer' } : undefined}
              onClick={mode === 'officer' && EDITABLE.includes(p.status) ? () => {
                const c = p.content ?? {};
                setForm({ id: p.id, title: p.title, problem: c.problem ?? '', solution: c.solution ?? '',
                  objectives: c.objectives ?? '', benefits: c.benefits ?? '', implementation: c.implementation ?? '',
                  resources: c.resources ?? '', budget: c.budget ?? '', risks: c.risks ?? '', timeline: c.timeline ?? '' });
              } : undefined}>
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{p.reference_number}</span>
                  {mode === 'president' && p.officer && <span className="badge b-mint">{p.officer.display_name}</span>}
                </div>
                <h4>{p.title}</h4>
                <div className="meta"><span>{timeAgo(p.updated_at)}</span>{p.review_note && <span>· {p.review_note}</span>}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge status={p.status} />
                {mode === 'president' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setView(p); }}>View</Button>
                    {['submitted', 'under_review', 'changes_requested'].includes(p.status) && (
                      <>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); setDecision({ item: p, status: 'approved' }); }}>Approve</Button>
                        <Button size="sm" variant="dangerOutline" onClick={(e) => { e.stopPropagation(); setDecision({ item: p, status: 'declined' }); }}>Decline</Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDecision({ item: p, status: 'changes_requested' }); }}>Changes</Button>
                      </>
                    )}
                    {p.status === 'approved' && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDecision({ item: p, status: 'implementation' }); }}>In implementation</Button>}
                    {p.status === 'implementation' && <Button size="sm" onClick={(e) => { e.stopPropagation(); setDecision({ item: p, status: 'completed' }); }}>Mark completed</Button>}
                  </>
                )}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.title ?? ''} desc="Full proposal content."
        footer={<Button size="sm" variant="ghost" onClick={() => setView(null)}>Close</Button>}>
        {view && SECTIONS.map((s) => (
          <p key={s.key} className="small" style={{ marginBottom: 8 }}>
            <b>{s.label}:</b> {(view.content?.[s.key] as string) || '—'}
          </p>
        ))}
      </Modal>

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