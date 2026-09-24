import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listMyReports } from '../../services/reportService';
import type { CaseSummary } from '../../services/reportService';
import { Badge, Button, EmptyState, Icon, PageHeader, Prio, SkeletonRows } from '../../components/ui';
import { timeAgo } from '../../utils/format';

export default function StudentReports() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CaseSummary[] | null>(null);

  useEffect(() => { listMyReports().then(setItems); }, []);

  return (
    <div>
      <PageHeader title="My Reports" subtitle="Every report you have submitted, with its full timeline."
        right={<Button size="sm" onClick={() => navigate('/student/reports/new')}><Icon name="plus" className="ic-sm" /> New report</Button>} />
      {items === null ? <SkeletonRows /> : items.length === 0 ? (
        <EmptyState title="No reports yet"
          description="When you submit a report it will appear here with its reference number and status."
          action={<Button size="sm" onClick={() => navigate('/student/reports/new')}>Submit your first report</Button>} />
      ) : (
        <div className="panel">
          {items.map((c) => (
            <Link key={c.id} to={`/student/reports/${c.id}`} className="row">
              <div className="row-main">
                <div className="row-top">
                  <span className="ref">{c.reference_number}</span>
                  {c.category && <span className="cattag">{c.category}</span>}
                </div>
                <h4>{c.title}</h4>
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