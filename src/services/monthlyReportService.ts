import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface MonthlyReportContent {
  summary?: string;
  activities?: string;
  challenges?: string;
  next_month?: string;
}

export interface MonthlyReport {
  id: string;
  officer_id: string;
  period_year: number;
  period_month: number;
  title: string;
  content: MonthlyReportContent;
  status: string;
  review_note: string | null;
  submitted_at: string | null;
  updated_at: string;
  officer?: { display_name: string; position: { title: string } | null } | null;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const monthName = (m: number) => MONTH_NAMES[m - 1] ?? String(m);

async function myCurrentOfficerId(): Promise<string | null> {
  const admin = await getCurrentAdministration();
  const uid = await currentUserId();
  if (!admin) return null;
  const { data } = await supabase.from('administration_officers')
    .select('id').eq('user_id', uid).eq('administration_id', admin.id).eq('status', 'active').limit(1);
  return (data as any[])?.[0]?.id ?? null;
}

export async function listMyMonthlyReports(): Promise<MonthlyReport[]> {
  const officerId = await myCurrentOfficerId();
  if (!officerId) return [];
  const { data } = await supabase.from('monthly_reports').select('*')
    .eq('officer_id', officerId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  return (data as MonthlyReport[]) ?? [];
}

export async function listAdministrationMonthlyReports(): Promise<MonthlyReport[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('monthly_reports')
    .select('*, officer:administration_officers(display_name, position:positions(title))')
    .eq('administration_id', admin.id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  return (data as MonthlyReport[]) ?? [];
}

export async function saveMyReport(input: {
  id?: string | null; year: number; month: number; title: string; content: MonthlyReportContent;
}): Promise<string> {
  if (input.id) {
    const { error } = await supabase.from('monthly_reports')
      .update({ title: input.title, content: input.content }).eq('id', input.id);
    if (error) throw error;
    return input.id;
  }
  const admin = await getCurrentAdministration();
  const officerId = await myCurrentOfficerId();
  if (!admin || !officerId) throw new Error('You are not an officer in the current administration.');
  const { data, error } = await supabase.from('monthly_reports').insert({
    administration_id: admin.id,
    officer_id: officerId,
    period_year: input.year,
    period_month: input.month,
    title: input.title,
    content: input.content,
    status: 'draft',
  }).select('id').single();
  if (error) throw error;
  return (data as any).id as string;
}

async function logHistory(reportId: string, toStatus: string, note: string) {
  const uid = await currentUserId();
  await supabase.from('monthly_report_history').insert({
    monthly_report_id: reportId, actor_id: uid, action: toStatus, note,
  });
}

export async function submitMonthlyReport(id: string): Promise<void> {
  const { data: cur } = await supabase.from('monthly_reports').select('status, title').eq('id', id).single();
  const next = cur?.status === 'changes_requested' ? 'resubmitted' : 'submitted';
  const { error } = await supabase.from('monthly_reports')
    .update({ status: next, submitted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logHistory(id, next, 'Report submitted for review.');
  const admin = await getCurrentAdministration();
  if (admin?.president_id) {
    await supabase.from('notifications').insert({
      recipient_id: admin.president_id,
      title: `Monthly report submitted: ${cur?.title ?? ''}`,
      body: cur?.title ?? '', type: 'monthly_report', link: '/president/monthly-reports',
    });
  }
}

export async function reviewMonthlyReport(
  id: string,
  decision: 'under_review' | 'acknowledged' | 'changes_requested',
  note: string,
): Promise<void> {
  const uid = await currentUserId();
  const { error } = await supabase.from('monthly_reports').update({
    status: decision,
    review_note: note || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: uid,
  }).eq('id', id);
  if (error) throw error;
  await logHistory(id, decision, note || `Report ${decision.replace('_', ' ')}.`);
  const { data: rep } = await supabase.from('monthly_reports').select('officer_id, title').eq('id', id).single();
  if (rep?.officer_id) {
    const { data: off } = await supabase.from('administration_officers').select('user_id').eq('id', rep.officer_id).single();
    if (off?.user_id) {
      await supabase.from('notifications').insert({
        recipient_id: off.user_id,
        title: `Monthly report ${decision.replace('_', ' ')}`,
        body: note || rep.title, type: 'monthly_report', link: '/exco/monthly-reports',
      });
    }
  }
}