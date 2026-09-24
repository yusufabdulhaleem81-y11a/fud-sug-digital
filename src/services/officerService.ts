import { supabase } from '../lib/supabase';
import type { Administration, OfficerRecord, Position, Directorate } from '../types/models';

export interface CreateAdministrationInput {
  name: string;
  academic_session: string;
  start_date: string | null;
  end_date: string | null;
  theme: string | null;
  description: string | null;
  priorities: string[];
  status: Administration['status'];
}

export async function getCurrentAdministration(): Promise<Administration | null> {
  const { data } = await supabase
    .from('administrations').select('*').eq('status', 'current').maybeSingle();
  return (data as Administration) ?? null;
}

export async function listPublicAdministrations(): Promise<Administration[]> {
  const { data } = await supabase
    .from('administrations').select('*').eq('is_public', true).order('start_date', { ascending: false });
  return (data as Administration[]) ?? [];
}

export async function listAllAdministrations(): Promise<Administration[]> {
  const { data } = await supabase
    .from('administrations').select('*').order('start_date', { ascending: false });
  return (data as Administration[]) ?? [];
}

export async function getAdministrationBySession(session: string): Promise<Administration | null> {
  const { data } = await supabase
    .from('administrations').select('*').eq('academic_session', session).maybeSingle();
  return (data as Administration) ?? null;
}

export async function listOfficers(administrationId: string): Promise<OfficerRecord[]> {
  const { data } = await supabase
    .from('administration_officers')
    .select('*, position:positions(*), directorate:directorates(*)')
    .eq('administration_id', administrationId)
    .eq('display_in_archive', true)
    .order('rank', { referencedTable: 'positions', ascending: true });
  return (data as OfficerRecord[]) ?? [];
}

export async function listPositions(): Promise<Position[]> {
  const { data } = await supabase.from('positions').select('*').eq('is_active', true).order('rank');
  return (data as Position[]) ?? [];
}

export async function listDirectorates(): Promise<Directorate[]> {
  const { data } = await supabase.from('directorates').select('*').eq('is_active', true).order('name');
  return (data as Directorate[]) ?? [];
}

export async function createAdministration(input: CreateAdministrationInput): Promise<Administration> {
  const { data, error } = await supabase.from('administrations').insert(input).select().single();
  if (error) {
    if (error.message.includes('administrations_single_current'))
      throw new Error('Another administration is already marked "current". Complete/archive it first.');
    throw error;
  }
  await supabase.from('audit_logs').insert({
    action: 'administration.created', entity: 'administrations', entity_id: data.id,
    administration_id: data.id, metadata: { academic_session: input.academic_session },
  });
  return data as Administration;
}

export async function setAdministrationStatus(id: string, status: Administration['status']) {
  const { error } = await supabase.from('administrations').update({ status }).eq('id', id);
  if (error) {
    if (error.message.includes('administrations_single_current'))
      throw new Error('Another administration is already marked "current". Archive it first.');
    throw error;
  }
  await supabase.from('audit_logs').insert({
    action: 'administration.status_changed', entity: 'administrations', entity_id: id,
    administration_id: id, metadata: { to: status },
  });
}