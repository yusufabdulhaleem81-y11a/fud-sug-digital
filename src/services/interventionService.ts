import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface Intervention {
  id: string;
  title: string;
  description: string | null;
  intervention_type: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  officer?: { display_name: string } | null;
}

export async function listInterventions(): Promise<Intervention[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('interventions')
    .select('*, officer:administration_officers(display_name)')
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as Intervention[]) ?? [];
}

export async function recordIntervention(input: {
  title: string; description?: string; intervention_type?: string; officer_id?: string | null;
}): Promise<void> {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active.');
  const { error } = await supabase.from('interventions').insert({
    administration_id: admin.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    intervention_type: input.intervention_type || 'other',
    officer_id: input.officer_id || null,
    started_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function completeIntervention(id: string): Promise<void> {
  const { error } = await supabase.from('interventions')
    .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}