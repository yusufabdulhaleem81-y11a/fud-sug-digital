import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCurrentAdministration } from '../hooks/useCurrentAdministration';
import { PORTAL_LABEL } from '../lib/routing';
import { unreadNotificationCount } from '../services/notificationService';
import { Avatar, Button, Icon } from '../components/ui';

type Portal = 'student' | 'exco' | 'vp' | 'president' | 'admin';
interface NavGroup { label?: string; items: { to: string; label: string }[] }

const NAV: Record<Portal, NavGroup[]> = {
  student: [
    { items: [
      { to: '/student/dashboard', label: 'Dashboard' }, { to: '/student/reports', label: 'My Reports' },
      { to: '/student/complaints', label: 'My Complaints' }, { to: '/student/suggestions', label: 'Suggestions' },
      { to: '/student/requests', label: 'My Requests' }] },
    { label: 'Community', items: [
      { to: '/student/notifications', label: 'Notifications' }, { to: '/student/posts', label: 'Posts' },
      { to: '/student/events', label: 'Events' }] },
    { label: 'Account', items: [{ to: '/student/profile', label: 'Profile' }] },
  ],
  exco: [
    { label: 'Casework', items: [
      { to: '/exco/dashboard', label: 'Dashboard' }, { to: '/exco/reports', label: 'Reports' },
      { to: '/exco/complaints', label: 'Complaints' }, { to: '/exco/suggestions', label: 'Suggestions' }] },
    { label: 'Work', items: [
      { to: '/exco/tasks', label: 'Tasks' }, { to: '/exco/monthly-reports', label: 'Monthly Reports' },
      { to: '/exco/requests', label: 'Requests' }, { to: '/exco/proposals', label: 'Proposals' }] },
    { label: 'Communications', items: [
      { to: '/exco/notifications', label: 'Notifications' }, { to: '/exco/messages', label: 'Messages' },
      { to: '/exco/documents', label: 'Documents' }] },
    { label: 'Community', items: [
      { to: '/exco/posts', label: 'Posts' }, { to: '/exco/events', label: 'Events' },
      { to: '/exco/profile', label: 'Profile' }] },
  ],
  vp: [
    { items: [
      { to: '/vp/dashboard', label: 'Dashboard' }, { to: '/vp/reports', label: 'Reports' },
      { to: '/vp/tasks', label: 'Tasks' }] },
    { label: 'Coordination', items: [
      { to: '/vp/directives', label: 'Directives' }, { to: '/vp/coordination', label: 'Coordination' },
      { to: '/vp/escalations', label: 'Escalations' }] },
    { label: 'Account', items: [
      { to: '/vp/notifications', label: 'Notifications' }, { to: '/vp/profile', label: 'Profile' }] },
  ],
  president: [
    { label: 'Overview', items: [
      { to: '/president/dashboard', label: 'Dashboard' }, { to: '/president/analytics', label: 'Analytics' }] },
    { label: 'Casework', items: [
      { to: '/president/reports', label: 'Reports' }, { to: '/president/complaints', label: 'Complaints' },
      { to: '/president/suggestions', label: 'Suggestions' }] },
    { label: 'Review', items: [
      { to: '/president/monthly-reports', label: 'Monthly Reports' }, { to: '/president/requests', label: 'Requests' },
      { to: '/president/proposals', label: 'Proposals' }] },
    { label: 'Operations', items: [
      { to: '/president/tasks', label: 'Tasks' }, { to: '/president/directives', label: 'Directives' },
      { to: '/president/escalations', label: 'Escalations' }, { to: '/president/interventions', label: 'Interventions' },
      { to: '/president/projects', label: 'Projects' }, { to: '/president/achievements', label: 'Achievements' }] },
    { label: 'Union', items: [
      { to: '/president/exco-management', label: 'EXCO Management' }, { to: '/president/administration', label: 'Administration' },
      { to: '/president/transition', label: 'Transition' }, { to: '/president/audit-logs', label: 'Audit Logs' }] },
    { label: 'Account', items: [
      { to: '/president/notifications', label: 'Notifications' }, { to: '/president/profile', label: 'Profile' }] },
  ],
  admin: [
    { items: [{ to: '/admin/dashboard', label: 'Dashboard' }] },
    { label: 'Structure', items: [
      { to: '/admin/users', label: 'Users' }, { to: '/admin/roles', label: 'Roles' },
      { to: '/admin/permissions', label: 'Permissions' }, { to: '/admin/directorates', label: 'Directorates' },
      { to: '/admin/positions', label: 'Positions' }, { to: '/admin/administrations', label: 'Administrations' },
      { to: '/admin/exco-management', label: 'EXCO Management' }] },
    { label: 'Policy', items: [
      { to: '/admin/routing', label: 'Routing' }, { to: '/admin/verification', label: 'Verification' }] },
    { label: 'Content & System', items: [
      { to: '/admin/notifications', label: 'Notifications' }, { to: '/admin/documents', label: 'Documents' },
      { to: '/admin/settings', label: 'Settings' }, { to: '/admin/audit-logs', label: 'Audit Logs' }] },
  ],
};

export default function PortalLayout({ portal }: { portal: Portal }) {
  const { profile, signOut } = useAuth();
  const { administration } = useCurrentAdministration();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  useEffect(() => {
    let alive = true;
    const tick = () => unreadNotificationCount().then((c) => alive && setUnread(c));
    tick();
    const t = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const current = NAV[portal].flatMap((g) => g.items)
    .find((i) => location.pathname === i.to || location.pathname.startsWith(i.to + '/'));

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-brand">
          <span className="brand-mark">SUG</span>
          <span className="brand-txt">
            <strong>SUG Digital</strong>
            <small>{PORTAL_LABEL[portal]}</small>
          </span>
        </div>
        {profile && (
          <div className="sb-user">
            <Avatar name={profile.full_name} src={profile.avatar_url} />
            <div style={{ minWidth: 0 }}>
              <b>{profile.full_name}</b>
              <small>{administration ? `${administration.academic_session} Administration` : 'No active administration'}</small>
            </div>
          </div>
        )}
        <nav className="nv">
          {NAV[portal].map((g, i) => (
            <div key={i}>
              {g.label && <div className="nv-lab">{g.label}</div>}
              {g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end
                  className={({ isActive }) => isActive ? 'on' : ''}>{n.label}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <Button variant="ghost" size="sm" style={{ width: '100%' }} onClick={() => signOut().then(() => navigate('/'))}>
            <Icon name="x" className="ic-sm" /> Sign out
          </Button>
          <p className="fine" style={{ marginTop: 8 }}>SUG Digital · Federal University Dutse</p>
        </div>
      </aside>

      <div className="scrim" onClick={() => setOpen(false)} />

      <div className="main">
        <header className="appbar">
          <button className="burger" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="appbar-title">{current?.label ?? 'SUG Digital'}</div>
          <div className="appbar-right">
            <Link to={`/${portal}/notifications`} className="bell" aria-label="Notifications">
              <Icon name="bell" />
              {unread > 0 && <span className="bell-n">{unread > 99 ? '99+' : unread}</span>}
            </Link>
            <Link to={`/${portal}/profile`} className="appbar-user">
              <Avatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size={30} />
              <span>{profile?.full_name?.split(' ')[0]}</span>
            </Link>
          </div>
        </header>
        <main className="app-main"><Outlet /></main>
      </div>
    </div>
  );
}