import { supabase } from '../lib/supabase';
import { getCurrentAdministration } from './administrationService';
import { currentUserId } from './caseFlow';

export async function myCurrentOfficerId(): Promise<string | null> {
  const admin = await getCurrentAdministration();
  const uid = await currentUserId();
  if (!admin) return null;
  const { data } = await supabase.from('administration_officers')
    .select('id').eq('user_id', uid).eq('administration_id', admin.id).eq('status', 'active').limit(1);
  return (data as any[])?.[0]?.id ?? null;
}

interface FlowConfig {
  table: 'requests' | 'proposals';
  historyTable: 'request_history' | 'proposal_history';
  historyFk: 'request_id' | 'proposal_id';
  officerFk: 'requested_by_officer_id' | 'proposed_by_officer_id';
  presidentLink: string;
  excoLink: string;
}

export function createSubmissionFlow(cfg: FlowConfig) {
  async function listMine(): Promise<any[]> {
    const officerId = await myCurrentOfficerId();
    if (!officerId) return [];
    const { data } = await supabase.from(cfg.table).select('*')
      .eq(cfg.officerFk, officerId).order('updated_at', { ascending: false });
    return data ?? [];
  }

  async function listForAdministration(): Promise<any[]> {
    const admin = await getCurrentAdministration();
    if (!admin) return [];
    const { data } = await supabase.from(cfg.table)
      .select('*, officer:administration_officers(display_name)')
      .eq('administration_id', admin.id).order('updated_at', { ascending: false });
    return data ?? [];
  }

  async function save(input: { id?: string | null; payload: Record<string, unknown> }): Promise<string> {
    if (input.id) {
      const { error } = await supabase.from(cfg.table).update(input.payload).eq('id', input.id);
      if (error) throw error;
      return input.id;
    }
    const admin = await getCurrentAdministration();
    const officerId = await myCurrentOfficerId();
    if (!admin || !officerId) throw new Error('You are not an officer in the current administration.');
    const { data, error } = await supabase.from(cfg.table).insert({
      administration_id: admin.id,
      [cfg.officerFk]: officerId,
      status: 'draft',
      ...input.payload,
    }).select('id').single();
    if (error) throw error;
    return (data as any).id as string;
  }

  async function logHistory(id: string, toStatus: string, note: string) {
    const uid = await currentUserId();
    await supabase.from(cfg.historyTable).insert({
      [cfg.historyFk]: id, actor_id: uid, action: toStatus, note,
    });
  }

  async function submit(id: string): Promise<void> {
    const { error } = await supabase.from(cfg.table).update({ status: 'submitted' }).eq('id', id);
    if (error) throw error;
    await logHistory(id, 'submitted', 'Submitted for presidential review.');
    const admin = await getCurrentAdministration();
    const { data: item } = await supabase.from(cfg.table).select('title').eq('id', id).single();
    if (admin?.president_id) {
      await supabase.from('notifications').insert({
        recipient_id: admin.president_id, title: `New submission: ${item?.title ?? ''}`,
        body: item?.title ?? '', type: 'submission', link: cfg.presidentLink,
      });
    }
  }

  async function decide(id: string, status: string, note: string): Promise<void> {
    const { error } = await supabase.from(cfg.table).update({
      status,
      ...(cfg.table === 'requests' ? { decision_note: note || null } : { review_note: note || null }),
      decided_by: await currentUserId(),
      decided_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw error;
    await logHistory(id, status, note || `Marked ${status.replace('_', ' ')}.`);
    const { data: item } = await supabase.from(cfg.table).select(`${cfg.officerFk}, title`).eq('id', id).single();
    if (item) {
      const officerId = (item as any)[cfg.officerFk];
      const { data: off } = await supabase.from('administration_officers').select('user_id').eq('id', officerId).single();
      if (off?.user_id) {
        await supabase.from('notifications').insert({
          recipient_id: off.user_id, title: `Your submission was ${status.replace('_', ' ')}`,
          body: note || item.title, type: 'submission', link: cfg.excoLink,
        });
      }
    }
  }

  return { listMine, listForAdministration, save, submit, decide };
}