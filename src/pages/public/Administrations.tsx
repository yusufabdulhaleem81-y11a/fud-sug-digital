import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublicAdministrations } from '../../services/administrationService';
import { Badge, formatDate, statusTone, Spinner, EmptyState } from '../../components/ui';
import type { Administration } from '../../types/models';

export default function Administrations() {
  const [administrations, setAdministrations] = useState<Administration[] | null>(null);

  useEffect(() => {
    listPublicAdministrations().then(setAdministrations);
  }, []);

  if (!administrations) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="serif text-3xl font-bold">SUG Administration Archive</h1>
      <p className="mt-2 text-stone-500">
        Every administration of the Student Union Government, permanently recorded — who served, what they did, and what they handed over.
      </p>

      {administrations.length === 0 ? (
        <div className="mt-8"><EmptyState title="No administrations yet" description="The archive will grow as administrations are created." /></div>
      ) : (
        <div className="relative mt-10 border-l-2 border-fud/20 pl-6">
          {administrations.map((a) => (
            <div key={a.id} className="relative mb-8">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-fud ring-4 ring-fud/10" />
              <Link to={`/administrations/${a.academic_session}`} className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-sm hover:border-fud">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="serif text-lg font-bold text-stone-900 group-hover:text-fud">{a.name}</h2>
                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                </div>
                {a.theme && <p className="mt-1 text-sm italic text-stone-500">“{a.theme}”</p>}
                <p className="mt-2 text-sm text-stone-500">{formatDate(a.start_date)} — {formatDate(a.end_date)}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}