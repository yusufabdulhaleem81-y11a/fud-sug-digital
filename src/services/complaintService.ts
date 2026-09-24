import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { createCaseFlow, currentUserId, type CaseSummary, type CaseDetail } from './caseFlow';

export type { CaseSummary, CaseDetail };

const flow = createCaseFlow({
  table: 'complaints', historyTable: 'complaint_history', historyFk: 'complaint_id',
  excoLink: '/exco/complaints', presidentLink: '/president/complaints', studentLink: '/student/complaints',
});

export async function submitIdentifiedComplaint(input: {
  title?: string; description: string; category: string; against?: string;
}) {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active. Please try again later.');
  const uid = await currentUserId();
  const { data, error } = await supabase.from('complaints').insert({
    administration_id: admin.id,
    submitter_id: uid,
    is_anonymous: false,
    title: input.title?.trim() || null,
    description: input.description.trim(),
    category: input.category,
    against: input.against?.trim() || null,
  }).select('id, reference_number').single();
  if (error) throw error;
  return data as { id: string; reference_number: string };
}

export async function submitAnonymousComplaint(input: {
  title?: string; description: string; category: string; against?: string;
}) {
  const tracking_code = 'TRK-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  const { data, error } = await supabase.rpc('submit_anonymous_complaint', {
    p_category: input.category,
    p_title: input.title?.trim() ?? '',
    p_description: input.description.trim(),
    p_against: input.against?.trim() ?? '',
    p_tracking_code: tracking_code,
  });
  if (error) throw error;
  const rows = data as { complaint_id: string; reference_number: string; tracking_code: string }[];
  return rows[0];
}

export async function trackComplaint(reference: string, code: string) {
  const { data, error } = await supabase.rpc('track_complaint', {
    p_reference: reference.trim(), p_code: code.trim(),
  });
  if (error) throw error;
  const rows = data as { reference_number: string; status: string; title: string | null; updated_at: string }[];
  return rows[0] ?? null;
}

export const listMyComplaints = flow.listMine;
export const getComplaint = flow.get;
export const listAssignedComplaints = flow.listAssigned;
export const listAdministrationComplaints = flow.listForCurrentAdministration;
export const respondToComplaint = flow.respond;
export const requestComplaintInfo = flow.requestInfo;
export const escalateComplaint = flow.escalate;
export const interveneOnComplaint = flow.presidentialIntervention;
export const assignComplaintFollowUp = flow.assignFollowUp;
export const resolveComplaint = flow.resolve;
export const closeComplaint = flow.close;