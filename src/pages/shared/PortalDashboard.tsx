import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentAdministration } from '../../hooks/useCurrentAdministration';
import { Badge, Card, formatDate } from '../../components/ui';

export interface DashboardLink { to: string; label: string; phase?: string; }

export default function PortalDashboard({ links }: { links: DashboardLink[] }) {
  const { profile } = useAuth();
  const { administration } = useCurrentAdministration();

  return (
    <div>
      <h1 className="serif text-2xl font-bold">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
      <p className="mt-1 text-sm capitalize text-stone-500">{profile?.role} · {profile?.email}</p>

      {administration ? (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="serif font-bold">{administration.name}</h2>
            <Badge tone="green">current</Badge>
          </div>
          {administration.theme && <p className="mt-1 text-sm italic text-stone-500">“{administration.theme}”</p>}
          <p className="mt-2 text-xs text-stone-400">{formatDate(administration.start_date)} — {formatDate(administration.end_date)}</p>
        </Card>
      ) : (
        <Card className="mt-6 p-5 text-sm text-stone-500">
          No current administration configured yet{profile?.role === 'admin' || profile?.role === 'super_admin' ? ' — create one under Administrations.' : '.'}
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="h-full p-5 transition hover:border-fud">
              <p className="font-semibold text-stone-800">{l.label}</p>
              {l.phase && <span className="mt-2 inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">{l.phase}</span>}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}