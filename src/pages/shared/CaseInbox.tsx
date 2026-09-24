import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdministrationReports, listAssignedReports } from '../../services/reportService';
import { listAdministrationComplaints, listAssignedComplaints } from '../../services/complaintService';
import type { CaseSummary } from '../../services/caseFlow';
import { Badge, EmptyState, Icon, PageHeader, Prio, SkeletonRows } from '../../components/ui';
import { fmtDate, timeAgo } from '../../utils/format';

const OPEN = ['submitted', 'assigned', 'under_review', 'info_requested', 'escalated', 'presidential_review'];

export default function CaseInbox({ kind, scope }: { kind: 'report' | 'complaint'; scope: 'assigned' | 'administration' }) {
  const [items, setItems] = useState<CaseSummary[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'escalated' | 'done'>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = kind === 'report'
      ? (scope === 'assigned' ? listAssignedReports : listAdministrationReports)
      : (scope === 'assigned' ? listAssignedComplaints : listAdministrationComplaints);
    load().then(setItems);
  }, [kind, scope]);

  const base = `${scope === 'assigned' ? '/exco' : '/president'}/${kind === 'report' ? 'reports' : 'complaints'}`;

  const shown = useMemo(() => (items ?? []).filter((c) => {
    if (filter === 'open' && !OPEN.includes(c.status)) return false;
    if (filter === 'escalated' && !['escalated', 'presidential_review'].includes(c.status)) return false;
    if (filter === 'done' && !['resolved', 'closed'].includes(c.status)) return false;
    if (q && !(`${c.reference_number} ${c.title ?? ''} ${c.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [items, filter, q]);

  return (
    <div>
      <PageHeader
        title={kind === 'report' ? 'Reports' : 'Complaints'}
        subtitle={scope === 'assigned'
          ? 'Cases auto-routed to your office. Respond, request information, escalate, or resolve.'
          : 'Every case in the current administration. Intervene on escalations, reassign follow-ups, close the loop.'} />

      <div className="filterbar">
        <input className="input search" placeholder="Search reference or title…" value={q} onChange={(e) => setQ(e.target.value)} />
        {([['all', 'All'], ['open', 'Open'], ['escalated', 'Escalated'], ['done', 'Resolved']] as const).map(([k, label]) => (
          <button key={k} className={filter === k ? 'chip on' : 'chip'} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      {items === null ? <SkeletonRows /> : shown.length === 0 ? (
        <EmptyState title="Nothing here yet"
          description={scope === 'assigned'
            ? 'Cases routed to your position will appear here automatically.'
            : 'Cases submitted during this administration will appear here.'} />
      ) : (
        <div className="panel">
          {shown.map((c) => (
            <Link key={c.id} to={`${base}/${c.id}`} className="row">
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{c.reference_number}</span>
                  {c.category && <span className="cattag">{c.category}</span>}
                  {c.is_anonymous && <span className="badge b-gray">Anonymous</span>}
                </div>
                <h4>{c.title ?? c.description.slice(0, 70) + '…'}</h4>
                <div className="meta">
                  <span>Updated {timeAgo(c.updated_at)}</span>
                  {c.resolved_at && <span>· Resolved {fmtDate(c.resolved_at)}</span>}
                </div>
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