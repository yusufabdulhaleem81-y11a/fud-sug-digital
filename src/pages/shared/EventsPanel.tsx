import { useEffect, useState, type FormEvent } from 'react';
import { announceEvent, listAdministrationEvents, saveEvent } from '../../services/contentService';
import { Badge, Button, EmptyState, Field, Input, PageHeader, Panel, PanelBody, PanelHead, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { fmtDT, timeAgo } from '../../utils/format';

const EMPTY = { title: '', description: '', location: '', starts_at: '' };

export default function EventsPanel() {
  const toast = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  async function load() { setItems(await listAdministrationEvents()); }
  useEffect(() => { load(); }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await saveEvent(form);
      toast('Event created');
      setForm(EMPTY);
      await load();
    } catch (err: any) { toast(err.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function announce(id: string) {
    try { await announceEvent(id); toast('Event announced to students'); await load(); }
    catch (e: any) { toast(e.message ?? 'Failed', true); }
  }

  return (
    <div>
      <PageHeader title="Events" subtitle="Create Union events and announce them to all students." />
      <Panel className="mb24">
        <PanelHead title="New event" />
        <PanelBody>
          <form onSubmit={onSave}>
            <div className="grid sm:grid-cols-2" style={{ gap: 0 }}>
              <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Location"><Input value={form.location} placeholder="e.g. Main Auditorium" onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            </div>
            <Field label="Date & time"><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></Field>
            <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Button type="submit" size="sm" disabled={busy || !form.title.trim()}>{busy ? 'Saving…' : 'Create event'}</Button>
          </form>
        </PanelBody>
      </Panel>

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No events yet" />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} event${items.length > 1 ? 's' : ''}`} />
          {items.map((ev) => (
            <div key={ev.id} className="row">
              <div className="row-main">
                <div className="row-top"><Badge status={ev.status} /></div>
                <h4>{ev.title}</h4>
                <div className="meta">
                  <span>{timeAgo(ev.created_at)}</span>
                  {ev.starts_at && <span>· {fmtDT(ev.starts_at)}</span>}
                  {ev.location && <span>· {ev.location}</span>}
                </div>
              </div>
              {ev.status === 'planned' && <Button size="sm" onClick={() => announce(ev.id)}>Announce</Button>}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}