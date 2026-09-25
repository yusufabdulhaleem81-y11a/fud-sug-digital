import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { createCaseFlow, currentUserId, type CaseSummary, type CaseDetail } from './caseFlow';

export type { CaseSummary, CaseDetail };

const flow = createCaseFlow({
  table: 'reports', historyTable: 'report_history', historyFk: 'report_id',
  excoLink: '/exco/reports', presidentLink: '/president/reports', studentLink: '/student/reports',
});

export async function submitReport(input: {
  title: string; description: string; category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  matric_no?: string; faculty?: string; department?: string; phone?: string;
}) {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active. Please try again later.');
  const uid = await currentUserId();
  const { data, error } = await supabase.from('reports').insert({
    administration_id: admin.id,
    submitter_id: uid,
    is_anonymous: false,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    priority: input.priority ?? 'medium',
    matric_no: input.matric_no?.trim() || null,
    faculty: input.faculty?.trim() || null,
    department: input.department?.trim() || null,
    phone: input.phone?.trim() || null,
  }).select('id, reference_number').single();
  if (error) throw error;
  return data as { id: string; reference_number: string };
}

export const listMyReports = flow.listMine;
export const getReport = flow.get;
export const listAssignedReports = flow.listAssigned;
export const listAdministrationReports = flow.listForCurrentAdministration;
export const respondToReport = flow.respond;
export const requestReportInfo = flow.requestInfo;
export const escalateReport = flow.escalate;
export const interveneOnReport = flow.presidentialIntervention;
export const assignReportFollowUp = flow.assignFollowUp;
export const resolveReport = flow.resolve;
export const closeReport = flow.close;