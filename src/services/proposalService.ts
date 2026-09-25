import { createSubmissionFlow } from './submissionFlow';

const flow = createSubmissionFlow({
  table: 'proposals', historyTable: 'proposal_history', historyFk: 'proposal_id',
  officerFk: 'proposed_by_officer_id',
  presidentLink: '/president/proposals', excoLink: '/exco/proposals',
});

export interface ProposalContent {
  problem?: string; solution?: string; objectives?: string; benefits?: string;
  implementation?: string; resources?: string; budget?: string; risks?: string; timeline?: string;
}

export const listMyProposals = flow.listMine;
export const listAdministrationProposals = flow.listForAdministration;
export const submitProposal = flow.submit;
export const decideProposal = flow.decide;

export async function saveProposalDraft(input: {
  id?: string | null; title: string; content: ProposalContent;
}): Promise<string> {
  return flow.save({ id: input.id, payload: { title: input.title.trim(), content: input.content } });
}