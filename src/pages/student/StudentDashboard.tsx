import PortalDashboard from '../shared/PortalDashboard';
export default function StudentDashboard() {
  return <PortalDashboard links={[
    { to: '/student/reports', label: 'My Reports' },
    { to: '/student/complaints', label: 'My Complaints' },
    { to: '/student/suggestions', label: 'Suggestions' },
    { to: '/student/notifications', label: 'Notifications', phase: 'Phase G' },
    { to: '/student/events', label: 'Events', phase: 'Phase E' },
    { to: '/student/profile', label: 'My Profile', phase: 'Phase G' },
  ]} />;
}