import { supabase } from '../lib/supabase';
import type { Profile } from '../types/models';

export async function signIn(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const userId = data.session!.user.id;
  const { data: profile, error: pErr } = await supabase
    .from('profiles').select('*').eq('id', userId).single();
  if (pErr) throw pErr;
  if (!profile.is_active) throw new Error('This account has been deactivated. Contact the SUG administrator.');
  return profile as Profile;
}

export async function registerStudent(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}