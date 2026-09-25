import { useEffect, useState, type FormEvent } from 'react';
import { acknowledgeDirective, completeDirective, issueDirective, listAdministrationDirectives, listMyDirectives, type Directive } from '../../services/directiveService';
import { getCurrentAdministration, listOfficers } from '../../services/administrationService';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Panel, PanelHead, Prio, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import type { OfficerRecord } from '../../types/models';
import { fmtDate, timeAgo } from '../../utils/format';

const dirTone = (s: string) => (s === 'completed' ? 'green' : s === 'acknowledged' ? 'blue' : 'gold');

export default function DirectivesPanel({ mode }: { mode: 'president' | 'officer' }) {
  const toast = useToast();
  const [items, setItems] = useState<Directive[] | null>(null);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', instruction: '', directed_officer_id: '', priority: 'Medium', deadline: '' });

  async function load() {
    setItems(mode === 'officer' ? await listMyDirectives() : await listAdministrationDirectives());
  }
  useEffect(() => {
    load();
    if (mode === 'president') {
      getCurrentAdministration().then((a) => a && listOfficers(a.id).then(setOfficers));
    }
  }, [mode]);

  async function onIssue(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await issueDirective({
        title: form.title, instruction: form.instruction,
        directed_officer_id: form.directed_officer_id || null,
        priority: form.priority.toLowerCase() as any, deadline: form.deadline || null,
      });
      toast('Directive issued');
      setShowNew(false);
      setForm({ title: '', instruction: '', directed_officer_id: '', priority: 'Medium', deadline: '' });
      await load();
    } catch (err: any) { toast(err.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function act(id: string, action: 'acknowledge' | 'complete') {
    setBusy(true);
    try {
      if (action === 'acknowledge') await acknowledgeDirective(id);
      else await completeDirective(id);
      toast(action === 'acknowledge' ? 'Directive acknowledged' : 'Directive completed');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Directives"
        subtitle={mode === 'president'
          ? 'Issue directives to officers — every directive is permanently recorded.'
          : 'Directives directed to you. Acknowledge and complete them.'}
        right={mode === 'president' ? <Button size="sm" onClick={() => setShowNew(true)}>+ New directive</Button> : undefined}
      />

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No directives"
          description={mode === 'officer' ? 'Directives from the President will appear here.' : 'Issue the first directive.'} />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} directive${items.length > 1 ? 's' : ''}`} />
          {items.map((d) => (
            <div key={d.id} className="row">
              <div className="row-main">
                <div className="row-top">
                  {mode === 'president' && d.directed_officer && (
                    <span className="badge b-mint">{d.directed_officer.display_name}</span>
                  )}
                  <Badge tone={dirTone(d.status)}>{d.status}</Badge>
                  <Prio value={d.priority} />
                </div>
                <h4>{d.title}</h4>
                <p className="mut small" style={{ marginTop: 4 }}>{d.instruction}</p>
                <div className="meta">
                  <span>{timeAgo(d.created_at)}</span>
                  {d.deadline && <span>· Due {fmtDate(d.deadline)}</span>}
                </div>
              </div>
              {mode === 'officer' && d.status === 'issued' && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => act(d.id, 'acknowledge')}>Acknowledge</Button>
              )}
              {mode === 'officer' && ['issued', 'acknowledged'].includes(d.status) && (
                <Button size="sm" disabled={busy} onClick={() => act(d.id, 'complete')}>Mark completed</Button>
              )}
            </div>
          ))}
        </Panel>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Issue directive"
        desc="The directed officer receives a notification immediately."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button size="sm" disabled={busy || !form.title.trim() || !form.instruction.trim()} onClick={onIssue}>{busy ? 'Issuing…' : 'Issue directive'}</Button>
        </>}>
        <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Instruction"><TextArea required rows={3} value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} /></Field>
        <Field label="Direct to">
          <Select value={form.directed_officer_id} onChange={(e) => setForm({ ...form, directed_officer_id: e.target.value })}>
            <option value="">General (no specific officer)</option>
            {officers.map((o) => <option key={o.id} value={o.id}>{o.display_name} — {o.position?.title}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Deadline"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
      </Modal>
    </div>
  );
}