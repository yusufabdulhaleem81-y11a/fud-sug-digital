import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export interface Task {
  id: string;
  administration_id: string;
  title: string;
  description: string | null;
  assigned_officer_id: string | null;
  directorate_id: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  assigned_officer: { display_name: string; position: { title: string } | null } | null;
}

export interface TaskInput {
  title: string;
  description?: string;
  assigned_officer_id?: string | null;
  directorate_id?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string | null;
}

const detailSelect = `*, assigned_officer:administration_officers(display_name, position:positions(title))`;

export async function listMyTasks(): Promise<Task[]> {
  const uid = await currentUserId();
  const { data: mine } = await supabase.from('administration_officers').select('id').eq('user_id', uid);
  const ids = (mine ?? []).map((o: any) => o.id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from('tasks').select(detailSelect)
    .in('assigned_officer_id', ids).order('updated_at', { ascending: false });
  return (data as Task[]) ?? [];
}

export async function listAdministrationTasks(): Promise<Task[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('tasks').select(detailSelect)
    .eq('administration_id', admin.id).order('updated_at', { ascending: false });
  return (data as Task[]) ?? [];
}

async function notifyOfficer(officerId: string, title: string, type: string, link: string) {
  const { data: off } = await supabase.from('administration_officers').select('user_id').eq('id', officerId).single();
  if (off?.user_id) {
    await supabase.from('notifications').insert({
      recipient_id: off.user_id, title, body: title, type, link,
    });
  }
}

export async function createTask(input: TaskInput): Promise<void> {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active.');
  const { error } = await supabase.from('tasks').insert({
    administration_id: admin.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    assigned_officer_id: input.assigned_officer_id || null,
    directorate_id: input.directorate_id || null,
    priority: input.priority ?? 'medium',
    deadline: input.deadline || null,
  });
  if (error) throw error;
  if (input.assigned_officer_id) {
    await notifyOfficer(input.assigned_officer_id, `New task assigned: ${input.title.trim()}`, 'task_assigned', '/exco/tasks');
  }
}

export async function updateTaskProgress(
  id: string,
  patch: { status?: string; progress?: number },
  note?: string,
): Promise<void> {
  const uid = await currentUserId();
  const { data: cur } = await supabase.from('tasks').select('status').eq('id', id).single();
  const { error } = await supabase.from('tasks').update({
    ...patch,
    ...(patch.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
  }).eq('id', id);
  if (error) throw error;
  const statusChanged = patch.status && patch.status !== cur?.status;
  await supabase.from('task_history').insert({
    task_id: id,
    actor_id: uid,
    action: statusChanged ? `Status changed to ${patch.status}` : 'Progress update',
    note: note || (patch.progress != null ? `Progress: ${patch.progress}%` : null),
  });
}