import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';

export interface Project {
  id: string; administration_id: string;
  title: string; description: string | null; category: string | null;
  directorate_id: string | null; responsible_officer_id: string | null;
  status: string; start_date: string | null;
  expected_completion_date: string | null; completion_date: string | null;
  budget: number | null; funding_source: string | null;
  outcome: string | null; impact: string | null; created_at: string;
  responsible_officer?: { display_name: string } | null;
  directorate?: { name: string } | null;
}

const detailSelect = `*, responsible_officer:administration_officers(display_name), directorate:directorates(name)`;

export async function listAdministrationProjects(): Promise<Project[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('projects').select(detailSelect)
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as Project[]) ?? [];
}

export async function listPublicProjects(): Promise<Project[]> {
  const { data } = await supabase.from('projects').select('*')
    .eq('visibility', 'public').neq('status', 'proposed')
    .order('created_at', { ascending: false });
  return (data as Project[]) ?? [];
}

export async function createProject(input: {
  title: string; description?: string; category?: string;
  directorate_id?: string | null; responsible_officer_id?: string | null;
  start_date?: string | null; expected_completion_date?: string | null;
  budget?: number | null; funding_source?: string;
}): Promise<void> {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active.');
  const { error } = await supabase.from('projects').insert({
    administration_id: admin.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    directorate_id: input.directorate_id || null,
    responsible_officer_id: input.responsible_officer_id || null,
    start_date: input.start_date || null,
    expected_completion_date: input.expected_completion_date || null,
    budget: input.budget ?? null,
    funding_source: input.funding_source?.trim() || null,
    status: 'approved',
    visibility: 'public',
  });
  if (error) throw error;
}

export async function setProjectStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('projects').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function completeProject(id: string, outcome: string, impact: string, completion_date: string | null): Promise<void> {
  const { error } = await supabase.from('projects').update({
    status: 'completed',
    outcome: outcome.trim(),
    impact: impact.trim() || null,
    completion_date: completion_date || new Date().toISOString().slice(0, 10),
  }).eq('id', id);
  if (error) throw error;
}