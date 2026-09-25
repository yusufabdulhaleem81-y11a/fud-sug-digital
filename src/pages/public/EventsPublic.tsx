import { useEffect, useState } from 'react';
import { listPublicEvents } from '../../services/contentService';
import { Badge, EmptyState, SkeletonRows } from '../../components/ui';
import { MONTHS } from '../../utils/format';

export default function EventsPublic() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { listPublicEvents().then(setItems); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="overline">What's on</p>
      <h1 className="serif text-3xl font-bold">SUG Events</h1>

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <div className="mt-8"><EmptyState title="No upcoming events" description="Union events will be announced here." /></div>
      ) : (
        <div className="mt-8 space-y-0">
          {items.map((e) => {
            const d = e.starts_at ? new Date(e.starts_at) : null;
            return (
              <div key={e.id} className="fx" style={{ padding: '18px 0', borderBottom: '1px solid var(--line)', gap: 16 }}>
                <div style={{ width: 66, flex: 'none', textAlign: 'center', border: '1px solid var(--line2)', borderRadius: 12, padding: '9px 0', background: 'var(--surface)' }}>
                  {d ? (
                    <>
                      <b style={{ fontFamily: 'var(--serif)', fontSize: 24, display: 'block', lineHeight: 1.05 }}>{d.getDate()}</b>
                      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{MONTHS[d.getMonth()]}</span>
                    </>
                  ) : (
                    <b style={{ fontSize: 18 }}>TBA</b>
                  )}
                </div>
                <div>
                  <div className="fx" style={{ gap: 8 }}>
                    <h4 style={{ fontWeight: 600 }}>{e.title}</h4>
                    <Badge status={e.status} />
                  </div>
                  {e.location && <p className="fine" style={{ marginTop: 2 }}>{e.location}</p>}
                  {e.description && <p className="mut small" style={{ marginTop: 4 }}>{e.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}