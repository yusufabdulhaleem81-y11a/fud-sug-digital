import { useEffect, useState } from 'react';
import {
  listAdministrationMonthlyReports, listMyMonthlyReports, monthName,
  reviewMonthlyReport, saveMyReport, submitMonthlyReport,
  type MonthlyReport, type MonthlyReportContent,
} from '../../services/monthlyReportService';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Panel, PanelBody, PanelHead, Select, SkeletonRows, TextArea, useToast } from '../../components/ui';
import { fmtDT, timeAgo } from '../../utils/format';

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const EDITABLE = ['draft', 'changes_requested'];

export default function MonthlyReportsPanel({ mode }: { mode: 'officer' | 'president' }) {
  const toast = useToast();
  const [mine, setMine] = useState<MonthlyReport[] | null>(null);
  const [all, setAll] = useState<MonthlyReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    id: null as string | null, year: new Date().getFullYear(), month: new Date().getMonth() + 1,
    title: '', summary: '', activities: '', challenges: '', next_month: '',
  });
  const [review, setReview] = useState<MonthlyReport | null>(null);
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'acknowledged' | 'changes_requested' | 'under_review'>('acknowledged');

  async function load() {
    if (mode === 'officer') setMine(await listMyMonthlyReports());
    else setAll(await listAdministrationMonthlyReports());
  }
  useEffect(() => { load(); }, [mode]);

  const current = mine?.find((r) => r.id === form.id);
  const editable = !form.id || (current ? EDITABLE.includes(current.status) : true);

  function loadIntoEditor(r: MonthlyReport) {
    setForm({
      id: r.id, year: r.period_year, month: r.period_month, title: r.title,
      summary: r.content?.summary ?? '', activities: r.content?.activities ?? '',
      challenges: r.content?.challenges ?? '', next_month: r.content?.next_month ?? '',
    });
  }

  function onPeriodChange(year: number, month: number) {
    const existing = mine?.find((r) => r.period_year === year && r.period_month === month);
    if (existing) loadIntoEditor(existing);
    else setForm({ id: null, year, month, title: '', summary: '', activities: '', challenges: '', next_month: '' });
  }

  async function onSave() {
    setBusy(true);
    try {
      const content: MonthlyReportContent = {
        summary: form.summary, activities: form.activities,
        challenges: form.challenges, next_month: form.next_month,
      };
      const id = await saveMyReport({
        id: form.id, year: form.year, month: form.month,
        title: form.title.trim() || `${monthName(form.month)} ${form.year} report`, content,
      });
      setForm({ ...form, id });
      toast('Draft saved');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function onSubmit() {
    if (!form.id) { toast('Save the draft first', true); return; }
    setBusy(true);
    try {
      await submitMonthlyReport(form.id);
      toast('Report submitted to the President');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  async function onReview() {
    if (!review) return;
    setBusy(true);
    try {
      await reviewMonthlyReport(review.id, decision, note);
      toast(`Report ${decision.replace('_', ' ')}`);
      setReview(null); setNote('');
      await load();
    } catch (e: any) { toast(e.message ?? 'Failed', true); } finally { setBusy(false); }
  }

  if (mode === 'officer') {
    return (
      <div>
        <PageHeader title="Monthly Reports"
          subtitle="Your monthly report to the President — save drafts, submit, and resubmit after changes are requested." />

        <Panel className="mb24">
          <PanelHead
            title={form.id ? 'Editing report' : 'New report'}
            right={current ? <Badge status={current.status} /> : <Badge status="draft" />}
          />
          <PanelBody>
            <div className="fx" style={{ gap: 12 }}>
              <Field label="Year">
                <Select value={form.year} onChange={(e) => onPeriodChange(Number(e.target.value), form.month)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
              <Field label="Month">
                <Select value={form.month} onChange={(e) => onPeriodChange(form.year, Number(e.target.value))}>
                  {MONTHS.map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Title">
              <Input value={form.title} disabled={!editable}
                placeholder={`${monthName(form.month)} ${form.year} report`}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Summary of the month">
              <TextArea rows={2} disabled={!editable} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </Field>
            <Field label="Key activities">
              <TextArea rows={3} disabled={!editable} value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} />
            </Field>
            <Field label="Challenges">
              <TextArea rows={2} disabled={!editable} value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
            </Field>
            <Field label="Plans for next month">
              <TextArea rows={2} disabled={!editable} value={form.next_month} onChange={(e) => setForm({ ...form, next_month: e.target.value })} />
            </Field>
            {current?.review_note && <div className="banner">Presidential review: {current.review_note}</div>}
            <div className="fx">
              <Button size="sm" disabled={busy || !editable} onClick={onSave}>{busy ? 'Saving…' : 'Save draft'}</Button>
              <Button size="sm" variant="danger" disabled={busy || !form.id || !editable} onClick={onSubmit}>
                {current?.status === 'changes_requested' ? 'Resubmit' : 'Submit to President'}
              </Button>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="My submissions" />
          {mine === null ? <div className="spin" /> : mine.length === 0 ? (
            <PanelBody><p className="mut small">No reports yet — create your first one above.</p></PanelBody>
          ) : mine.map((r) => (
            <div key={r.id} className="row" style={{ cursor: 'pointer' }} onClick={() => loadIntoEditor(r)}>
              <div className="row-main">
                <div className="row-top"><span className="ref">{monthName(r.period_month)} {r.period_year}</span></div>
                <h4>{r.title}</h4>
                <div className="meta"><span>Updated {timeAgo(r.updated_at)}</span>{r.review_note && <span>· {r.review_note}</span>}</div>
              </div>
              <Badge status={r.status} />
            </div>
          ))}
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Monthly Reports" subtitle="Review EXCO monthly reports — acknowledge, or request changes." />
      {all === null ? <SkeletonRows /> : all.length === 0 ? (
        <EmptyState title="No reports yet" description="EXCO monthly reports will appear here once submitted." />
      ) : (
        <Panel>
          <PanelHead title={`${all.length} report${all.length > 1 ? 's' : ''}`} />
          {all.map((r) => (
            <div key={r.id} className="row">
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{monthName(r.period_month)} {r.period_year}</span>
                  {r.officer && <span className="badge b-mint">{r.officer.display_name}</span>}
                </div>
                <h4>{r.title}</h4>
                <div className="meta"><span>{r.submitted_at ? `Submitted ${fmtDT(r.submitted_at)}` : 'Not submitted'}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge status={r.status} />
                {['submitted', 'under_review', 'resubmitted'].includes(r.status) && (
                  <Button size="sm" onClick={() => { setReview(r); setNote(''); setDecision('acknowledged'); }}>Review</Button>
                )}
              </div>
            </div>
          ))}
        </Panel>
      )}

      <Modal open={!!review} onClose={() => setReview(null)}
        title={`Review: ${review?.title ?? ''}`}
        desc="The officer is notified of your decision immediately."
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setReview(null)}>Cancel</Button>
          <Button size="sm" disabled={busy} onClick={onReview}>{busy ? 'Saving…' : 'Send decision'}</Button>
        </>}>
        {review && (
          <>
            <div className="panel" style={{ marginBottom: 16 }}>
              <PanelBody>
                <p className="small"><b>Summary:</b> {review.content?.summary || '—'}</p>
                <p className="small"><b>Activities:</b> {review.content?.activities || '—'}</p>
                <p className="small"><b>Challenges:</b> {review.content?.challenges || '—'}</p>
                <p className="small"><b>Next month:</b> {review.content?.next_month || '—'}</p>
              </PanelBody>
            </div>
            <Field label="Decision">
              <Select value={decision} onChange={(e) => setDecision(e.target.value as any)}>
                <option value="under_review">Mark under review</option>
                <option value="acknowledged">Acknowledge</option>
                <option value="changes_requested">Request changes</option>
              </Select>
            </Field>
            <Field label="Note to the officer">
              <TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain the decision…" />
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}