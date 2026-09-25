import { useEffect, useState, type FormEvent } from 'react';
import { completeProject, createProject, listAdministrationProjects, setProjectStatus, type Project } from '../../services/projectService';
import { getCurrentAdministration, listDirectorates, listOfficers } from '../../services/administrationService';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Panel, PanelHead, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import type { Directorate, OfficerRecord } from '../../types/models';
import { fmtDate, naira, timeAgo } from '../../utils/format';

const EMPTY = { title: '', description: '', category: '', directorate_id: '', responsible_officer_id: '', start_date: '', expected_completion_date: '', budget: '', funding_source: '' };

export default function ProjectsPanel() {
  const toast = useToast();
  const [items, setItems] = useState<Project[] | null>(null);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [directorates, setDirectorates] = useState<Directorate[]>([]);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [completing, setCompleting] = useState<Project | null>(null);
  const [completion, setCompletion] = useState({ outcome: '', impact: '', date: '' });

  async function load() { setItems(await listAdministrationProjects()); }
  useEffect(() => {
    load();
    getCurrentAdministration().then((a) => a && listOfficers(a.id).then(setOfficers));
    listDirectorates().then(setDirectorates);
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await createProject({
        title: form.title, description: form.description, category: form.category,
        directorate_id: form.directorate_id || null,
        responsible_officer_id: form.responsible_officer_id || null,
        start_date: form.start_date || null,
        expected_completion_date: form.expected_completion_date || null,
        budget: form.budget ? Number(form.budget) : null,
        funding_source: form.funding_source,
      });
      toast('Project created');
      setShowNew(false); setForm(EMPTY);
      await load();
    } catch (err: any) { toast(err.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function act(p: Project, status: string) {
    try { await setProjectStatus(p.id, status); toast(`Project ${status}`); await load(); }
    catch (e: any) { toast(e.message ?? 'Failed', true); }
  }

  async function onComplete() {
    if (!completing) return;
    setBusy(true);
    try {
      await completeProject(completing.id, completion.outcome, completion.impact, completion.date || null);
      toast('Project completed 🎉');
      setCompleting(null); setCompletion({ outcome: '', impact: '', date: '' });
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Projects" subtitle="Create, track and complete the administration's projects — completed projects can be linked to official achievements."
        right={<Button size="sm" onClick={() => setShowNew(true)}>+ New project</Button>} />

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No projects yet" description="Create the first project for this administration." />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} project${items.length > 1 ? 's' : ''}`} />
          {items.map((p) => (
            <div key={p.id} className="row">
              <div className="row-main">
                <div className="row-top">
                  <Badge status={p.status} />
                  {p.category && <span className="cattag">{p.category}</span>}
                  {p.responsible_officer && <span className="badge b-mint">{p.responsible_officer.display_name}</span>}
                </div>
                <h4>{p.title}</h4>
                <div className="meta">
                  <span>Created {timeAgo(p.created_at)}</span>
                  {p.start_date && <span>· Started {fmtDate(p.start_date)}</span>}
                  {p.budget != null && <span>· {naira(p.budget)}</span>}
                  {p.completion_date && <span>· Completed {fmtDate(p.completion_date)}</span>}
                </div>
                {p.outcome && <p className="mut small" style={{ marginTop: 4 }}><b>Outcome:</b> {p.outcome}</p>}
              </div>
              <div className="fx" style={{ flexFlow: 'column wrap', alignItems: 'flex-end', gap: 6 }}>
                {p.status === 'approved' && <Button size="sm" onClick={() => act(p, 'active')}>Start</Button>}
                {p.status === 'active' && (
                  <>
                    <Button size="sm" onClick={() => setCompleting(p)}>Complete</Button>
                    <Button size="sm" variant="ghost" onClick={() => act(p, 'suspended')}>Suspend</Button>
                  </>
                )}
                {p.status === 'suspended' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => act(p, 'active')}>Resume</Button>
                    <Button size="sm" variant="dangerOutline" onClick={() => act(p, 'cancelled')}>Cancel</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New project"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button size="sm" disabled={busy || !form.title.trim()} onClick={onCreate}>{busy ? 'Creating…' : 'Create project'}</Button>
        </>}>
        <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Category (optional)"><Input value={form.category} placeholder="e.g. Welfare, Infrastructure" onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
        <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Responsible officer">
          <Select value={form.responsible_officer_id} onChange={(e) => setForm({ ...form, responsible_officer_id: e.target.value })}>
            <option value="">Unassigned</option>
            {officers.map((o) => <option key={o.id} value={o.id}>{o.display_name} — {o.position?.title}</option>)}
          </Select>
        </Field>
        <Field label="Directorate (optional)">
          <Select value={form.directorate_id} onChange={(e) => setForm({ ...form, directorate_id: e.target.value })}>
            <option value="">None</option>
            {directorates.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <div className="grid sm:grid-cols-2" style={{ gap: 0 }}>
          <Field label="Start date"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="Expected completion"><Input type="date" value={form.expected_completion_date} onChange={(e) => setForm({ ...form, expected_completion_date: e.target.value })} /></Field>
          <Field label="Budget (₦, optional)"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
          <Field label="Funding source (optional)"><Input value={form.funding_source} onChange={(e) => setForm({ ...form, funding_source: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={!!completing} onClose={() => setCompleting(null)} title={`Complete: ${completing?.title ?? ''}`}
        desc="Record the outcome — this becomes part of the permanent administration record."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setCompleting(null)}>Cancel</Button>
          <Button size="sm" disabled={busy || !completion.outcome.trim()} onClick={onComplete}>{busy ? 'Saving…' : 'Mark completed'}</Button>
        </>}>
        <Field label="Completion date"><Input type="date" value={completion.date} onChange={(e) => setCompletion({ ...completion, date: e.target.value })} /></Field>
        <Field label="Outcome"><TextArea required rows={3} value={completion.outcome} onChange={(e) => setCompletion({ ...completion, outcome: e.target.value })} /></Field>
        <Field label="Impact (optional)"><TextArea rows={2} value={completion.impact} onChange={(e) => setCompletion({ ...completion, impact: e.target.value })} /></Field>
      </Modal>
    </div>
  );
}