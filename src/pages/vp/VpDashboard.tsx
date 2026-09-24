import PortalDashboard from '../shared/PortalDashboard';
export default function VpDashboard() {
  return <PortalDashboard links={[
    { to: '/vp/tasks', label: 'Task Coordination', phase: 'Phase C' },
    { to: '/vp/reports', label: 'Reports Oversight' },
    { to: '/vp/directives', label: 'Directives', phase: 'Phase C' },
    { to: '/vp/escalations', label: 'Escalations', phase: 'Phase C' },
  ]} />;
}