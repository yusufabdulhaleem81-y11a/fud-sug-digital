import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentAdministration } from '../../services/administrationService';
import { Badge, EmptyState, Icon, PageHeader, Prio, SkeletonRows } from '../../components/ui';
import { timeAgo } from '../../utils/format';

interface EscalatedCase {
  id: string; kind: 'report' | 'complaint'; reference_number: string;
  title: string | null; description: string; status: string;
  priority: string | null; updated_at: string;
}

export default function EscalationsPanel() {
  const [items, setItems] = useState<EscalatedCase[] | null>(null);

  useEffect(() => {
    (async () => {
      const admin = await getCurrentAdministration();
      if (!admin) { setItems([]); return; }
      const [rep, cmp] = await Promise.all([
        supabase.from('reports')
          .select('id, reference_number, title, description, status, priority, updated_at')
          .eq('administration_id', admin.id).in('status', ['escalated', 'presidential_review']),
        supabase.from('complaints')
          .select('id, reference_number, title, description, status, priority, updated_at')
          .eq('administration_id', admin.id).in('status', ['escalated', 'presidential_review']),
      ]);
      const reports = ((rep.data as any[]) ?? []).map((r) => ({ ...r, kind: 'report' as const }));
      const complaints = ((cmp.data as any[]) ?? []).map((c) => ({ ...c, kind: 'complaint' as const }));
      setItems([...reports, ...complaints].sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Escalations"
        subtitle="Cases escalated by officers — these need presidential attention first." />
      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No escalations" description="When officers escalate cases, they appear here immediately." />
      ) : (
        <div className="panel">
          {items.map((c) => (
            <Link key={`${c.kind}-${c.id}`}
              to={`/president/${c.kind === 'report' ? 'reports' : 'complaints'}/${c.id}`} className="row">
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{c.reference_number}</span>
                  <span className="cattag">{c.kind}</span>
                </div>
                <h4>{c.title ?? c.description.slice(0, 70) + '…'}</h4>
                <div className="meta"><span>Updated {timeAgo(c.updated_at)}</span></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <Badge status={c.status} />
                {c.priority && <Prio value={c.priority} />}
              </div>
              <Icon name="chev-r" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}