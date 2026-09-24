import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getComplaint, respondToComplaint, requestComplaintInfo, escalateComplaint,
  interveneOnComplaint, assignComplaintFollowUp, resolveComplaint, closeComplaint } from '../../services/complaintService';
import { getReport, respondToReport, requestReportInfo, escalateReport,
  interveneOnReport, assignReportFollowUp, resolveReport, closeReport } from '../../services/reportService';
import { getCurrentAdministration, listOfficers } from '../../services/administrationService';
import { getMyOfficerIds } from '../../services/officerService';
import type { CaseDetail } from '../../services/caseFlow';
import type { OfficerRecord } from '../../types/models';
import { Badge, Button, EmptyState, Field, MetaCell, MetaGrid, Modal, PageHeader, Panel, PanelBody, PanelHead, Select, TextArea, Timeline, useToast, type TlItem } from '../../components/ui';
import { fmtDT, timeAgo } from '../../utils/format';

interface Props { kind: 'report' | 'complaint'; mode: 'student' | 'exco' | 'president'; }

export default function CaseDetail({ kind, mode }: Props) {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [item, setItem] = useState<CaseDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [myOfficerIds, setMyOfficerIds] = useState<string[]>([]);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<null | { key: string; title: string; desc: string; submit: string }>(null);

  const svc = kind === 'report'
    ? { get: getReport, respond: respondToReport, requestInfo: requestReportInfo, escalate: escalateReport,
        intervene: interveneOnReport, assign: assignReportFollowUp, resolve: resolveReport, close: closeReport }
    : { get: getComplaint, respond: respondToComplaint, requestInfo: requestComplaintInfo, escalate: escalateComplaint,
        intervene: interveneOnComplaint, assign: assignComplaintFollowUp, resolve: resolveComplaint, close: closeComplaint };

  async function load() {
    try { setItem(await svc.get(id!)); } catch { setFailed(true); }
  }

  useEffect(() => {
    setFailed(false); setItem(null);
    load();
    if (mode !== 'student') {
      getMyOfficerIds().then(setMyOfficerIds);
      if (mode === 'president') {
        getCurrentAdministration().then((a) => a && listOfficers(a.id).then(setOfficers));
      }
    }
  }, [id, kind, mode]);

  const canWork = !!item && mode !== 'student' &&
    (mode === 'president' || (item.assigned_officer_id != null && myOfficerIds.includes(item.assigned_officer_id)));

  async function run(fn: () => Promise<void>, done: string) {
    setBusy(true);
    try { await fn(); setModal(null); setMessage(''); setAssignTo(''); toast(done); await load(); }
    catch (e: any) { toast(e.message ?? 'Action failed', true); }
    finally { setBusy(false); }
  }

  async function submitModal() {
    if (!modal || !item) return;
    switch (modal.key) {
      case 'respond': return run(() => svc.respond(item.id, message), 'Response added');
      case 'info': return run(() => svc.requestInfo(item.id, message), 'Information requested');
      case 'escalate': return run(() => svc.escalate(item.id, message), 'Escalated to the President');
      case 'resolve': return run(() => svc.resolve(item.id, message), 'Case resolved');
      case 'intervene': return run(() => svc.intervene(item.id, message), 'Intervention recorded');
      case 'assign': {
        const officer = officers.find((o) => o.id === assignTo);
        if (!officer) return;
        return run(() => svc.assign(item.id, officer.id, officer.display_name), 'Follow-up assigned');
      }
    }
  }

  if (failed) return <EmptyState title="Case not found" description="It may have been submitted in a different portal context, or you may not have access." />;

  const historyItems: TlItem[] = (item?.history ?? []).map((h) => ({
    title: h.action,
    by: h.actor?.full_name ?? 'System',
    time: timeAgo(h.created_at),
    message: h.note,
    tone: /escalat/i.test(h.action) ? 'red'
      : /resolved|assigned|intervention/i.test(h.action) ? 'grn'
      : /review|info/i.test(h.action) ? 'amb' : '',
  }));

  return (
    <div>
      <button className="tlink" style={{ background: 'none', border: 0, cursor: 'pointer', marginBottom: 14, padding: 0 }}
        onClick={() => navigate(-1)}>← Back</button>

      {item ? (
        <>
          <PageHeader title={item.title ?? 'Complaint'} subtitle={`Reference ${item.reference_number}`} right={<Badge status={item.status} />} />

          <MetaGrid>
            <MetaCell label="Category">{item.category ?? '—'}</MetaCell>
            <MetaCell label="Submitted">{fmtDT(item.created_at)}</MetaCell>
            <MetaCell label="Last update">{timeAgo(item.updated_at)}</MetaCell>
            <MetaCell label="Submitted by">{item.is_anonymous ? 'Anonymous' : 'Identified student'}</MetaCell>
            <MetaCell label="Assigned to">{item.assigned_officer
              ? `${item.assigned_officer.display_name}${item.assigned_officer.position ? ` — ${item.assigned_officer.position.title}` : ''}`
              : 'Unassigned'}</MetaCell>
            <MetaCell label="Against">{item.against ?? '—'}</MetaCell>
            <MetaCell label="Resolved">{item.resolved_at ? fmtDT(item.resolved_at) : '—'}</MetaCell>
            <MetaCell label="Resolution">{item.resolution ?? '—'}</MetaCell>
          </MetaGrid>

          <Panel>
            <PanelHead title="Description" />
            <PanelBody><p style={{ whiteSpace: 'pre-wrap' }}>{item.description}</p></PanelBody>
          </Panel>

          <Panel className="mt24">
            <PanelHead title="Case timeline" right={<span className="fine">Full audit trail — preserved permanently</span>} />
            <PanelBody>
              {historyItems.length === 0 ? <p className="mut small">No activity yet.</p> : <Timeline items={historyItems} />}
            </PanelBody>

            {canWork && (
              <div className="actbar">
                {mode === 'exco' ? (
                  <>
                    <Button size="sm" onClick={() => { setMessage(''); setModal({ key: 'respond', title: 'Add a response', desc: 'This response is recorded in the case timeline.', submit: 'Add response' }); }}>Respond</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setMessage(''); setModal({ key: 'info', title: 'Request information', desc: 'Ask for the details you need to act on this case.', submit: 'Send request' }); }}>Request info</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setMessage(''); setModal({ key: 'escalate', title: 'Escalate to the President', desc: 'Explain why this case needs presidential attention.', submit: 'Escalate' }); }}>Escalate</Button>
                    <Button size="sm" variant="danger" onClick={() => { setMessage(''); setModal({ key: 'resolve', title: 'Resolve case', desc: 'Describe the resolution given to the student.', submit: 'Resolve' }); }}>Resolve</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={() => { setMessage(''); setModal({ key: 'intervene', title: 'Presidential intervention', desc: 'Record your intervention — it becomes part of the permanent record.', submit: 'Record intervention' }); }}>Intervene</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setMessage(''); setModal({ key: 'assign', title: 'Assign follow-up', desc: 'Choose the officer who will see this case through to closure.', submit: 'Assign' }); }}>Assign follow-up</Button>
                    <Button size="sm" variant="danger" onClick={() => { setMessage(''); setModal({ key: 'resolve', title: 'Resolve case', desc: 'Describe the resolution.', submit: 'Resolve' }); }}>Resolve</Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => svc.close(item.id), 'Case closed')}>Close</Button>
                  </>
                )}
              </div>
            )}
          </Panel>
        </>
      ) : <div className="spin" />}

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.title ?? ''} desc={modal?.desc}
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
          <Button size="sm" disabled={busy || (modal?.key !== 'assign' && !message.trim())} onClick={submitModal}>
            {busy ? 'Working…' : modal?.submit}
          </Button>
        </>}>
        {modal?.key === 'assign' ? (
          <Field label="Officer">
            <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <option value="">Select an officer…</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>{o.display_name} — {o.position?.title}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Message">
            <TextArea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message…" />
          </Field>
        )}
      </Modal>
    </div>
  );
}