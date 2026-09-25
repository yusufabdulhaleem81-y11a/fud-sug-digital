import { useEffect, useState } from 'react';
import { listPublishedAchievements } from '../../services/achievementService';
import { Badge, EmptyState, SkeletonRows } from '../../components/ui';
import { fmtDate } from '../../utils/format';

export default function AchievementsPublic() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { listPublishedAchievements().then(setItems); }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="overline">Official record</p>
      <h1 className="serif text-3xl font-bold">SUG Achievements</h1>
      <p className="mt-2 text-stone-500">Verified achievements of the Student Union Government — reviewed and published by authorized officers only.</p>

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <div className="mt-8"><EmptyState title="No published achievements yet" description="Achievements appear here once reviewed and published." /></div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <div key={a.id} className="panel" style={{ padding: 20 }}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="serif text-lg font-bold">{a.title}</h3>
                {a.category && <Badge tone="gold">{a.category}</Badge>}
              </div>
              {a.administration && (
                <p className="fine" style={{ marginTop: 2 }}>{a.administration.name}</p>
              )}
              <p className="mt-3 text-sm text-stone-600">{a.description}</p>
              {a.impact && <p className="mt-2 text-xs text-stone-500"><b>Impact:</b> {a.impact}</p>}
              <p className="fine" style={{ marginTop: 10 }}>{fmtDate(a.achievement_date)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}