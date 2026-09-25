import { useEffect, useState } from 'react';
import { listPublishedPosts } from '../../services/contentService';
import { EmptyState, SkeletonRows } from '../../components/ui';
import { fmtDate } from '../../utils/format';

export default function Updates() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { listPublishedPosts().then(setItems); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="overline">Official channel</p>
      <h1 className="serif text-3xl font-bold">Updates & Announcements</h1>

      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <div className="mt-8"><EmptyState title="No announcements yet" description="Official SUG announcements will appear here." /></div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((p) => (
            <article key={p.id} className="panel" style={{ padding: 22 }}>
              <div className="flex flex-wrap items-center gap-2">
                {p.category && <span className="cattag">{p.category}</span>}
                <span className="fine">
                  {p.published_at ? fmtDate(p.published_at) : ''}
                  {p.author_officer ? ` · ${p.author_officer.display_name}` : ''}
                </span>
              </div>
              <h3 className="serif mt-2 text-xl font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-stone-600" style={{ whiteSpace: 'pre-wrap' }}>{p.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}