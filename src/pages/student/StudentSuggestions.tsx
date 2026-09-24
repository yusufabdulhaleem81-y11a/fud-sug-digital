import { useEffect, useState, type FormEvent } from 'react';
import { listMySuggestions, submitSuggestion } from '../../services/suggestionService';
import type { Suggestion } from '../../services/suggestionService';
import { Badge, Button, Field, FormError, Input, PageHeader, Panel, PanelBody, PanelHead, TextArea, useToast } from '../../components/ui';
import { timeAgo } from '../../utils/format';

export default function StudentSuggestions() {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', anonymous: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => { listMySuggestions().then(setItems); }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await submitSuggestion(form);
      setRef(res.reference_number);
      setForm({ title: '', description: '', anonymous: false });
      toast('Suggestion submitted');
      listMySuggestions().then(setItems);
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Suggestions" subtitle="Ideas that shape Union policy and student welfare — reviewed by the responsible officers." />
      <Panel>
        <PanelHead title="Make a suggestion" />
        <PanelBody>
          {ref && <div className="banner">Thank you — your suggestion was recorded as <code>{ref}</code>.</div>}
          <form onSubmit={onSubmit}>
            {error && <FormError>{error}</FormError>}
            <Field label="Title"><Input required minLength={5} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Your suggestion"><TextArea required minLength={20} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <label className="check" style={{ marginBottom: 16 }}>
              <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />
              <span>Submit anonymously — your identity will not be stored.</span>
            </label>
            <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit suggestion'}</Button>
          </form>
        </PanelBody>
      </Panel>

      {items.length > 0 && (
        <div className="panel mt24">
          <PanelHead title="My suggestions" />
          {items.map((s) => (
            <div key={s.id} className="row">
              <div className="row-main">
                <div className="row-top"><span className="ref">{s.reference_number}</span></div>
                <h4>{s.title}</h4>
                <div className="meta"><span>{timeAgo(s.created_at)}</span>{s.response && <span>· {s.response}</span>}</div>
              </div>
              <Badge status={s.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}