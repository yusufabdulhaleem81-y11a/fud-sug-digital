import { supabase } from '../lib/supabase';

export interface InviteOfficerInput {
  administration_id: string;
  position_id: string;
  directorate_id?: string | null;
  full_name: string;
  display_name?: string;
  email: string;
  phone?: string;
  biography?: string;
  start_date?: string;
  profile_photo_url?: string;
}

export interface InviteOfficerResult {
  ok: boolean;
  officer_id: string;
  user_id: string;
  invited: boolean;
  temp_password: string | null;
}

export async function inviteOfficer(input: InviteOfficerInput): Promise<InviteOfficerResult> {
  const { data, error } = await supabase.functions.invoke('invite-officer', { body: input });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as InviteOfficerResult;
}

export async function getMyOfficerIds(): Promise<string[]> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return [];
  const { data: officers } = await supabase.from('administration_officers')
    .select('id').eq('user_id', data.user.id);
  return (officers ?? []).map((o) => o.id);
}