import { createSubmissionFlow } from './submissionFlow';

const flow = createSubmissionFlow({
  table: 'requests', historyTable: 'request_history', historyFk: 'request_id',
  officerFk: 'requested_by_officer_id',
  presidentLink: '/president/requests', excoLink: '/exco/requests',
});

export const listMyRequests = flow.listMine;
export const listAdministrationRequests = flow.listForAdministration;
export const submitRequest = flow.submit;
export const decideRequest = flow.decide;

export async function saveRequestDraft(input: {
  id?: string | null; title: string; category: string; description?: string; amount?: number | null;
}): Promise<string> {
  return flow.save({
    id: input.id,
    payload: {
      title: input.title.trim(),
      category: input.category,
      description: input.description?.trim() || null,
      amount: input.amount ?? null,
    },
  });
}

export const REQUEST_CATEGORY_LABELS: Record<string, string> = {
  funding: 'Funding Request', resource: 'Resource Request', event_approval: 'Event Approval',
  activity_approval: 'Activity Approval', announcement_approval: 'Announcement Approval',
  permission_request: 'Permission Request', project_proposal: 'Project Proposal',
  procurement: 'Procurement Request', welfare: 'Welfare', emergency: 'Emergency Request',
  administrative: 'Administrative Request', other: 'Other',
};