import PortalDashboard from '../shared/PortalDashboard';
export default function AdminDashboard() {
  return <PortalDashboard links={[
    { to: '/admin/administrations', label: 'Administrations' },
    { to: '/admin/exco-management', label: 'EXCO Management' },
    { to: '/admin/positions', label: 'Positions', phase: 'Phase H' },
    { to: '/admin/directorates', label: 'Directorates', phase: 'Phase H' },
    { to: '/admin/routing', label: 'Report Routing Rules', phase: 'Phase B part 2' },
    { to: '/admin/verification', label: 'Verification Policy', phase: 'Phase B part 2' },
    { to: '/admin/audit-logs', label: 'Audit Logs', phase: 'Phase H' },
    { to: '/admin/settings', label: 'Institution Settings', phase: 'Phase H' },
  ]} />;
}