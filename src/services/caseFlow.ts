import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';

export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? '';
}

export interface CaseSummary {
  id: string;
  reference_number: string;
  title: string | null;
  description: string;
  category: string | null;
  status: string;
  priority: string | null;
  is_anonymous: boolean;
  submitter_id: string | null;
  assigned_officer_id: string | null;
  administration_id: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface CaseHistoryEntry {
  id: string; action: string; note: string | null;
  from_status: string | null; to_status: string | null;
  created_at: string; actor: { full_name: string } | null;
}

export interface CaseDetail extends CaseSummary {
  against?: string | null;
  resolution: string | null;
  assigned_officer: { display_name: string; position: { title: string } | null } | null;
  history: CaseHistoryEntry[];
}

interface FlowConfig {
  table: 'reports' | 'complaints';
  historyTable: 'report_history' | 'complaint_history';
  historyFk: 'report_id' | 'complaint_id';
  excoLink: string;
  presidentLink: string;
  studentLink: string;
}

export function createCaseFlow(cfg: FlowConfig) {
  const detailSelect = `*, assigned_officer:administration_officers(display_name, position:positions(title)), history:${cfg.historyTable}(*, actor:profiles(full_name))`;

  async function listMine(): Promise<CaseSummary[]> {
    const uid = await currentUserId();
    const { data } = await supabase.from(cfg.table).select('*')
      .eq('submitter_id', uid).order('created_at', { ascending: false });
    return (data as CaseSummary[]) ?? [];
  }

  async function get(id: string): Promise<CaseDetail> {
    const { data, error } = await supabase.from(cfg.table).select(detailSelect).eq('id', id).single();
    if (error) throw error;
    const item = data as CaseDetail;
    item.history = (item.history ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
    return item;
  }

  async function listAssigned(): Promise<CaseSummary[]> {
    const uid = await currentUserId();
    const { data: mine } = await supabase.from('administration_officers').select('id').eq('user_id', uid);
    const ids = (mine ?? []).map((o) => o.id);
    if (ids.length === 0) return [];
    const { data } = await supabase.from(cfg.table).select('*')
      .in('assigned_officer_id', ids).order('updated_at', { ascending: false });
    return (data as CaseSummary[]) ?? [];
  }

  async function listForCurrentAdministration(): Promise<CaseSummary[]> {
    const admin = await getCurrentAdministration();
    if (!admin) return [];
    const { data } = await supabase.from(cfg.table).select('*')
      .eq('administration_id', admin.id).order('updated_at', { ascending: false });
    return (data as CaseSummary[]) ?? [];
  }

  async function logHistory(action: string, id: string, note: string, from: string | null, to: string | null) {
    await supabase.from(cfg.historyTable).insert({
      [cfg.historyFk]: id, action, note, from_status: from, to_status: to,
    });
  }

  async function fetchStatus(id: string): Promise<string> {
    const { data } = await supabase.from(cfg.table).select('status').eq('id', id).single();
    return (data?.status as string) ?? '';
  }

  async function setStatus(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(cfg.table).update(patch).eq('id', id);
    if (error) throw error;
  }

  async function notifyPresident(administrationId: string, title: string) {
    const { data: admin } = await supabase.from('administrations')
      .select('president_id').eq('id', administrationId).single();
    if (admin?.president_id) {
      await supabase.from('notifications').insert({
        recipient_id: admin.president_id, title, body: title,
        type: 'case_escalated', link: cfg.presidentLink,
      });
    }
  }

  async function notifyAssignee(officerId: string, title: string) {
    const { data: off } = await supabase.from('administration_officers')
      .select('user_id').eq('id', officerId).single();
    if (off?.user_id) {
      await supabase.from('notifications').insert({
        recipient_id: off.user_id, title, body: title, type: 'case_update', link: cfg.excoLink,
      });
    }
  }

  async function respond(id: string, message: string) {
    const from = await fetchStatus(id);
    const to = ['submitted', 'assigned', 'info_requested'].includes(from) ? 'under_review' : from;
    if (to !== from) await setStatus(id, { status: to });
    await logHistory('Response added', id, message, from, to);
  }

  async function requestInfo(id: string, question: string) {
    const from = await fetchStatus(id);
    await setStatus(id, { status: 'info_requested' });
    await logHistory('Info requested', id, question, from, 'info_requested');
  }

  async function escalate(id: string, reason: string) {
    const { data: item } = await supabase.from(cfg.table)
      .select('status, title, administration_id').eq('id', id).single();
    if (!item) throw new Error('Case not found');
    await setStatus(id, { status: 'escalated' });
    await logHistory('Escalated to the President', id, reason, item.status, 'escalated');
    await notifyPresident(item.administration_id, `Escalated: ${item.title ?? 'Complaint'}`);
  }

  async function presidentialIntervention(id: string, message: string) {
    const from = await fetchStatus(id);
    await setStatus(id, { status: 'presidential_review' });
    await logHistory('Presidential intervention', id, message, from, 'presidential_review');
  }

  async function assignFollowUp(id: string, officerId: string, officerName: string) {
    const from = await fetchStatus(id);
    await setStatus(id, { assigned_officer_id: officerId, status: 'under_review' });
    await logHistory('Follow-up assigned', id,
      `Follow-up assigned to ${officerName} for supervision and closure.`, from, 'under_review');
    await notifyAssignee(officerId, 'Follow-up assigned to you');
  }

  async function resolve(id: string, resolution: string) {
    const from = await fetchStatus(id);
    await setStatus(id, { status: 'resolved', resolution, resolved_at: new Date().toISOString() });
    await logHistory('Resolved', id, resolution, from, 'resolved');
    const { data: item } = await supabase.from(cfg.table).select('submitter_id').eq('id', id).single();
    if (item?.submitter_id) {
      await supabase.from('notifications').insert({
        recipient_id: item.submitter_id, title: 'Your case was resolved',
        body: resolution, type: 'case_resolved', link: cfg.studentLink,
      });
    }
  }

  async function close(id: string) {
    const from = await fetchStatus(id);
    await setStatus(id, { status: 'closed' });
    await logHistory('Closed', id, 'Case closed.', from, 'closed');
  }

  return {
    listMine, get, listAssigned, listForCurrentAdministration,
    respond, requestInfo, escalate, presidentialIntervention, assignFollowUp, resolve, close,
  };
}