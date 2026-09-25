import { useEffect, useState } from 'react';
import { listPublicProjects } from '../../services/projectService';
import { Badge, EmptyState, SkeletonRows, statusTone } from '../../components/ui';
import { fmtDate } from '../../utils/format';

export default function ProjectsPublic() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { listPublicProjects().then(setItems); }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="overline">Delivery record</p>
      <h1 className="serif text-3xl font-bold">SUG Projects</h1>
      <p className="mt-2 text-stone-500">Projects undertaken by the Student Union Government across administrations.</p>

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <div className="mt-8"><EmptyState title="No public projects yet" /></div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((p) => (
            <div key={p.id} className="panel" style={{ padding: 20 }}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="serif text-lg font-bold">{p.title}</h3>
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
              </div>
              {p.category && <p className="cattag" style={{ marginTop: 4 }}>{p.category}</p>}
              {p.description && <p className="mt-3 line-clamp-3 text-sm text-stone-600">{p.description}</p>}
              <p className="fine" style={{ marginTop: 10 }}>
                {p.start_date ? `Started ${fmtDate(p.start_date)}` : ''}
                {p.completion_date ? ` · Completed ${fmtDate(p.completion_date)}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}