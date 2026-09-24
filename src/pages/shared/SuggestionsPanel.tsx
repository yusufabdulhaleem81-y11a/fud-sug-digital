import { useEffect, useState } from 'react';
import { listAdministrationSuggestions, reviewSuggestion } from '../../services/suggestionService';
import type { Suggestion } from '../../services/suggestionService';
import { Badge, Button, EmptyState, Field, Modal, PageHeader, Panel, PanelHead, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { timeAgo } from '../../utils/format';

const DECISIONS = [
  { key: 'accepted', label: 'Accept', variant: 'primary' as const },
  { key: 'implemented', label: 'Implemented', variant: 'ghost' as const },
  { key: 'declined', label: 'Decline', variant: 'dangerOutline' as const },
];

export default function SuggestionsPanel() {
  const toast = useToast();
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [modal, setModal] = useState<{ s: Suggestion; decision: typeof DECISIONS[number] } | null>(null);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { listAdministrationSuggestions().then(setItems); }, []);

  async function decide() {
    if (!modal) return;
    setBusy(true);
    try {
      await reviewSuggestion(modal.s.id, modal.decision.key as 'accepted' | 'implemented' | 'declined', response);
      toast(`Suggestion ${modal.decision.label.toLowerCase()}`);
      setModal(null); setResponse('');
      listAdministrationSuggestions().then(setItems);
    } catch (e: any) { toast(e.message ?? 'Failed', true); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Suggestions" subtitle="Student ideas for the Union — accept, implement, or decline with a response." />
      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No suggestions yet" description="Student suggestions for this administration will appear here." />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} suggestion${items.length > 1 ? 's' : ''}`} />
          {items.map((s) => (
            <div key={s.id} className="row">
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{s.reference_number}</span>
                  {s.is_anonymous && <span className="badge b-gray">Anonymous</span>}
                </div>
                <h4>{s.title}</h4>
                <p className="mut small" style={{ marginTop: 4 }}>{s.description}</p>
                <div className="meta"><span>{timeAgo(s.created_at)}</span>{s.response && <span>· {s.response}</span>}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge status={s.status} />
                {DECISIONS.map((d) => (
                  <Button key={d.key} size="sm" variant={d.variant}
                    onClick={() => { setModal({ s, decision: d }); setResponse(''); }}>
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={`${modal?.decision.label} — ${modal?.s.title ?? ''}`}
        desc="Your response (optional) will be visible to the student who submitted it."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
          <Button size="sm" disabled={busy} onClick={decide}>{busy ? 'Working…' : 'Confirm'}</Button>
        </>}>
        <Field label="Response">
          <TextArea rows={3} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Explain the decision…" />
        </Field>
      </Modal>
    </div>
  );
}