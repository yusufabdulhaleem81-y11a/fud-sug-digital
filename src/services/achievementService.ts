import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface Achievement {
  id: string; administration_id: string;
  title: string; description: string;
  category: string | null; achievement_date: string | null;
  impact: string | null; project_id: string | null;
  status: string; created_at: string;
  responsible_officer?: { display_name: string } | null;
}

const detailSelect = `*, responsible_officer:administration_officers(display_name)`;

export async function listAdministrationAchievements(): Promise<Achievement[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('achievements').select(detailSelect)
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as Achievement[]) ?? [];
}

export async function listPublishedAchievements(): Promise<any[]> {
  const { data } = await supabase.from('achievements')
    .select('*, administration:administrations(name, academic_session)')
    .eq('status', 'published').eq('visibility', 'public')
    .order('achievement_date', { ascending: false });
  return (data as any[]) ?? [];
}

export async function saveAchievement(input: {
  id?: string | null; title: string; description: string;
  category?: string; achievement_date?: string | null; impact?: string; project_id?: string | null;
}): Promise<string> {
  const payload = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category?.trim() || null,
    achievement_date: input.achievement_date || null,
    impact: input.impact?.trim() || null,
    project_id: input.project_id || null,
  };
  if (input.id) {
    const { error } = await supabase.from('achievements').update(payload).eq('id', input.id);
    if (error) throw error;
    return input.id;
  }
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active.');
  const { data, error } = await supabase.from('achievements').insert({
    administration_id: admin.id, status: 'draft', visibility: 'public', ...payload,
  }).select('id').single();
  if (error) throw error;
  return (data as any).id as string;
}

export async function submitAchievement(id: string): Promise<void> {
  const { error } = await supabase.from('achievements').update({ status: 'submitted' }).eq('id', id);
  if (error) throw error;
  const admin = await getCurrentAdministration();
  if (admin?.president_id) {
    const { data: a } = await supabase.from('achievements').select('title').eq('id', id).single();
    await supabase.from('notifications').insert({
      recipient_id: admin.president_id,
      title: `Achievement submitted: ${a?.title ?? ''}`,
      body: a?.title ?? '', type: 'achievement', link: '/president/achievements',
    });
  }
}

export async function reviewAchievement(id: string, status: 'under_review' | 'approved' | 'declined'): Promise<void> {
  const { error } = await supabase.from('achievements')
    .update({ status, reviewed_by: await currentUserId() }).eq('id', id);
  if (error) throw error;
}

export async function publishAchievement(id: string): Promise<void> {
  const { error } = await supabase.from('achievements')
    .update({ status: 'published', approved_by: await currentUserId() }).eq('id', id);
  if (error) throw error;
  await supabase.from('audit_logs').insert({
    actor_id: await currentUserId(),
    action: 'achievement.published', entity: 'achievements', entity_id: id,
  });
}