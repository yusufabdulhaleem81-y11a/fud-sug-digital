import { useEffect, useState } from 'react';
import { getAdministrationStats, type AdminStats } from '../../services/analyticsService';
import { PageHeader, SkeletonRows, Stat, StatStrip } from '../../components/ui';

export default function AnalyticsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => { getAdministrationStats().then(setStats); }, []);

  if (!stats) return <SkeletonRows />;
  const s = stats;

  return (
    <div>
      <PageHeader title="Administration Analytics"
        subtitle={`Factual record for the ${s.administration.academic_session} administration — raw metrics, no rankings.`} />

      <StatStrip>
        <Stat value={s.reportsTotal} label="Reports received" />
        <Stat value={s.reportsResolved} label="Reports resolved" />
        <Stat value={s.complaintsTotal} label="Complaints" />
        <Stat value={s.complaintsResolved} label="Complaints resolved" />
      </StatStrip>
      <StatStrip>
        <Stat value={s.suggestionsTotal} label="Suggestions" />
        <Stat value={s.tasksTotal} label="Tasks created" />
        <Stat value={s.tasksCompleted} label="Tasks completed" />
        <Stat value={s.officers} label="Officers serving" />
      </StatStrip>
      <StatStrip>
        <Stat value={s.projectsCompleted} label="Projects completed" />
        <Stat value={s.achievementsPublished} label="Achievements published" />
        <Stat value={Math.round((s.reportsTotal ? (s.reportsResolved / s.reportsTotal) * 100 : 0)) + '%'} label="Report resolution rate" />
        <Stat value={s.administration.academic_session} label="Current administration" />
      </StatStrip>

      <p className="fine mt16">These are verifiable counts drawn directly from the platform's records — every number here can be traced to real cases.</p>
    </div>
  );
}