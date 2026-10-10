import React from 'react';
import { Database, Users, Briefcase, Clock, Target, Folder, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { formatRp, KATEGORI, CATEGORY_COLORS, sortedValues } from './costSummary';

const pctStr = (v) => v.toFixed(1).replace('.', ',') + '%';

function AreaSpark({ values, color, id }) {
  const vals = values && values.length ? (values.length === 1 ? [0, values[0]] : values) : [0, 0];
  const max = Math.max(...vals, 1);
  const w = 120, h = 36;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - (v / max) * (h - 6) - 3]);
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Card({ icon: Icon, accent, title, value, valueCls = 'text-gray-900', children }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(16,24,40,0.06)] p-4 flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">{title}</span>
        <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: accent + '1a', color: accent }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`mt-2 text-[22px] leading-tight font-bold tracking-tight whitespace-nowrap ${valueCls}`}>{value}</div>
      <div className="mt-auto pt-3">{children}</div>
    </div>
  );
}

export default function KpiCards({ summary, prevSummary, activeProjects, totalProjects }) {
  const s = summary;
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
  const change = prevSummary && prevSummary.total > 0 ? ((s.total - prevSummary.total) / prevSummary.total) * 100 : null;
  const budgetPct = pct(s.total, s.budget);
  const budgetColor = budgetPct > 100 ? '#ef4444' : budgetPct > 80 ? '#f59e0b' : '#22c55e';
  const mhVals = sortedValues(s.dailyMH);
  const mhMax = Math.max(...mhVals, 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card icon={Database} accent="#3b82f6" title="Total Pengeluaran" value={formatRp(s.total)}>
        <div className="flex items-center gap-2 text-xs">
          {change !== null ? (
            <span className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md ${change >= 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change).toFixed(0)}%
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium">Baru</span>
          )}
          <span className="text-gray-400">vs periode lalu</span>
        </div>
        <AreaSpark id="sp-total" values={sortedValues(s.dailyTotals)} color="#3b82f6" />
      </Card>

      <Card icon={Users} accent="#6366f1" title="Biaya Manpower" value={formatRp(s.manpower)}>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">dari total cost</span>
          <span className="font-semibold text-indigo-600">{pctStr(pct(s.manpower, s.total))}</span>
        </div>
        <AreaSpark id="sp-mp" values={sortedValues(s.dailyMP)} color="#6366f1" />
      </Card>

      <Card icon={Briefcase} accent="#f43f5e" title="Biaya Non-Manpower" value={formatRp(s.nonManpower)}>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 mb-2">
          {KATEGORI.map((k) => (
            <div key={k} style={{ width: `${pct(s.byKat[k], s.nonManpower)}%`, background: CATEGORY_COLORS[k] }} />
          ))}
        </div>
        <div className="space-y-0.5 text-[11px]">
          {KATEGORI.map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[k] }} />
              <span className="flex-1 text-gray-500">{k}</span>
              <span className={`font-medium ${s.byKat[k] ? 'text-gray-800' : 'text-gray-300'}`}>{formatRp(s.byKat[k])}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card icon={Clock} accent="#0ea5e9" title="Man-Hours" value={<>{s.manHours.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-sm font-medium text-gray-400">Jam</span></>}>
        <div className="text-xs text-gray-400 mb-1.5"><b className="text-sky-600">{s.orgHari}</b> Org-Hari</div>
        <div className="flex items-end gap-1 h-9">
          {(mhVals.length ? mhVals.slice(-14) : [0]).map((v, i) => (
            <div key={i} className="flex-1 max-w-[10px] rounded-t bg-gradient-to-t from-sky-400 to-sky-200" style={{ height: `${Math.max(6, (v / mhMax) * 100)}%` }} />
          ))}
        </div>
      </Card>

      <Card icon={Target} accent={budgetColor} title="Budget Terpakai" value={pctStr(budgetPct)} valueCls={budgetPct > 100 ? 'text-rose-600' : 'text-gray-900'}>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, budgetPct))}%`, background: budgetColor }} />
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-400">Terpakai</span><span className="font-medium text-gray-700">{formatRp(s.total)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-400">Budget</span><span className="font-medium text-gray-700">{formatRp(s.budget)}</span>
        </div>
      </Card>

      <Card icon={Folder} accent="#8b5cf6" title="Project Aktif" value={<>{activeProjects} <span className="text-sm font-medium text-gray-400">Project</span></>}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">dari total {totalProjects} project</span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition" />
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct(activeProjects, totalProjects)}%` }} />
        </div>
      </Card>
    </div>
  );
}
