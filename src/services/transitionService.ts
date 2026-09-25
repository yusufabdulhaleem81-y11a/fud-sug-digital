import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface HandoverSections {
  summary?: string; pending_tasks?: string; pending_projects?: string;
  pending_requests?: string; important_documents?: string; important_contacts?: string;
  procedures?: string; outstanding_issues?: string; recommendations?: string;
  assets?: string; ongoing_initiatives?: string;
}

export async function getHandover(): Promise<{ id: string; status: string; sections: HandoverSections; submitted_at: string | null } | null> {
  const admin = await getCurrentAdministration();
  if (!admin) return null;
  const { data } = await supabase.from('handover_records')
    .select('id, status, sections, submitted_at')
    .eq('from_administration_id', admin.id).maybeSingle();
  return (data as any) ?? null;
}

export async function saveHandover(sections: HandoverSections, id?: string | null): Promise<string> {
  if (id) {
    const { error } = await supabase.from('handover_records').update({ sections }).eq('id', id);
    if (error) throw error;
    return id;
  }
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active.');
  const { data, error } = await supabase.from('handover_records').insert({
    from_administration_id: admin.id,
    status: 'draft',
    sections,
    prepared_by: await currentUserId(),
  }).select('id').single();
  if (error) throw error;
  return (data as any).id as string;
}

export async function submitHandover(id: string): Promise<void> {
  const { error } = await supabase.from('handover_records')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}