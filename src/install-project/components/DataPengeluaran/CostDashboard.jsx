import React, { useMemo } from 'react';
import KpiCards from './KpiCards';
import { TrendChart, KomposisiChart } from './CostCharts';
import { summarize, previousRange, monthlyTrend } from './costSummary';

export default function CostDashboard({ projects, allProjects, start, end }) {
  const summary = useMemo(() => summarize(projects, start, end), [projects, start, end]);
  const prevSummary = useMemo(() => {
    if (!start || !end) return null;
    const p = previousRange(start, end);
    return summarize(projects, p.start, p.end);
  }, [projects, start, end]);

  const year = Number((start || new Date().toISOString()).slice(0, 4));
  const months = useMemo(() => monthlyTrend(projects, year), [projects, year]);

  // Project aktif = project yang punya aktivitas (jam/biaya) pada periode terpilih
  const activeProjects = useMemo(
    () => projects.filter((p) => (p.daily || []).some((d) => (!start || d.tanggal >= start) && (!end || d.tanggal <= end))).length,
    [projects, start, end]
  );

  return (
    <div className="space-y-4">
      <KpiCards summary={summary} prevSummary={prevSummary} activeProjects={activeProjects} totalProjects={allProjects.length} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendChart months={months} year={year} />
        <KomposisiChart summary={summary} />
      </div>
    </div>
  );
}
