import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import type { Administration } from '../types/models';

async function count(table: string, adminId: string, extra?: { column: string; value: any }): Promise<number> {
  let q: any = supabase.from(table).select('*', { count: 'exact', head: true }).eq('administration_id', adminId);
  if (extra) q = q.eq(extra.column, extra.value);
  const { count } = await q;
  return count ?? 0;
}

export interface AdminStats {
  administration: Administration;
  reportsTotal: number; reportsResolved: number;
  complaintsTotal: number; complaintsResolved: number;
  suggestionsTotal: number; tasksTotal: number; tasksCompleted: number;
  projectsCompleted: number; achievementsPublished: number; officers: number;
}

export async function getAdministrationStats(): Promise<AdminStats | null> {
  const admin = await getCurrentAdministration();
  if (!admin) return null;
  const [reportsTotal, reportsResolved, complaintsTotal, complaintsResolved, suggestionsTotal,
         tasksTotal, tasksCompleted, projectsCompleted, achievementsPublished, officers] = await Promise.all([
    count('reports', admin.id),
    count('reports', admin.id, { column: 'status', value: 'resolved' }),
    count('complaints', admin.id),
    count('complaints', admin.id, { column: 'status', value: 'resolved' }),
    count('suggestions', admin.id),
    count('tasks', admin.id),
    count('tasks', admin.id, { column: 'status', value: 'completed' }),
    count('projects', admin.id, { column: 'status', value: 'completed' }),
    count('achievements', admin.id, { column: 'status', value: 'published' }),
    supabase.from('administration_officers').select('*', { count: 'exact', head: true })
      .eq('administration_id', admin.id).eq('status', 'active').then(({ count }) => count ?? 0),
  ]);
  return { administration: admin, reportsTotal, reportsResolved, complaintsTotal, complaintsResolved,
    suggestionsTotal, tasksTotal, tasksCompleted, projectsCompleted, achievementsPublished, officers };
}