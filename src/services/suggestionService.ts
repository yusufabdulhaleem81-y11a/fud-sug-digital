import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface Suggestion {
  id: string; reference_number: string; title: string; description: string;
  status: string; response: string | null; is_anonymous: boolean;
  submitter_id: string | null; created_at: string;
}

export async function submitSuggestion(input: { title: string; description: string; anonymous?: boolean }) {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active. Please try again later.');

  if (input.anonymous) {
    const tracking_code = 'TRK-' + crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    const { data, error } = await supabase.rpc('submit_anonymous_suggestion', {
      p_title: input.title.trim(), p_description: input.description.trim(), p_tracking_code: tracking_code,
    });
    if (error) throw error;
    const rows = data as { suggestion_id: string; reference_number: string; tracking_code: string }[];
    return rows[0];
  }

  const uid = await currentUserId();
  const { data, error } = await supabase.from('suggestions').insert({
    administration_id: admin.id, submitter_id: uid, is_anonymous: false,
    title: input.title.trim(), description: input.description.trim(),
  }).select('id, reference_number').single();
  if (error) throw error;
  return data as { id: string; reference_number: string };
}

export async function listMySuggestions(): Promise<Suggestion[]> {
  const uid = await currentUserId();
  const { data } = await supabase.from('suggestions').select('*')
    .eq('submitter_id', uid).order('created_at', { ascending: false });
  return (data as Suggestion[]) ?? [];
}

export async function listAdministrationSuggestions(): Promise<Suggestion[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('suggestions').select('*')
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as Suggestion[]) ?? [];
}

export async function reviewSuggestion(
  id: string, decision: 'accepted' | 'implemented' | 'declined', response: string,
) {
  const { error } = await supabase.from('suggestions')
    .update({ status: decision, response: response || null }).eq('id', id);
  if (error) throw error;
}