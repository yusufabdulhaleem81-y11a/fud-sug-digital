import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface Directive {
  id: string;
  title: string;
  instruction: string;
  priority: string;
  deadline: string | null;
  status: string;
  acknowledged_at: string | null;
  completed_at: string | null;
  created_at: string;
  directed_officer: { display_name: string; position: { title: string } | null } | null;
}

export interface DirectiveInput {
  title: string;
  instruction: string;
  directed_officer_id?: string | null;
  directed_directorate_id?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string | null;
}

const detailSelect = `*, directed_officer:administration_officers(display_name, position:positions(title))`;

async function myOfficerIds(): Promise<string[]> {
  const uid = await currentUserId();
  const { data } = await supabase.from('administration_officers').select('id').eq('user_id', uid);
  return (data as any[])?.map((o) => o.id) ?? [];
}

export async function listMyDirectives(): Promise<Directive[]> {
  const ids = await myOfficerIds();
  if (ids.length === 0) return [];
  const { data } = await supabase.from('directives').select(detailSelect)
    .in('directed_officer_id', ids).order('created_at', { ascending: false });
  return (data as Directive[]) ?? [];
}

export async function listAdministrationDirectives(): Promise<Directive[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('directives').select(detailSelect)
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as Directive[]) ?? [];
}

export async function issueDirective(input: DirectiveInput): Promise<void> {
  const admin = await getCurrentAdministration();
  const uid = await currentUserId();
  if (!admin) throw new Error('No current administration is active.');
  const { error } = await supabase.from('directives').insert({
    administration_id: admin.id,
    issued_by: uid,
    title: input.title.trim(),
    instruction: input.instruction.trim(),
    directed_officer_id: input.directed_officer_id || null,
    directed_directorate_id: input.directed_directorate_id || null,
    priority: input.priority ?? 'medium',
    deadline: input.deadline || null,
  });
  if (error) throw error;
  if (input.directed_officer_id) {
    const { data: off } = await supabase.from('administration_officers').select('user_id').eq('id', input.directed_officer_id).single();
    if (off?.user_id) {
      await supabase.from('notifications').insert({
        recipient_id: off.user_id,
        title: `Presidential directive: ${input.title.trim()}`,
        body: input.instruction.slice(0, 80), type: 'directive', link: '/exco/directives',
      });
    }
  }
}

export async function acknowledgeDirective(id: string): Promise<void> {
  const { error } = await supabase.from('directives')
    .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function completeDirective(id: string): Promise<void> {
  const { error } = await supabase.from('directives')
    .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}