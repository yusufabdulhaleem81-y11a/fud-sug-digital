import PortalDashboard from '../shared/PortalDashboard';
export default function ExcoDashboard() {
  return <PortalDashboard links={[
    { to: '/exco/tasks', label: 'My Tasks', phase: 'Phase C' },
    { to: '/exco/monthly-reports', label: 'Monthly Reports', phase: 'Phase C' },
    { to: '/exco/requests', label: 'Requests to President', phase: 'Phase D' },
    { to: '/exco/proposals', label: 'Proposals', phase: 'Phase D' },
    { to: '/exco/reports', label: 'Student Reports' },
    { to: '/exco/documents', label: 'Documents', phase: 'Phase G' },
  ]} />;
}