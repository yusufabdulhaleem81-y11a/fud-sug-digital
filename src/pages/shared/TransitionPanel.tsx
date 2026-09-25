import { useEffect, useState } from 'react';
import { getHandover, saveHandover, submitHandover, type HandoverSections } from '../../services/transitionService';
import { Badge, Button, Field, PageHeader, Panel, PanelBody, PanelHead, TextArea, useToast } from '../../components/ui';

const SECTIONS: { key: keyof HandoverSections; label: string }[] = [
  { key: 'summary', label: 'Summary of the administration' },
  { key: 'pending_tasks', label: 'Pending tasks' },
  { key: 'pending_projects', label: 'Ongoing / uncompleted projects' },
  { key: 'pending_requests', label: 'Pending requests & proposals' },
  { key: 'important_documents', label: 'Important documents' },
  { key: 'important_contacts', label: 'Important contacts' },
  { key: 'procedures', label: 'Institutional procedures' },
  { key: 'outstanding_issues', label: 'Outstanding issues' },
  { key: 'recommendations', label: 'Recommendations for the next administration' },
  { key: 'assets', label: 'Assets & resources' },
  { key: 'ongoing_initiatives', label: 'Ongoing initiatives' },
];

export default function TransitionPanel() {
  const toast = useToast();
  const [id, setId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getHandover().then((h) => {
      if (h) {
        setId(h.id); setStatus(h.status);
        const filled: Record<string, string> = {};
        SECTIONS.forEach((s) => { filled[s.key] = (h.sections as any)?.[s.key] ?? ''; });
        setSections(filled);
      }
    });
  }, []);

  async function onSave() {
    setBusy(true);
    try {
      const newId = await saveHandover(sections as HandoverSections, id);
      setId(newId);
      toast('Handover draft saved');
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function onSubmit() {
    if (!id) { toast('Save the draft first', true); return; }
    setBusy(true);
    try { await submitHandover(id); setStatus('submitted'); toast('Handover submitted — part of the permanent archive'); }
    catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Transition & Handover"
        subtitle="Prepare the official handover for the next administration — this record is preserved permanently."
        right={status ? <Badge status={status} /> : undefined} />
      <Panel>
        <PanelHead title="Handover record" right={<span className="fine">Every field becomes part of the institutional archive</span>} />
        <PanelBody>
          {SECTIONS.map((s) => (
            <Field key={s.key} label={s.label}>
              <TextArea rows={3} value={sections[s.key] ?? ''} disabled={status === 'submitted'}
                onChange={(e) => setSections({ ...sections, [s.key]: e.target.value })} />
            </Field>
          ))}
          {status !== 'submitted' && (
            <div className="fx">
              <Button size="sm" disabled={busy} onClick={onSave}>{busy ? 'Saving…' : 'Save draft'}</Button>
              <Button size="sm" variant="danger" disabled={busy || !id} onClick={onSubmit}>Submit handover</Button>
            </div>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}