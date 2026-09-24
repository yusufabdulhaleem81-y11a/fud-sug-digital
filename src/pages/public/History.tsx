import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublicAdministrations } from '../../services/administrationService';
import { Badge, formatDate, statusTone, Spinner } from '../../components/ui';
import type { Administration } from '../../types/models';

export default function History() {
  const [administrations, setAdministrations] = useState<Administration[] | null>(null);
  useEffect(() => { listPublicAdministrations().then(setAdministrations); }, []);
  if (!administrations) return <Spinner />;

  const earliest = administrations[administrations.length - 1];
  const latest = administrations[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="serif text-3xl font-bold">SUG History</h1>
      <p className="mt-2 text-stone-500">
        The timeline of the Student Union Government of Federal University Dutse — updated automatically as administrations are added.
      </p>

      {earliest && latest && (
        <p className="mt-4 text-sm text-stone-400">
          From {earliest.academic_session} to {latest.academic_session} · {administrations.length} administration{administrations.length > 1 ? 's' : ''} recorded
        </p>
      )}

      <ol className="mt-10 space-y-0">
        {[...administrations].reverse().map((a) => (
          <li key={a.id} className="relative border-l-2 border-stone-200 pb-10 pl-8 last:border-transparent last:pb-0">
            <span className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-fud" />
            <Link to={`/administrations/${a.academic_session}`} className="group">
              <h2 className="serif text-lg font-bold group-hover:text-fud">{a.name}</h2>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
              <span>{formatDate(a.start_date)} — {formatDate(a.end_date)}</span>
              <Badge tone={statusTone(a.status)}>{a.status}</Badge>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}