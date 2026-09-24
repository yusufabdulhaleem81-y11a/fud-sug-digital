
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getAdministrationBySession, listOfficers } from '../../services/administrationService';
import { Badge, Card, EmptyState, formatDate, initials, Spinner, statusTone } from '../../components/ui';
import type { Administration, Achievement, OfficerRecord, Project } from '../../types/models';

export default function AdministrationDetail() {
  const { session } = useParams<{ session: string }>();
  const [administration, setAdministration] = useState<Administration | null>(null);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    (async () => {
      const admin = await getAdministrationBySession(session);
      if (!admin || !admin.is_public) { setFound(false); setLoading(false); return; }
      setAdministration(admin);
      const [officersData, projectsData, achievementsData] = await Promise.all([
        listOfficers(admin.id),
        supabase.from('projects').select('*').eq('administration_id', admin.id).eq('visibility', 'public').order('created_at', { ascending: false }),
        supabase.from('achievements').select('*').eq('administration_id', admin.id).eq('status', 'published').order('achievement_date', { ascending: false }),
      ]);
      setOfficers(officersData);
      setProjects((projectsData.data as Project[]) ?? []);
      setAchievements((achievementsData.data as Achievement[]) ?? []);
      setLoading(false);
    })();
  }, [session]);

  if (loading) return <Spinner />;
  if (!found || !administration)
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Administration not found" /></div>;

  const leadership = officers.filter((o) => (o.position?.rank ?? 100) < 10);
  const directorates = officers.filter((o) => (o.position?.rank ?? 100) >= 10);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="serif text-3xl font-bold">{administration.name}</h1>
        <Badge tone={statusTone(administration.status)}>{administration.status}</Badge>
      </div>
      <p className="mt-2 text-stone-500">
        Session {administration.academic_session} · {formatDate(administration.start_date)} — {formatDate(administration.end_date)}
      </p>
      {administration.theme && (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-lg italic text-stone-700">“{administration.theme}”</p>
      )}
      {administration.description && <p className="mt-4 text-stone-600">{administration.description}</p>}

      {administration.priorities && administration.priorities.length > 0 && (
        <section className="mt-8">
          <h2 className="serif text-xl font-bold">Priorities</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {administration.priorities.map((p) => (
              <li key={p} className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm">✦ {p}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="serif text-xl font-bold">Leadership</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leadership.map((o) => <OfficerCard key={o.id} officer={o} />)}
        </div>
      </section>

      {directorates.length > 0 && (
        <section className="mt-10">
          <h2 className="serif text-xl font-bold">Directorates & Officers</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directorates.map((o) => <OfficerCard key={o.id} officer={o} />)}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="serif text-xl font-bold">Projects</h2>
        {projects.length === 0 ? (
          <div className="mt-3"><EmptyState title="No public projects recorded" /></div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                </div>
                {p.description && <p className="mt-2 line-clamp-3 text-sm text-stone-500">{p.description}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="serif text-xl font-bold">Official Achievements</h2>
        <p className="text-xs text-stone-400">Only achievements reviewed and published by authorized officers appear here.</p>
        {achievements.length === 0 ? (
          <div className="mt-3"><EmptyState title="No published achievements" /></div>
        ) : (
          <div className="mt-4 space-y-3">
            {achievements.map((a) => (
              <Card key={a.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.category && <Badge tone="gold">{a.category}</Badge>}
                </div>
                <p className="mt-2 text-sm text-stone-600">{a.description}</p>
                <p className="mt-2 text-xs text-stone-400">{formatDate(a.achievement_date)}{a.impact ? ` · ${a.impact}` : ''}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OfficerCard({ officer }: { officer: OfficerRecord }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        {officer.profile_photo_url ? (
          <img src={officer.profile_photo_url} alt={officer.display_name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fud/10 font-bold text-fud">
            {initials(officer.display_name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-800">{officer.display_name}</p>
          <p className="text-sm text-fud">{officer.position?.title}</p>
          {officer.directorate && <p className="text-xs text-stone-400">{officer.directorate.name}</p>}
        </div>
      </div>
      {officer.biography && <p className="mt-3 line-clamp-3 text-sm text-stone-500">{officer.biography}</p>}
    </Card>
  );
}