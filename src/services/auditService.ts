
import { supabase } from '../lib/supabase';

export async function recordAudit(entry: {
  action: string; entity: string; entity_id?: string;
  administration_id?: string; metadata?: Record<string, unknown>;
}) {
  await supabase.from('audit_logs').insert(entry);
}