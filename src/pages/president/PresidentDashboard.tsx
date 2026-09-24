import PortalDashboard from '../shared/PortalDashboard';
export default function PresidentDashboard() {
  return <PortalDashboard links={[
    { to: '/president/exco-management', label: 'EXCO Management' },
    { to: '/president/administration', label: 'Administration' },
    { to: '/president/monthly-reports', label: 'Review Monthly Reports', phase: 'Phase C' },
    { to: '/president/requests', label: 'Requests', phase: 'Phase D' },
    { to: '/president/proposals', label: 'Proposals', phase: 'Phase D' },
    { to: '/president/projects', label: 'Projects', phase: 'Phase E' },
    { to: '/president/achievements', label: 'Achievements', phase: 'Phase E' },
    { to: '/president/transition', label: 'Transition & Handover', phase: 'Phase F' },
    { to: '/president/analytics', label: 'Analytics', phase: 'Phase H' },
  ]} />;
}