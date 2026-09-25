import { useEffect, useState, type FormEvent } from 'react';
import { completeIntervention, listInterventions, recordIntervention, type Intervention } from '../../services/interventionService';
import { getCurrentAdministration, listOfficers } from '../../services/administrationService';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Panel, PanelHead, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import type { OfficerRecord } from '../../types/models';
import { fmtDate } from '../../utils/format';

const TYPES = ['welfare', 'academic', 'emergency', 'infrastructure', 'other'];

export default function InterventionsPanel() {
  const toast = useToast();
  const [items, setItems] = useState<Intervention[] | null>(null);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', intervention_type: 'welfare', description: '', officer_id: '' });

  async function load() {
    setItems(await listInterventions());
  }
  useEffect(() => {
    load();
    getCurrentAdministration().then((a) => a && listOfficers(a.id).then(setOfficers));
  }, []);

  async function onRecord(e: FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await recordIntervention({
        title: form.title, description: form.description,
        intervention_type: form.intervention_type, officer_id: form.officer_id || null,
      });
      toast('Intervention recorded');
      setShowNew(false);
      setForm({ title: '', intervention_type: 'welfare', description: '', officer_id: '' });
      await load();
    } catch (err: any) { toast(err.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Interventions"
        subtitle="Presidential interventions on student matters — permanently recorded as part of the administration's record."
        right={<Button size="sm" onClick={() => setShowNew(true)}>+ Record intervention</Button>}
      />
      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No interventions recorded"
          description="Record welfare, academic, emergency and infrastructure interventions here." />
      ) : (
        <Panel>
          <PanelHead title={`${items.length} intervention${items.length > 1 ? 's' : ''}`} />
          {items.map((v) => (
            <div key={v.id} className="row">
              <div className="row-main">
                <div className="row-top">
                  <Badge tone={v.status === 'completed' ? 'green' : 'gold'}>{v.status}</Badge>
                  <span className="cattag">{v.intervention_type}</span>
                  {v.officer && <span className="badge b-mint">{v.officer.display_name}</span>}
                </div>
                <h4>{v.title}</h4>
                {v.description && <p className="mut small" style={{ marginTop: 4 }}>{v.description}</p>}
                <div className="meta"><span>{fmtDate(v.created_at)}</span></div>
              </div>
              {v.status !== 'completed' && (
                <Button size="sm" variant="ghost" disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try { await completeIntervention(v.id); toast('Marked completed'); await load(); }
                    catch (e: any) { toast(e.message ?? 'Failed', true); }
                    finally { setBusy(false); }
                  }}>Mark completed</Button>
              )}
            </div>
          ))}
        </Panel>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Record intervention"
        desc="Interventions become part of the administration's permanent public record."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button size="sm" disabled={busy || !form.title.trim()} onClick={onRecord}>{busy ? 'Saving…' : 'Record'}</Button>
        </>}>
        <Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Type">
          <Select value={form.intervention_type} onChange={(e) => setForm({ ...form, intervention_type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Description"><TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Supervising officer (optional)">
          <Select value={form.officer_id} onChange={(e) => setForm({ ...form, officer_id: e.target.value })}>
            <option value="">None</option>
            {officers.map((o) => <option key={o.id} value={o.id}>{o.display_name} — {o.position?.title}</option>)}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}