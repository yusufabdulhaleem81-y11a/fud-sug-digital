import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useInstitution } from '../../hooks/useInstitution';
import { useCurrentAdministration } from '../../hooks/useCurrentAdministration';
import { homeForRole } from '../../lib/routing';
import { Icon } from '../../components/ui';

export default function Home() {
  const { settings } = useInstitution();
  const { profile } = useAuth();
  const { administration } = useCurrentAdministration();
  const [officerCount, setOfficerCount] = useState<number | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);

  useEffect(() => {
    if (administration) {
      supabase.from('administration_officers').select('id', { count: 'exact', head: true })
        .eq('administration_id', administration.id).eq('status', 'active')
        .then(({ count }) => setOfficerCount(count ?? 0));
    }
    supabase.from('administrations').select('id', { count: 'exact', head: true })
      .eq('is_public', true).then(({ count }) => setAdminCount(count ?? 0));
  }, [administration]);

  const wa = settings.whatsapp_intl ? `https://wa.me/${settings.whatsapp_intl}` : null;

  return (
    <div>
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <p className="kicker">Student Union Government · {settings.short_name}</p>
              <h1 className="hero-h">Report issues. Suggest ideas. <em>Stay informed.</em></h1>
              <p className="lede">
                The official digital platform of the Student Union Government, {settings.institution_name}.
                Submit reports, lodge complaints — even anonymously — and follow every case to resolution.
              </p>
              <div className="hero-cta">
                <Link to={profile ? homeForRole(profile.role) : '/login'} className="btn btn-primary">
                  Get started
                </Link>
                <Link to="/administrations" className="btn btn-light-o">Browse the archive</Link>
              </div>
              <p className="hero-note">
                <Icon name="shield" className="ic-sm" /> Auto-routed to the right officer · Anonymous mode · Permanent institutional record
              </p>
            </div>
            <div>
              <div className="live">
                <div className="media" style={{ ['--r' as string]: '16/9', borderRadius: 0 }}>
                  <img src={settings.hero_image_path} alt="Federal University Dutse campus" />
                </div>
                <div className="live-head"><span className="dot" /> Union live</div>
                <div className="live-row">
                  <span>Current administration</span>
                  <b>{administration ? administration.academic_session : '—'}</b>
                </div>
                <div className="live-row"><span>Officers serving</span><b>{officerCount ?? '—'}</b></div>
                <div className="live-row"><span>Administrations on record</span><b>{adminCount ?? '—'}</b></div>
              </div>
              <div className="live-mini">
                <Link to="/updates"><span className="cat">Updates</span><span>Latest announcements</span></Link>
                <Link to="/events"><span className="cat">Events</span><span>What's on</span></Link>
                <Link to="/history"><span className="cat">History</span><span>The SUG archive</span></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <p className="overline">How it works</p>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Submit</h3>
              <p>Choose a category — Academic, Welfare, Finance/Fees, Accommodation and more — and describe the issue.</p>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>Routed</h3>
              <p>Your case is automatically routed to the right officer for that category. Nothing sits unread.</p>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Resolved</h3>
              <p>Follow the full timeline — responses, escalations, presidential interventions — through to resolution.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>Every administration, permanently recorded.</h2>
          <p>
            SUG Digital is the institutional memory of the Union. Browse who served, what they achieved,
            what they built, and what was handed over — from this session and every session before it.
          </p>
          <div className="fx">
            <Link to="/administrations" className="btn btn-light">Explore the archive</Link>
            {wa && <a className="wa-btn" href={wa} target="_blank" rel="noreferrer">WhatsApp the Union</a>}
          </div>
        </div>
      </section>
    </div>
  );
}