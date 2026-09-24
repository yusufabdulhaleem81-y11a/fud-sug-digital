import { supabase } from '../lib/supabase';

export interface Notification {
  id: string; title: string; body: string | null; type: string | null;
  link: string | null; is_read: boolean; created_at: string;
}

export async function listNotifications(): Promise<Notification[]> {
  const { data } = await supabase.from('notifications').select('*')
    .order('created_at', { ascending: false }).limit(30);
  return (data as Notification[]) ?? [];
}

export async function unreadNotificationCount(): Promise<number> {
  const { count } = await supabase.from('notifications')
    .select('*', { count: 'exact', head: true }).eq('is_read', false);
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
}