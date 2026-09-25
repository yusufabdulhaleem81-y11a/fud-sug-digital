import { useEffect, useState } from 'react';
import { listAdministrationAchievements, publishAchievement, reviewAchievement, saveAchievement, submitAchievement, type Achievement } from '../../services/achievementService';
import { listAdministrationProjects } from '../../services/projectService';
import { Badge, Button, EmptyState, Field, Input, PageHeader, Panel, PanelBody, PanelHead, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { fmtDate, timeAgo } from '../../utils/format';

const EDITABLE = ['draft', 'declined'];

export default function AchievementsPanel({ mode }: { mode: 'officer' | 'president' }) {
  const toast = useToast();
  const [items, setItems] = useState<Achievement[] | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ id: null as string | null, title: '', description: '', category: '', achievement_date: '', impact: '', project_id: '' });
  const [busy, setBusy] = useState(false);

  async function load() {
    setItems(await listAdministrationAchievements());
    listAdministrationProjects().then(setProjects);
  }
  useEffect(() => { load(); }, []);

  const current = items?.find((a) => a.id === form.id);
  const editable = !form.id || (current ? EDITABLE.includes(current.status) : true);

  async function onSave() {
    setBusy(true);
    try {
      const id = await saveAchievement({
        id: form.id, title: form.title, description: form.description,
        category: form.category, achievement_date: form.achievement_date || null,
        impact: form.impact, project_id: form.project_id || null,
      });
      setForm({ ...form, id });
      toast('Draft saved');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function onSubmit() {
    if (!form.id) { toast('Save the draft first', true); return; }
    setBusy(true);
    try { await submitAchievement(form.id); toast('Submitted for presidential review'); setForm({ id: null, title: '', description: '', category: '', achievement_date: '', impact: '', project_id: '' }); await load(); }
    catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function act(a: Achievement, fn: () => Promise<void>, msg: string) {
    try { await fn(); toast(msg); await load(); }
    catch (e: any) { toast(e.message ?? 'Failed', true); }
  }

  return (
    <div>
      <PageHeader title="Achievements"
        subtitle={mode === 'officer'
          ? 'Record what your office achieved — submissions are reviewed by the President before publication.'
          : 'Review officer submissions — only the President can publish official SUG achievements.'} />

      {mode === 'officer' && (
        <Panel className="mb24">
          <PanelHead title={form.id ? 'Edit achievement' : 'Record an achievement'}
            right={current ? <Badge status={current.status} /> : <Badge status="draft" />} />
          <PanelBody>
            <div className="grid sm:grid-cols-2" style={{ gap: 0 }}>
              <Field label="Category (optional)"><Input value={form.category} placeholder="e.g. Welfare, Academic" onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
              <Field label="Date achieved"><Input type="date" value={form.achievement_date} onChange={(e) => setForm({ ...form, achievement_date: e.target.value })} /></Field>
            </div>
            <Field label="Title"><Input value={form.title} placeholder="e.g. Restored water supply to Hostel Block C" onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Impact (optional)"><TextArea rows={2} value={form.impact} placeholder="Who benefited and how" onChange={(e) => setForm({ ...form, impact: e.target.value })} /></Field>
            <Field label="Related project (optional)">
              <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
            </Field>
            <div className="fx">
              <Button size="sm" disabled={busy || !editable || !form.title.trim()} onClick={onSave}>{busy ? 'Saving…' : 'Save draft'}</Button>
              <Button size="sm" variant="danger" disabled={busy || !form.id || !editable} onClick={onSubmit}>Submit for review</Button>
            </div>
          </PanelBody>
        </Panel>
      )}

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No achievements recorded yet" />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} achievement${items.length > 1 ? 's' : ''}`} />
          {items.map((a) => (
            <div key={a.id} className="row" style={mode === 'officer' && EDITABLE.includes(a.status) ? { cursor: 'pointer' } : undefined}
              onClick={mode === 'officer' && EDITABLE.includes(a.status) ? () => setForm({
                id: a.id, title: a.title, description: a.description,
                category: a.category ?? '', achievement_date: a.achievement_date ?? '',
                impact: a.impact ?? '', project_id: a.project_id ?? '',
              }) : undefined}>
              <div className="row-main">
                <div className="row-top">
                  <Badge status={a.status} />
                  {a.category && <span className="cattag">{a.category}</span>}
                  {a.responsible_officer && <span className="badge b-mint">{a.responsible_officer.display_name}</span>}
                </div>
                <h4>{a.title}</h4>
                <div className="meta"><span>{timeAgo(a.created_at)}</span>{a.achievement_date && <span>· {fmtDate(a.achievement_date)}</span>}</div>
              </div>
              {mode === 'president' && (
                <div className="fx" style={{ alignItems: 'flex-end', flexFlow: 'column wrap', gap: 6 }}>
                  {a.status === 'submitted' && <>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); act(a, () => reviewAchievement(a.id, 'under_review'), 'Under review'); }}>Review</Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); act(a, () => reviewAchievement(a.id, 'approved'), 'Approved'); }}>Approve</Button>
                    <Button size="sm" variant="dangerOutline" onClick={(e) => { e.stopPropagation(); act(a, () => reviewAchievement(a.id, 'declined'), 'Declined'); }}>Decline</Button>
                  </>}
                  {a.status === 'approved' && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); act(a, () => publishAchievement(a.id), 'PUBLISHED 🎉 Now visible to all students'); }}>Publish</Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}