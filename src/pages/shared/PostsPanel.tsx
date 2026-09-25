import { useEffect, useState, type FormEvent } from 'react';
import { listAdministrationPosts, publishPost, savePost, unpublishPost } from '../../services/contentService';
import { POST_CATEGORIES } from '../../lib/constants';
import { Badge, Button, EmptyState, Field, Input, PageHeader, Panel, PanelBody, PanelHead, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { timeAgo } from '../../utils/format';

const EMPTY = { id: null as string | null, title: '', body: '', category: 'Announcement' };

export default function PostsPanel() {
  const toast = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  async function load() { setItems(await listAdministrationPosts()); }
  useEffect(() => { load(); }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const id = await savePost({ id: form.id, title: form.title, body: form.body, category: form.category });
      setForm({ ...form, id });
      toast('Saved as draft');
      await load();
    } catch (err: any) { toast(err.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function act(_id: string, fn: () => Promise<void>, msg: string) {
    try { await fn(); toast(msg); await load(); } catch (e: any) { toast(e.message ?? 'Failed', true); }
  }

  return (
    <div>
      <PageHeader title="Posts & Announcements" subtitle="Publish official Union announcements to all students." />
      <Panel className="mb24">
        <PanelHead title={form.id ? 'Edit post' : 'New post'} />
        <PanelBody>
          <form onSubmit={onSave}>
            <div className="grid sm:grid-cols-2" style={{ gap: 0 }}>
              <Field label="Category">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {POST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            </div>
            <Field label="Body"><TextArea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            <Button type="submit" size="sm" disabled={busy || !form.title.trim() || !form.body.trim()}>{busy ? 'Saving…' : 'Save draft'}</Button>
          </form>
        </PanelBody>
      </Panel>

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No posts yet" />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} post${items.length > 1 ? 's' : ''}`} />
          {items.map((p) => (
            <div key={p.id} className="row" style={p.status === 'draft' ? { cursor: 'pointer' } : undefined}
              onClick={p.status === 'draft' ? () => setForm({ id: p.id, title: p.title, body: p.body, category: p.category ?? 'Announcement' }) : undefined}>
              <div className="row-main">
                <div className="row-top">
                  <Badge status={p.status} />
                  {p.category && <span className="cattag">{p.category}</span>}
                </div>
                <h4>{p.title}</h4>
                <div className="meta"><span>{timeAgo(p.created_at)}</span>{p.author_officer && <span>· {p.author_officer.display_name}</span>}</div>
              </div>
              <div className="fx" style={{ alignItems: 'flex-end', flexFlow: 'column wrap', gap: 6 }}>
                {p.status === 'draft' && <Button size="sm" onClick={(e) => { e.stopPropagation(); act(p.id, () => publishPost(p.id), 'Published to all students'); }}>Publish</Button>}
                {p.status === 'published' && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); act(p.id, () => unpublishPost(p.id), 'Unpublished'); }}>Unpublish</Button>}
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}