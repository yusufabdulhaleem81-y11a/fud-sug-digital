import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInstitution } from '../hooks/useInstitution';
import { homeForRole } from '../lib/routing';
import { Button, Icon } from '../components/ui';

const NAV = [
  { to: '/', label: 'Home' }, { to: '/administrations', label: 'Administrations' },
  { to: '/history', label: 'SUG History' }, { to: '/achievements', label: 'Achievements' },
  { to: '/projects', label: 'Projects' }, { to: '/updates', label: 'Updates' },
  { to: '/events', label: 'Events' }, { to: '/about', label: 'About' },
];

export default function PublicLayout() {
  const { settings } = useInstitution();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  const wa = settings.whatsapp_intl ? `https://wa.me/${settings.whatsapp_intl}` : null;

  return (
    <div>
      <div className="toprule" />
      <header className="site-head">
        <div className="wrap head-in">
          <Link to="/" className="brand">
            <span className="brand-mark"><img src={settings.logo_path} alt={`${settings.short_name} crest`} /></span>
            <span className="brand-txt">
              <strong>SUG Digital</strong>
              <small>{settings.institution_name}</small>
            </span>
          </Link>
          <nav className="nav-links">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => isActive ? 'on' : ''}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="head-cta">
            {profile ? (
              <Button size="sm" onClick={() => navigate(homeForRole(profile.role))}>My Portal</Button>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
            )}
          </div>
          <button className="burger" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <div className="pubscrim" onClick={() => setOpen(false)} />
      <aside className="pdrawer">
        <div className="spread" style={{ marginBottom: 14 }}>
          <strong className="serif">Menu</strong>
          <button className="m-x" onClick={() => setOpen(false)}><Icon name="x" /></button>
        </div>
        {NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>{n.label}</Link>)}
        <Link to={profile ? homeForRole(profile.role) : '/login'} onClick={() => setOpen(false)}>
          {profile ? 'My Portal' : 'Sign in'}
        </Link>
      </aside>

      <main><Outlet /></main>

      <footer className="site-foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <h4>SUG Digital</h4>
              <p className="small" style={{ color: '#B9C6BA', maxWidth: '34ch' }}>
                The permanent digital operating system and institutional memory of the Student Union
                Government, {settings.institution_name} ({settings.short_name}) — serving every
                administration, present and future.
              </p>
            </div>
            <div>
              <h4>Platform</h4>
              <Link to="/administrations">Administration Archive</Link>
              <Link to="/history">SUG History</Link>
              <Link to="/achievements">Achievements</Link>
              <Link to="/projects">Projects</Link>
              <Link to="/updates">Updates</Link>
            </div>
            <div>
              <h4>Contact the Union</h4>
              {wa && (
                <a className="wa-btn" href={wa} target="_blank" rel="noreferrer">
                  <Icon name="user" /> WhatsApp <span className="wa-num">{settings.whatsapp_display}</span>
                </a>
              )}
              <p className="fine" style={{ marginTop: 10 }}>
                {settings.contact_email ?? 'Reach the SUG through this platform or the WhatsApp line.'}
              </p>
            </div>
          </div>
          <div className="foot-base">
            <span>© {new Date().getFullYear()} Student Union Government · {settings.institution_name}</span>
            <span>SUG Digital</span>
          </div>
        </div>
      </footer>
    </div>
  );
}