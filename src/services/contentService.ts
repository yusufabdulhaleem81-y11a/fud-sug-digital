import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { myCurrentOfficerId } from './submissionFlow';

export interface Post {
  id: string; title: string; body: string; category: string | null;
  status: string; published_at: string | null; created_at: string;
  author_officer?: { display_name: string } | null;
}

export interface EventItem {
  id: string; title: string; description: string | null; location: string | null;
  starts_at: string | null; status: string; created_at: string;
}

/* ---------- POSTS ---------- */
export async function listPublishedPosts(): Promise<Post[]> {
  const { data } = await supabase.from('posts')
    .select('*, author_officer:administration_officers(display_name)')
    .eq('status', 'published').eq('visibility', 'public')
    .order('published_at', { ascending: false });
  return (data as Post[]) ?? [];
}

export async function listAdministrationPosts(): Promise<Post[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('posts')
    .select('*, author_officer:administration_officers(display_name)')
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as Post[]) ?? [];
}

export async function savePost(input: { id?: string | null; title: string; body: string; category?: string }): Promise<string> {
  const payload = { title: input.title.trim(), body: input.body.trim(), category: input.category || 'General' };
  if (input.id) {
    const { error } = await supabase.from('posts').update(payload).eq('id', input.id);
    if (error) throw error;
    return input.id;
  }
  const admin = await getCurrentAdministration();
  const officerId = await myCurrentOfficerId();
  if (!admin) throw new Error('No current administration is active.');
  const { data, error } = await supabase.from('posts').insert({
    administration_id: admin.id,
    author_officer_id: officerId,
    status: 'draft', visibility: 'public', ...payload,
  }).select('id').single();
  if (error) throw error;
  return (data as any).id as string;
}

export async function publishPost(id: string): Promise<void> {
  const { error } = await supabase.from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function unpublishPost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').update({ status: 'draft' }).eq('id', id);
  if (error) throw error;
}

/* ---------- EVENTS ---------- */
export async function listPublicEvents(): Promise<EventItem[]> {
  const { data } = await supabase.from('events').select('*')
    .eq('visibility', 'public').in('status', ['announced', 'ongoing', 'completed'])
    .order('starts_at', { ascending: true });
  return (data as EventItem[]) ?? [];
}

export async function listAdministrationEvents(): Promise<EventItem[]> {
  const admin = await getCurrentAdministration();
  if (!admin) return [];
  const { data } = await supabase.from('events').select('*')
    .eq('administration_id', admin.id).order('created_at', { ascending: false });
  return (data as EventItem[]) ?? [];
}

export async function saveEvent(input: {
  title: string; description?: string; location?: string; starts_at?: string;
}): Promise<void> {
  const admin = await getCurrentAdministration();
  if (!admin) throw new Error('No current administration is active.');
  const { error } = await supabase.from('events').insert({
    administration_id: admin.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    location: input.location?.trim() || null,
    starts_at: input.starts_at ? new Date(input.starts_at).toISOString() : null,
    status: 'planned', visibility: 'public',
  });
  if (error) throw error;
}

export async function announceEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').update({ status: 'announced' }).eq('id', id);
  if (error) throw error;
}