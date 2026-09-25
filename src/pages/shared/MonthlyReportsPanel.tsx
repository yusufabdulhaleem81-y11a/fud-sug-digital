import { useEffect, useState, type FormEvent } from 'react';
import { createTask, listAdministrationTasks, listMyTasks, updateTaskProgress, type Task } from '../../services/taskService';
import { getCurrentAdministration, listDirectorates, listOfficers } from '../../services/administrationService';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Panel, PanelHead, Prio, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import type { Directorate, OfficerRecord } from '../../types/models';
import { fmtDate, timeAgo } from '../../utils/format';

const STATUSES = ['pending', 'in_progress', 'blocked', 'completed', 'cancelled'];

export default function TasksPanel({ mode }: { mode: 'officer' | 'leadership' }) {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [directorates, setDirectorates] = useState<Directorate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assigned_officer_id: '', directorate_id: '', priority: 'Medium', deadline: '' });
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [patch, setPatch] = useState({ status: 'pending', progress: 0, note: '' });

  async function load() {
    setTasks(mode === 'officer' ? await listMyTasks() : await listAdministrationTasks());
  }

  useEffect(() => {
    load();
    if (mode === 'leadership') {
      getCurrentAdministration().then((a) => a && listOfficers(a.id).then(setOfficers));
      listDirectorates().then(setDirectorates);
    }
  }, [mode]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await createTask({
        title: form.title, description: form.description,
        assigned_officer_id: form.assigned_officer_id || null,
        directorate_id: form.directorate_id || null,
        priority: form.priority.toLowerCase() as any,
        deadline: form.deadline || null,
      });
      toast('Task created & assigned');
      setShowNew(false);
      setForm({ title: '', description: '', assigned_officer_id: '', directorate_id: '', priority: 'Medium', deadline: '' });
      await load();
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  }

  async function onProgress() {
    if (!editTask) return;
    setBusy(true);
    try {
      await updateTaskProgress(editTask.id, { status: patch.status, progress: Number(patch.progress) }, patch.note);
      toast('Task updated');
      setEditTask(null);
      await load();
    } catch (err: any) { toast(err.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  const overdue = (t: Task) =>
    t.deadline && !['completed', 'cancelled'].includes(t.status) && new Date(t.deadline) < new Date();

  return (
    <div>
      <PageHeader
        title={mode === 'officer' ? 'My Tasks' : 'Tasks'}
        subtitle={mode === 'officer'
          ? 'Tasks assigned to you. Update progress as you work — every change is recorded.'
          : 'Create tasks and assign them to officers. Deadlines and progress are tracked automatically.'}
        right={mode === 'leadership' ? <Button size="sm" onClick={() => setShowNew(true)}>+ New task</Button> : undefined}
      />

      {error && <p className="form-err">{error}</p>}

      {tasks === null ? <SkeletonRows /> : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description={mode === 'officer'
            ? 'Tasks assigned to you by the President or VP will appear here.'
            : 'Create the first task for this administration.'}
          action={mode === 'leadership' ? <Button size="sm" onClick={() => setShowNew(true)}>Create a task</Button> : undefined}
        />
      ) : (
        <Panel>
          <PanelHead title={`${tasks.length} task${tasks.length > 1 ? 's' : ''}`} />
          {tasks.map((t) => (
            <div key={t.id} className="row">
              <div className="row-main">
                <div className="row-top">
                  {mode === 'leadership' && t.assigned_officer && (
                    <span className="badge b-mint">{t.assigned_officer.display_name}</span>
                  )}
                  <Badge status={t.status} />
                  {t.priority && <Prio value={t.priority} />}
                </div>
                <h4>{t.title}</h4>
                <div className="meta">
                  <span>Updated {timeAgo(t.updated_at)}</span>
                  {t.deadline && (
                    <span style={overdue(t) ? { color: 'var(--red)', fontWeight: 600 } : undefined}>
                      · Due {fmtDate(t.deadline)}{overdue(t) ? ' (overdue)' : ''}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 8, background: '#EDEAE0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.progress}%`, background: 'var(--green)', borderRadius: 99 }} />
                  </div>
                  <span className="fine">{t.progress}% complete</span>
                </div>
              </div>
              {mode === 'officer' && !['completed', 'cancelled'].includes(t.status) && (
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditTask(t);
                  setPatch({ status: t.status, progress: t.progress, note: '' });
                }}>Update</Button>
              )}
            </div>
          ))}
        </Panel>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Create & assign task"
        desc="The officer receives a notification immediately."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button size="sm" disabled={busy || !form.title.trim()} onClick={onCreate}>{busy ? 'Creating…' : 'Create task'}</Button>
        </>}>
        <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Assign to">
          <Select value={form.assigned_officer_id} onChange={(e) => setForm({ ...form, assigned_officer_id: e.target.value })}>
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
        <Field label="Priority">
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Deadline"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
      </Modal>

      <Modal open={!!editTask} onClose={() => setEditTask(null)} title={`Update: ${editTask?.title ?? ''}`}
        desc="Progress and status changes are recorded in the task history."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setEditTask(null)}>Cancel</Button>
          <Button size="sm" disabled={busy} onClick={onProgress}>{busy ? 'Saving…' : 'Save update'}</Button>
        </>}>
        <Field label="Status">
          <Select value={patch.status} onChange={(e) => setPatch({ ...patch, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
        </Field>
        <Field label={`Progress: ${patch.progress}%`}>
          <input type="range" min={0} max={100} value={patch.progress}
            onChange={(e) => setPatch({ ...patch, progress: Number(e.target.value) })}
            style={{ width: '100%', accentColor: 'var(--green)' }} />
        </Field>
        <Field label="Note (optional)">
          <TextArea rows={2} value={patch.note} onChange={(e) => setPatch({ ...patch, note: e.target.value })} />
        </Field>
      </Modal>
    </div>
  );
}