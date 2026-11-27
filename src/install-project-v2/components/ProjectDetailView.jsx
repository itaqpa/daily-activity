import { Fragment, useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  CalendarRange,
  ClipboardCheck,
  Users,
  Wallet,
  TrendingUp,
  Lock,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Play,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import DailyInput from './DailyInput';
import ManpowerView from './ManpowerView';
import PlanView from './PlanView';
import LaporanView from './LaporanView';
import DataImportExportView from './DataImportExportView';
import {
  kpis as calcKpis,
  projSummary,
  dataDates,
  devTone,
  devLabel,
  productGroups,
  sumBobot,
  bobotOk,
  STATUS,
  lineActual
} from '../utils/calc';
import { finalModel, exportModelToPdf, exportModelToXlsx } from '../utils/reportModels';

const KATEGORI = ['Part / Material', 'Consumable', 'Sewa Alat', 'Transportasi', 'Akomodasi', 'Konsumsi', 'Lain-lain'];
const CUACA = ['Cerah', 'Berawan', 'Hujan ringan', 'Hujan lebat'];
const OT_BASE = 8;

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const rid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const toUTC = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const addDays = (s, n) => (isDate(s) ? new Date(toUTC(s) + n * 86400000).toISOString().slice(0, 10) : '');
const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
const dayCount = (a, b) => diffDays(a, b) + 1;
const dow = (s) => new Date(toUTC(s)).getUTCDay();
const minD = (...a) => a.filter(isDate).sort()[0] || '';
const maxD = (...a) => a.filter(isDate).sort().slice(-1)[0] || '';
const dateRange = (a, b, max = 365) => {
  const o = [];
  if (!isDate(a) || !isDate(b) || a > b) return o;
  let d = a;
  while (d <= b && o.length < max) {
    o.push(d);
    d = addDays(d, 1);
  }
  return o;
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const fmtDate = (s) => (isDate(s) ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : '-');
const fmtRp = (n) => 'Rp ' + Math.round(num(n)).toLocaleString('id-ID');
const fmtPct = (f, d = 1) => (num(f) * 100).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const fmtSigned = (f, d = 1) => (num(f) >= 0.00005 ? '+' : '') + fmtPct(f, d);
const fmtNum = (n, d = 0) => num(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

// 1:1 Business Logic Helpers from aqpa_ip_v5
const lineEnd = (l) => addDays(l.start, Math.max(1, l.days) - 1);
const planFrac = (l, d) => {
  if (!isDate(l.start) || d < l.start) return 0;
  const e = lineEnd(l);
  if (d >= e) return 1;
  return dayCount(l.start, d) / Math.max(1, l.days);
};
const planLines = (p) => (p.baseline ? p.baseline.lines : p.lines) || [];
const planAt = (lines, d) => (lines || []).reduce((s, l) => s + num(l.bobot) * planFrac(l, d), 0);
const plannedFinish = (p) => addDays(p.reg?.estStart, Math.max(1, p.reg?.estDays || 1) - 1);
const planEnd = (p, lines) => maxD(plannedFinish(p), ...(lines || []).map(lineEnd));

const cumByLine = (D, upTo) => {
  const c = {};
  Object.keys(D || {}).forEach((k) => {
    if (k > upTo) return;
    const pr = D[k]?.prog || {};
    for (const id in pr) c[id] = (c[id] || 0) + num(pr[id]);
  });
  return c;
};
const actualAt = (p, D, d) => {
  const c = cumByLine(D, d);
  return (p.lines || []).reduce((s, l) => s + num(l.bobot) * Math.min(1, c[l.id] || 0), 0);
};
const isHSE = (lv) => /^hse$/i.test(String(lv || '').trim());
const levelOn = (p, d, mid) => {
  const m = (p.manpower || []).find((x) => x.id === mid);
  return (d?.lv && d.lv[mid]) || (m ? m.level : '');
};
const rateOf = (masterLevels, source, level) => {
  const v =
    (masterLevels || []).find((x) => x.source === source && x.level === level) ||
    (masterLevels || []).find((x) => x.level === level);
  return v ? { rate: num(v.rate), ot: num(v.ot) } : { rate: 0, ot: 0 };
};

function dayInfo(p, d, masterLevels) {
  const present = new Map();
  let mh = 0;
  let ot = 0;
  (d?.teams || []).forEach((t) => {
    const hrs = num(t.hours);
    const o = Math.max(0, hrs - OT_BASE);
    (t.members || []).forEach((m) => {
      const mp = (p.manpower || []).find((x) => x.id === m);
      if (!mp || present.has(m)) return;
      present.set(m, o);
      mh += hrs;
      ot += o;
    });
  });
  let wage = 0;
  let otCost = 0;
  present.forEach((o, m) => {
    const mp = (p.manpower || []).find((x) => x.id === m);
    const lv = levelOn(p, d, m);
    const r = rateOf(masterLevels, mp.source, lv);
    wage += r.rate;
    otCost += o * r.ot;
  });
  const other = (d?.costs || []).reduce((s, c) => s + num(c.qty) * num(c.price), 0);
  return { present: [...present.keys()], mp: present.size, mh, ot, wage: wage + otCost, base: wage, otCost, other, cost: wage + otCost + other };
}

function jobNorm(l, masterJobs) {
  const js = l.jobs && l.jobs.length ? l.jobs : masterJobs || [];
  const t = js.reduce((s, j) => s + num(j.bobot), 0);
  return js.map((j) => ({ id: j.id, name: j.name, w: t > 0 ? num(j.bobot) / t : 1 / Math.max(1, js.length) }));
}
function applyDayJobs(d, l, cum, jobs) {
  const jp = d?.jp && d.jp[l.id];
  const out = {};
  if (jp && Object.keys(jp).length) {
    jobs.forEach((j) => {
      const v = Math.min(num(jp[j.id]), Math.max(0, 1 - cum[j.id]));
      if (v > 0) {
        cum[j.id] += v;
        out[j.id] = v;
      }
    });
  } else if (num(d?.prog?.[l.id]) > 0) {
    let rem = num(d.prog[l.id]);
    for (const j of jobs) {
      const cap = (1 - cum[j.id]) * j.w;
      const take = Math.min(rem, cap);
      if (take > 1e-12) {
        cum[j.id] += take / j.w;
        out[j.id] = take / j.w;
        rem -= take;
      }
      if (rem <= 1e-9) break;
    }
  }
  return out;
}
function jobCum(D, l, upTo, masterJobs) {
  const jobs = jobNorm(l, masterJobs);
  const cum = {};
  jobs.forEach((j) => { cum[j.id] = 0; });
  Object.keys(D || {}).sort().forEach((k) => {
    if (k <= upTo) applyDayJobs(D[k], l, cum, jobs);
  });
  return cum;
}
function costPrefix(p, kat, masterCodes) {
  const m = /(\d{4})-(\d+)\s*$/.exec(p.no || '');
  const y = m ? m[1] : todayStr().slice(0, 4);
  const n = m ? String(+m[2]).padStart(2, '0') : '00';
  const code = (masterCodes || {})[kat] || String(kat || 'LL').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'LL';
  return `${y}-${n}-${code}-`;
}
function nextCostNo(p, D, kat, exceptId, masterCodes) {
  const pre = costPrefix(p, kat, masterCodes);
  let mx = 0;
  Object.values(D || {}).forEach((d) =>
    (d.costs || []).forEach((c) => {
      if (c.id !== exceptId && c.no && c.no.startsWith(pre)) {
        const n = parseInt(c.no.slice(pre.length), 10);
        if (n > mx) mx = n;
      }
    })
  );
  return pre + String(mx + 1).padStart(3, '0');
}

export default function ProjectDetailView({
  dark,
  project,
  master,
  days = {},
  activeTab,
  perms = {},
  onTabChange,
  onBack,
  onOpenPlan,
  onUpdateProject,
  onSaveDay
}) {
  const [localTab, setLocalTab] = useState('ringkasan');
  const [kurvaScope, setKurvaScope] = useState('project'); // 'project' | 'product' | 'area'
  const tab = activeTab || localTab;
  const setTab = (t) => {
    setLocalTab(t);
    if (onTabChange) onTabChange(t);
  };
  const [date, setDate] = useState(() => todayStr());
  const [revOpen, setRevOpen] = useState({});
  const [costForm, setCostForm] = useState({ date: todayStr(), kategori: 'Consumable', desc: '', qty: 1, price: '' });
  const [closeDate, setCloseDate] = useState(() => todayStr());
  const [statusBusy, setStatusBusy] = useState(false);
  const [ringkasanAudience, setRingkasanAudience] = useState('Internal'); // 'Internal' | 'Customer'
  const [regDraft, setRegDraft] = useState(() => clone(project?.reg || {}));
  const [regSaved, setRegSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditCat, setAuditCat] = useState('all');
  const [expandedAuditId, setExpandedAuditId] = useState(null);

  useEffect(() => {
    setRegDraft(clone(project?.reg || {}));
  }, [project?.id, project?.reg]);

  useEffect(() => {
    if (!project?.id) return;
    fetch(`/api/install-project-v2/projects/${encodeURIComponent(project.id)}/audit-logs`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => { if (Array.isArray(rows)) setAuditLogs(rows); })
      .catch(() => {});
  }, [project?.id, days, project?.updatedAt, tab]);

  const masterJobs = useMemo(() => master?.jobs || [], [master?.jobs]);
  const masterLevels = useMemo(() => master?.levels || [], [master?.levels]);
  const masterCodes = useMemo(() => master?.codes || {}, [master?.codes]);

  // Build auto-draft if day doesn't exist
  const curDay = useMemo(() => {
    if (!project) return null;
    if (days[date]) return days[date];
    const prevKey = Object.keys(days).filter((k) => k < date && (days[k]?.teams || []).some((t) => (t.members || []).length > 0)).sort().pop();
    const prev = prevKey ? days[prevKey] : null;
    const prevCumMap = cumByLine(days, addDays(date, -1));
    let teams = prev
      ? clone(prev.teams).map((t) => ({
          ...t,
          lines: (t.lines || []).filter(
            (id) => (project.lines || []).some((l) => l.id === id) && (prevCumMap[id] || 0) < 0.999
          )
        }))
      : (project.teams || []).map((t) => ({ teamId: t.id, members: [...(t.members || [])], lines: [], hours: 8 }));
    teams = teams.filter((t) => (project.teams || []).some((pt) => pt.id === t.teamId));
    (project.teams || []).forEach((pt) => {
      if (!teams.some((x) => x.teamId === pt.id)) {
        teams.push({ teamId: pt.id, members: [...(pt.members || [])], lines: [], hours: 8 });
      }
    });
    return {
      date,
      teams,
      prog: {},
      jp: {},
      lv: prev ? clone(prev.lv || {}) : {},
      hse: prev ? clone(prev.hse || {}) : {},
      costs: [],
      cuaca: '',
      catatan: '',
      kendala: '',
      besok: '',
      rev: 0,
      revs: []
    };
  }, [project, days, date]);

  const isClosed = project?.status === 'closed';
  const isLocked = isClosed || Boolean(days[date]?.savedAt && date !== todayStr() && !revOpen[date]);

  // S-Curve & KPIs
  const asOf = project?.status === 'closed' && isDate(project.closedAt) ? project.closedAt : todayStr();
  const baseLines = useMemo(() => (project ? planLines(project) : []), [project]);
  const planVal = useMemo(() => (project ? planAt(baseLines, asOf) : 0), [project, baseLines, asOf]);
  const actVal = useMemo(() => (project ? actualAt(project, days, asOf) : 0), [project, days, asOf]);
  const devVal = actVal - planVal;

  // Cost Compare
  const costSummary = useMemo(() => {
    if (!project) return { rows: [], plan: 0, act: 0, budget: 0, sisaBudget: 0 };
    const mpCost = (project.mpPlan || []).reduce((s, r) => {
      const rt = rateOf(masterLevels, r.source, r.level);
      return s + num(r.qty) * num(r.days) * rt.rate;
    }, 0);
    const allCats = ['Upah manpower', 'Lembur', ...KATEGORI];
    const actMap = {};
    allCats.forEach((k) => { actMap[k] = 0; });
    Object.values(days || {}).forEach((d) => {
      const inf = dayInfo(project, d, masterLevels);
      actMap['Upah manpower'] += inf.base;
      actMap['Lembur'] += inf.otCost;
      (d.costs || []).forEach((c) => {
        const kk = KATEGORI.includes(c.kategori) ? c.kategori : 'Lain-lain';
        actMap[kk] += num(c.qty) * num(c.price);
      });
    });
    const rows = allCats.map((k) => {
      const pl = k === 'Upah manpower' ? mpCost : num((project.costPlan || {})[k]);
      const ac = actMap[k];
      return { k, plan: pl, act: ac, diff: pl - ac };
    });
    const plan = rows.reduce((s, r) => s + r.plan, 0);
    const act = rows.reduce((s, r) => s + r.act, 0);
    const budget = num(project.reg?.budget);
    return { rows, plan, act, budget, sisaBudget: budget - act };
  }, [project, days, masterLevels]);

  // Curve Dates
  const curveData = useMemo(() => {
    if (!project) return { dates: [], plan: [], act: [] };
    const start = minD(project.reg?.estStart, ...(project.lines || []).map((l) => l.start));
    const end = maxD(planEnd(project, project.lines), todayStr());
    const dates = dateRange(start, end, 365);
    const plan = dates.map((d) => planAt(baseLines, d));
    const act = dates.map((d) => (d <= asOf ? actualAt(project, days, d) : null));
    return { dates, plan, act };
  }, [project, baseLines, days, asOf]);

  if (!project || !curDay) return null;

  const saveDayUpdate = async (nextDay) => {
    if (isClosed) return;
    const ok = await onSaveDay(project.id, date, nextDay);
    if (!ok) return;
    const nextDays = { ...(days || {}), [date]: nextDay };
    const shouldRun =
      (project.status === 'planned' || project.status === 'registered') &&
      date <= todayStr() &&
      (nextDay.savedAt || Object.values(nextDay.prog || {}).some((v) => num(v) > 0));
    const nextStatus = shouldRun ? 'running' : project.status;
    const nextStartedAt = shouldRun ? (project.startedAt || date) : project.startedAt;
    const nextSummary = projSummary({ ...project, status: nextStatus, startedAt: nextStartedAt }, nextDays, masterLevels);
    const updated = { ...project, status: nextStatus, startedAt: nextStartedAt, summary: nextSummary };
    onUpdateProject(updated);
    fetch(`/api/install-project-v2/projects/${encodeURIComponent(project.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const persistStatusChange = async (patch) => {
    setStatusBusy(true);
    try {
      const nextP = { ...project, ...patch };
      nextP.summary = projSummary(nextP, days, masterLevels);
      const res = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextP)
      });
      if (res.ok) onUpdateProject(nextP);
    } finally {
      setStatusBusy(false);
    }
  };

  const handleLockDay = () => {
    if (isClosed) return;
    const nextDay = clone(curDay);
    if (revOpen[date]) {
      const snap = clone(curDay);
      delete snap.revs;
      nextDay.revs = [...(nextDay.revs || []), { rev: num(nextDay.rev), ts: Date.now(), snap }].slice(-10);
      nextDay.rev = num(nextDay.rev) + 1;
      nextDay.revAt = Date.now();
      setRevOpen({ ...revOpen, [date]: false });
    } else {
      nextDay.savedAt = Date.now();
    }
    saveDayUpdate(nextDay);
  };

  const todayInfo = dayInfo(project, curDay, masterLevels);
  const prevCum = cumByLine(days, addDays(date, -1));

  const cardCls = dark ? 'bg-[#0b1222]/90 border-cyan-500/25' : 'bg-white border-slate-200 shadow-sm';
  const inputCls = dark ? 'bg-slate-950/80 border-slate-700/80 text-slate-100 focus:border-cyan-400' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';

  const isRegisteredOnly = project.status === 'registered';
  const SUB_TABS = [
    { key: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard, locked: false },
    { key: 'plan', label: 'Plan Awal', icon: CalendarRange, locked: false },
    { key: 'manpower', label: 'Manpower', icon: Users, locked: false },
    { key: 'harian', label: 'Input Harian', icon: ClipboardCheck, locked: isRegisteredOnly },
    { key: 'biaya', label: 'Biaya', icon: Wallet, locked: isRegisteredOnly },
    { key: 'kurva', label: 'Kurva S', icon: TrendingUp, locked: isRegisteredOnly },
    { key: 'laporan', label: 'Laporan', icon: FileText, locked: isRegisteredOnly },
    { key: 'audit', label: 'Audit Log Progres Project', icon: FileText, locked: false }
  ];

  const dateStrip = Array.from({ length: 10 }, (_, idx) => addDays(todayStr(), idx - 9));
  const stLabel = STATUS[project.status] || project.status;

  return (
    <div className="stack">
      {/* Detail Topbar (pure HTML concept) */}
      <div className="detail-top">
        <div className="detail-top-in">
          <button
            type="button"
            onClick={onBack}
            className="back-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Daftar Project</span>
          </button>
          <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
          <span className="detail-proj-id">{project.no}</span>
          <span className="detail-proj-name">
            {project.reg?.customer}{project.reg?.location ? ' · ' + project.reg.location : ''}
          </span>
          <div className="detail-status">
            <span className={`pill st-${project.status}`}>
              {stLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal DTABS */}
      <div className="dtabs" aria-label="Menu Detail">
        <div className="dtabs-in">
          {SUB_TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                disabled={t.locked}
                onClick={() => setTab(t.key)}
                title={t.locked ? 'Isi & kunci Plan Awal terlebih dahulu' : t.label}
                className={active ? 'on' : ''}
              >
                <Icon className="w-3.5 h-3.5 inline mr-1.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isRegisteredOnly && tab !== 'plan' && (
        <div className="warnbox flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Project ini masih berstatus <b>Registered</b>. Lengkapi dan kunci <b>Plan Awal</b> terlebih dahulu sebelum memulai pelaksanaan harian.</span>
          </div>
          <button
            type="button"
            onClick={() => setTab('plan')}
            className="btn sm pri"
          >
            Isi Plan Awal Sekarang →
          </button>
        </div>
      )}

      {/* TAB: RINGKASAN */}
      {tab === 'ringkasan' && (() => {
        const k = calcKpis(project, days, asOf, masterLevels);
        const dd = dataDates(days).slice(-6).reverse();
        const pg = productGroups(project);
        const tone = devTone(k.dev);
        const steps = [
          ['Registrasi', true],
          ['Plan Awal', (project.lines || []).length > 0 && bobotOk(sumBobot(project.lines)) && !!project.baseline],
          ['Manpower & Team', (project.manpower || []).length > 0],
          ['Input Harian', dd.length > 0],
          ['Selesai', project.status === 'closed']
        ];
        return (
          <div className="stack">
            {/* Step Chips */}
            <div className="chips">
              {steps.map(([label, ok], idx) => (
                <span key={label} className={`chip ${ok ? 'on' : ''}`}>
                  <span>{ok ? '✓' : idx + 1}</span>
                  <span>{label}</span>
                </span>
              ))}
            </div>

            {/* 5 KPI Cards */}
            <div className="kpis">
              <div className="kpi">
                <div className="l">Rencana s.d. {fmtDate(k.asOf)}</div>
                <div className="v">{fmtPct(k.plan)}</div>
              </div>
              <div className={`kpi ${tone === 'ok' ? 'good' : tone === 'bad' ? 'badv' : ''}`}>
                <div className="l">Aktual</div>
                <div className="v">{fmtPct(k.actual)}</div>
                <div className="s">{fmtSigned(k.dev)} · {devLabel(k.dev)}</div>
              </div>
              <div className="kpi">
                <div className="l">Hari ke</div>
                <div className="v">{k.elapsed} / {k.total}</div>
                <div className="s">
                  {k.remain >= 0 ? `${k.remain} hari tersisa` : `${Math.abs(k.remain)} hari lewat target`}
                </div>
              </div>
              <div className="kpi">
                <div className="l">Perkiraan selesai</div>
                <div className="v">{k.forecast ? fmtDate(k.forecast) : '-'}</div>
                <div className="s">target {fmtDate(k.finish)}</div>
              </div>
              <div className={`kpi ${k.used > 1 ? 'badv' : ''}`}>
                <div className="l">Biaya vs budget</div>
                <div className="v">{k.used == null ? '-' : fmtPct(k.used, 0)}</div>
                <div className="s">{fmtRp(k.cost)} dari {fmtRp(k.budget)}</div>
              </div>
            </div>

            {/* Kurva S rencana vs aktual */}
            <div className="panel">
              <div className="ph">
                <div>
                  <h2>Kurva S rencana vs aktual</h2>
                  <p className="note">Arahkan kursor/ketuk grafik untuk melihat nilai per tanggal.</p>
                </div>
                <div className="row">
                  <div className="seg" role="group" aria-label="Versi laporan">
                    {['Internal', 'Customer'].map((aud) => (
                      <button
                        key={aud}
                        type="button"
                        onClick={() => setRingkasanAudience(aud)}
                        className={ringkasanAudience === aud ? 'on' : ''}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>
                  {perms.canExport && (
                    <>
                      <button
                        type="button"
                        onClick={() => exportModelToPdf(finalModel(project, days, ringkasanAudience.toLowerCase(), master))}
                        className="btn sm"
                      >
                        Save PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => exportModelToXlsx(finalModel(project, days, ringkasanAudience.toLowerCase(), master))}
                        className="btn sm"
                      >
                        Export Excel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {curveData.dates.length > 1 ? (() => {
                const n = curveData.dates.length;
                const xAt = (i) => 44 + (836 * i) / (n - 1);
                const yAt = (v) => 180 - clamp(v, 0, 1) * 160;
                const step = Math.max(1, Math.ceil(n / 8));
                const todayIdx = project.status === 'running' ? curveData.dates.indexOf(todayStr()) : -1;
                let lastActIdx = -1;
                curveData.act.forEach((v, i) => { if (v != null) lastActIdx = i; });
                return (
                  <div className="space-y-2">
                    <div className="w-full h-56 sm:h-64">
                      <svg viewBox="0 0 900 215" className="w-full h-full overflow-visible">
                        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
                          const y = yAt(v);
                          return (
                            <g key={v}>
                              <line x1="44" x2="880" y1={y} y2={y} stroke={dark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
                              <text x="36" y={y + 3} textAnchor="end" fontSize="11" fill={dark ? '#94a3b8' : '#64748b'}>{Math.round(v * 100)}%</text>
                            </g>
                          );
                        })}
                        {Array.from({ length: n }).map((_, i) => (
                          i % step === 0 ? (
                            <text key={i} x={xAt(i)} y="200" textAnchor="middle" fontSize="10.5" fill={dark ? '#94a3b8' : '#64748b'}>
                              {fmtDate(curveData.dates[i]).replace(/ \d{4}$/, '')}
                            </text>
                          ) : null
                        ))}
                        {todayIdx >= 0 && (
                          <g>
                            <line x1={xAt(todayIdx)} x2={xAt(todayIdx)} y1="20" y2="180" stroke={dark ? '#64748b' : '#94a3b8'} strokeDasharray="3 3" strokeWidth="1" />
                            <text x={Math.min(xAt(todayIdx) + 5, 835)} y="30" fontSize="10.5" fill={dark ? '#94a3b8' : '#64748b'}>Hari ini</text>
                          </g>
                        )}
                        <path
                          fill="none"
                          stroke="#2a78d6"
                          strokeWidth="2"
                          d={curveData.plan.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`).join(' ')}
                        />
                        <path
                          fill="none"
                          stroke="#eb6834"
                          strokeWidth="2.5"
                          d={curveData.act
                            .map((v, i) => (v == null ? null : `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`))
                            .filter(Boolean)
                            .join(' ')}
                        />
                        {lastActIdx >= 0 && (
                          <g>
                            <circle cx={xAt(lastActIdx)} cy={yAt(curveData.act[lastActIdx])} r="4" fill="#eb6834" stroke={dark ? '#0f172a' : '#ffffff'} strokeWidth="1.5" />
                            <text x={xAt(lastActIdx) + 7} y={yAt(curveData.act[lastActIdx]) + 3} fontSize="10" fontWeight="700" fill={dark ? '#f1f5f9' : '#0f172a'}>
                              {fmtPct(curveData.act[lastActIdx])}
                            </text>
                          </g>
                        )}
                      </svg>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#2a78d6] inline-block" /> Rencana</span>
                      <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#eb6834] inline-block" /> Aktual</span>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-xs text-slate-400 py-6 text-center">Tambahkan item di Plan Awal untuk menampilkan Kurva S.</p>
              )}
            </div>

            {/* Progres per Produk & Input Harian Terakhir */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 18 }}>
              <div className="panel">
                <h2>Progres per produk</h2>
                <p className="note small" style={{ marginBottom: 8 }}>Batang = aktual, garis biru = posisi rencana.</p>
                {Object.keys(pg).length === 0 ? (
                  <p className="note">Belum ada produk di Plan Awal.</p>
                ) : (
                  <div>
                    {Object.entries(pg).map(([name, ls]) => {
                      const bl = planLines(project).filter((l) => ls.some((x) => x.id === l.id));
                      const w = sumBobot(bl);
                      const pl = w > 0 ? planAt(bl, k.asOf) / w : 0;
                      const a = ls.reduce((s, l) => s + num(l.bobot) * lineActual(days, l.id, k.asOf), 0) / (sumBobot(ls) || 1);
                      return (
                        <div key={name} style={{ padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
                          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                            <b>{name}</b>
                            <span className="small">{fmtPct(a)} <span className="note">/ rencana {fmtPct(pl)}</span></span>
                          </div>
                          <div className="bar">
                            <i style={{ width: `${Math.min(100, a * 100)}%` }} />
                            <b style={{ left: `calc(${Math.min(100, pl * 100)}% - 1px)` }} />
                          </div>
                          <div className="note small" style={{ marginTop: 3 }}>
                            {ls.length} item · {fmtNum(ls.reduce((s, l) => s + num(l.qty), 0), 0)} {ls[0]?.satuan} · bobot {fmtPct(sumBobot(ls))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="panel">
                <div className="ph">
                  <h2>Input harian terakhir</h2>
                  {!isRegisteredOnly && (
                    <button
                      type="button"
                      onClick={() => { setDate(todayStr()); setTab('harian'); }}
                      className="btn sm"
                    >
                      Isi hari ini
                    </button>
                  )}
                </div>
                {dd.length === 0 ? (
                  <p className="note">Belum ada input harian.</p>
                ) : (
                  <div className="scroll">
                    <table className="aqpa-tbl">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th className="n">Progres</th>
                          <th className="n">Manpower</th>
                          <th className="n">Biaya</th>
                          <th>Kendala</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dd.map((x) => {
                          const i = dayInfo(project, days[x], masterLevels);
                          const gn = actualAt(project, days, x) - actualAt(project, days, addDays(x, -1));
                          return (
                            <tr key={x}>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => { setDate(x); setTab('harian'); }}
                                  className="btn sm ghost"
                                  style={{ borderColor: 'transparent', padding: '4px 6px' }}
                                >
                                  {fmtDate(x)}
                                </button>
                              </td>
                              <td className="n">{fmtSigned(gn, 2)}</td>
                              <td className="n">{i.mp}</td>
                              <td className="n">{fmtRp(i.cost)}</td>
                              <td>{days[x]?.kendala || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Data Registrasi & Status Project */}
            <div className="panel space-y-4">
              <div className="ph">
                <div>
                  <h2>Data registrasi</h2>
                  <p className="note">
                    No Project {project.no} (otomatis, tidak dapat diubah)
                  </p>
                </div>
                <div className="row">
                  {regSaved && (
                    <span className="pill ok">✓ Tersimpan</span>
                  )}
                  <button
                    type="button"
                    disabled={statusBusy || isClosed}
                    onClick={async () => {
                      if (isClosed) return;
                      await persistStatusChange({
                        reg: {
                          ...regDraft,
                          budget: num(regDraft.budget),
                          estDays: Math.max(1, parseInt(regDraft.estDays, 10) || 1)
                        }
                      });
                      setRegSaved(true);
                      setTimeout(() => setRegSaved(false), 2500);
                    }}
                    className="btn sm"
                  >
                    Simpan Data Registrasi
                  </button>
                </div>
              </div>

              <div className={`grid ${isClosed ? 'aqpa-readonly-lock' : ''}`}>
                <label className="f">
                  Nama Sales
                  <input
                    type="text"
                    value={regDraft.sales || ''}
                    onChange={(e) => setRegDraft((r) => ({ ...r, sales: e.target.value }))}
                  />
                </label>
                <label className="f">
                  Customer Name
                  <input
                    type="text"
                    value={regDraft.customer || ''}
                    onChange={(e) => setRegDraft((r) => ({ ...r, customer: e.target.value }))}
                  />
                </label>
                <label className="f">
                  Location
                  <input
                    type="text"
                    value={regDraft.location || ''}
                    onChange={(e) => setRegDraft((r) => ({ ...r, location: e.target.value }))}
                  />
                </label>
                <label className="f">
                  Leader Project
                  <input
                    type="text"
                    value={regDraft.leader || ''}
                    onChange={(e) => setRegDraft((r) => ({ ...r, leader: e.target.value }))}
                  />
                </label>
                <label className="f">
                  Budget Installation (Rp)
                  <input
                    type="number"
                    min="0"
                    value={regDraft.budget ?? 0}
                    onChange={(e) => setRegDraft((r) => ({ ...r, budget: num(e.target.value) }))}
                  />
                </label>
                <label className="f">
                  Estimasi Mulai
                  <input
                    type="date"
                    value={regDraft.estStart || ''}
                    onChange={(e) => setRegDraft((r) => ({ ...r, estStart: e.target.value }))}
                  />
                </label>
                <label className="f">
                  Estimasi Lama (hari)
                  <input
                    type="number"
                    min="1"
                    value={regDraft.estDays ?? 30}
                    onChange={(e) => setRegDraft((r) => ({ ...r, estDays: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  />
                </label>
                <label className="f">
                  Catatan
                  <input
                    type="text"
                    value={regDraft.note || ''}
                    onChange={(e) => setRegDraft((r) => ({ ...r, note: e.target.value }))}
                  />
                </label>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                {(perms.canProgress || perms.canEdit) && (project.status === 'registered' || project.status === 'planned') && (
                  <button
                    type="button"
                    disabled={statusBusy || isRegisteredOnly}
                    onClick={() => persistStatusChange({ status: 'running', startedAt: project.startedAt || todayStr() })}
                    className="btn pri"
                  >
                    <Play className="w-3.5 h-3.5" /> Mulai Project (Running)
                  </button>
                )}
                {(perms.canProgress || perms.canEdit) && project.status === 'running' && (
                  <>
                    <label className="f" style={{ maxWidth: 200 }}>
                      Tanggal selesai
                      <input
                        type="date"
                        value={closeDate}
                        onChange={(e) => setCloseDate(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={statusBusy}
                      onClick={() => persistStatusChange({ status: 'closed', closedAt: closeDate || todayStr() })}
                      className="btn pri"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesaikan Project
                    </button>
                  </>
                )}
                {project.status === 'closed' && (
                  <>
                    <span className="note">Ditutup {fmtDate(project.closedAt)}</span>
                    {(perms.canProgress || perms.canEdit) && (
                      <button
                        type="button"
                        disabled={statusBusy}
                        onClick={() => persistStatusChange({ status: 'running', closedAt: '' })}
                        className="btn"
                      >
                        Buka kembali
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        );
      })()}

      {/* TAB: AUDIT LOG PROGRES PROJECT */}
      {tab === 'audit' && (
        <div className="stack">
          <div className="panel space-y-3">
            <div className="ph">
              <div>
                <h2>Audit Log Progres Project</h2>
                <p className="note">Riwayat perubahan role manpower, tim, progres, biaya, catatan, dan status (tersimpan relasional di database).</p>
              </div>
              <div className="seg" role="group" aria-label="Filter kategori log">
                {[['all', 'Semua'], ['manpower', 'Manpower'], ['team', 'Tim'], ['progress', 'Progres'], ['cost', 'Biaya'], ['note', 'Catatan']].map(([ck, cl]) => (
                  <button key={ck} type="button" onClick={() => setAuditCat(ck)} className={auditCat === ck ? 'on' : ''}>
                    {cl}
                  </button>
                ))}
              </div>
            </div>
            {(() => {
              const filteredLogs = auditLogs.filter((lg) => auditCat === 'all' || lg.category === auditCat);
              if (!filteredLogs.length) {
                return <p className="note">Belum ada log perubahan tercatat.</p>;
              }
              return (
                <div className="scroll" style={{ maxHeight: 600 }}>
                  <table className="aqpa-tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}></th>
                        <th>No</th>
                        <th>Waktu &amp; Tanggal</th>
                        <th>Pelaku (Aktor)</th>
                        <th>Aksi</th>
                        <th>Kategori</th>
                        <th>Tanggal Data</th>
                        <th>Rev</th>
                        <th>Ringkasan Perubahan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((lg, idx) => {
                        const isOpen = expandedAuditId === lg.id;
                        const dtObj = lg.created_at ? new Date(lg.created_at) : null;
                        const datePart = dtObj ? dtObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                        const timePart = dtObj ? dtObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                        const dayPart = dtObj ? dtObj.toLocaleDateString('id-ID', { weekday: 'long' }) : '';
                        return (
                          <Fragment key={lg.id}>
                            <tr
                              onClick={() => setExpandedAuditId(isOpen ? null : lg.id)}
                              style={{ cursor: 'pointer', background: isOpen ? 'var(--soft)' : undefined }}
                            >
                              <td style={{ textAlign: 'center', fontWeight: 700 }}>{isOpen ? '▾' : '▸'}</td>
                              <td>{idx + 1}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div>{datePart}</div>
                                {timePart && <div className="note" style={{ fontSize: 12 }}>{timePart} ({dayPart})</div>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{lg.actor_name || 'System'}</td>
                              <td>
                                <span className={`pill ${lg.action === 'tambah' ? 'ok' : lg.action === 'hapus' ? 'bad' : 'warn'}`}>
                                  {lg.action}
                                </span>
                              </td>
                              <td style={{ textTransform: 'capitalize' }}>
                                <span className="pill info">{lg.category}</span>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>{lg.day_date ? fmtDate(lg.day_date) : '-'}</td>
                              <td><span className="pill info">Rev{lg.rev || 0}</span></td>
                              <td>{lg.summary}</td>
                            </tr>
                            {isOpen && (
                              <tr>
                                <td colSpan={9} style={{ padding: 0, background: 'var(--bg)' }}>
                                  <div style={{ margin: 10, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--card)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f5c54', color: '#ffffff', gap: 12, flexWrap: 'wrap' }}>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                                          Audit Inspector: Log ID #{lg.id} — {lg.summary}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.85 }}>
                                          Project {project.no || project.id} • Kategori {lg.category}
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {lg.created_at && (
                                          <span style={{ fontSize: 12, background: 'rgba(0,0,0,0.28)', padding: '3px 8px', borderRadius: 4 }}>
                                            ISO: {lg.created_at}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          className="btn sm"
                                          style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard?.writeText(JSON.stringify(lg, null, 2));
                                          }}
                                        >
                                          Salin JSON
                                        </button>
                                      </div>
                                    </div>
                                    <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                        <div style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--soft)' }}>
                                          <div className="note" style={{ fontSize: 11, textTransform: 'uppercase' }}>PELAKSANA (AKTOR)</div>
                                          <div style={{ fontWeight: 700, marginTop: 2 }}>{lg.actor_name || 'System'}</div>
                                          <div className="note" style={{ fontSize: 12 }}>Proyek: {project.no || project.id}</div>
                                        </div>
                                        <div style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--soft)' }}>
                                          <div className="note" style={{ fontSize: 11, textTransform: 'uppercase' }}>KATEGORI &amp; AKSI</div>
                                          <div style={{ fontWeight: 700, marginTop: 2, textTransform: 'capitalize' }}>{lg.category}</div>
                                          <div className="note" style={{ fontSize: 12 }}>Aksi: {lg.action}</div>
                                        </div>
                                        <div style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--soft)' }}>
                                          <div className="note" style={{ fontSize: 11, textTransform: 'uppercase' }}>REVISI &amp; REFERENSI</div>
                                          <div style={{ fontWeight: 700, marginTop: 2 }}>Rev{lg.rev || 0}</div>
                                          <div className="note" style={{ fontSize: 12 }}>Log ID: #{lg.id}</div>
                                        </div>
                                        <div style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--soft)' }}>
                                          <div className="note" style={{ fontSize: 11, textTransform: 'uppercase' }}>WAKTU TERCATAT</div>
                                          <div style={{ fontWeight: 700, marginTop: 2 }}>{datePart}</div>
                                          <div className="note" style={{ fontSize: 12 }}>{timePart || '-'}</div>
                                        </div>
                                      </div>
                                      <div style={{ padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--soft)' }}>
                                        <div className="note" style={{ fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>DESKRIPSI LENGKAP AKTIVITAS</div>
                                        <div style={{ fontWeight: 700 }}>{lg.summary}</div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB: PLAN AWAL */}
      {tab === 'plan' && (
        <PlanView
          inline
          dark={dark}
          project={project}
          master={master}
          onUpdateProject={onUpdateProject}
          onSavedBaseline={() => setTab('ringkasan')}
        />
      )}

      {/* TAB 1: INPUT HARIAN */}
      {tab === 'harian' && (
        <DailyInput
          dark={dark}
          cardCls={cardCls}
          inputCls={inputCls}
          project={project}
          days={days}
          date={date}
          setDate={setDate}
          dateStrip={dateStrip}
          curDay={curDay}
          isLocked={isLocked}
          isClosed={isClosed}
          revOpen={revOpen}
          setRevOpen={setRevOpen}
          todayInfo={todayInfo}
          baseLines={baseLines}
          prevCum={prevCum}
          masterJobs={masterJobs}
          saveDayUpdate={saveDayUpdate}
          handleLockDay={handleLockDay}
          onUpdateProject={onUpdateProject}
          onViewReport={() => setTab('laporan')}
          fmtDate={fmtDate}
          fmtNum={fmtNum}
          fmtRp={fmtRp}
          fmtPct={fmtPct}
          planAt={planAt}
          planFrac={planFrac}
          actualAt={actualAt}
          jobCum={jobCum}
          jobNorm={jobNorm}
          levelOn={levelOn}
          costPrefix={costPrefix}
          nextCostNo={nextCostNo}
        />
      )}

      {/* TAB 2: MANPOWER & TIM */}
      {tab === 'manpower' && (
        <ManpowerView
          dark={dark}
          project={project}
          master={master}
          days={days}
          onUpdateProject={onUpdateProject}
          onSaveDay={onSaveDay}
        />
      )}

      {/* TAB 3: BIAYA */}
      {tab === 'biaya' && (() => {
        const allCostItems = [];
        Object.keys(days || {}).sort().reverse().forEach((dt) => {
          const d = days[dt];
          const locked = Boolean(d?.savedAt && dt !== todayStr() && !revOpen[dt]);
          const inf = dayInfo(project, d, masterLevels);
          if (inf.base > 0) {
            allCostItems.push({
              date: dt,
              auto: true,
              locked,
              c: {
                id: `auto-wage-${dt}`,
                no: 'AUTO',
                kategori: 'Upah manpower',
                desc: `${inf.hadir} orang hadir × tarif Tabel 2`,
                qty: inf.hadir,
                price: null,
                total: inf.base
              }
            });
          }
          if (inf.otCost > 0) {
            allCostItems.push({
              date: dt,
              auto: true,
              locked,
              c: {
                id: `auto-ot-${dt}`,
                no: 'AUTO',
                kategori: 'Lembur',
                desc: `${fmtNum(inf.otH, 1)} jam lembur × tarif Tabel 2`,
                qty: inf.otH,
                price: null,
                total: inf.otCost
              }
            });
          }
          (d?.costs || []).forEach((c) => {
            allCostItems.push({ date: dt, auto: false, c, locked });
          });
        });
        const upahLembur = (costSummary.rows.find((r) => r.k === 'Upah manpower')?.act || 0) + (costSummary.rows.find((r) => r.k === 'Lembur')?.act || 0);
        const catBars = [
          ['Upah manpower & lembur (otomatis)', upahLembur],
          ...KATEGORI.map((k) => [k, costSummary.rows.find((r) => r.k === k)?.act || 0])
        ].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        const maxBar = Math.max(1, ...catBars.map(([, v]) => v));
        const usedPct = costSummary.budget > 0 ? costSummary.act / costSummary.budget : null;
        const sisaPlan = costSummary.plan - costSummary.act;
        const reserve = costSummary.budget - costSummary.plan;

        return (
          <div className="stack">
            {/* Header */}
            <div className="ph">
              <div>
                <h1>Biaya project</h1>
                <p className="note">
                  Semua biaya yang timbul selama instalasi {project.no} dibandingkan dengan budget instalasi.
                </p>
              </div>
              <div className="row">
                <button type="button" onClick={() => window.print()} className="btn sm">
                  Save PDF
                </button>
              </div>
            </div>

            {/* 4 KPI */}
            <div className="kpis">
              <div className="kpi">
                <div className="l">Total biaya</div>
                <div className="v">{fmtRp(costSummary.act)}</div>
              </div>
              <div className="kpi">
                <div className="l">Budget instalasi</div>
                <div className="v">{fmtRp(costSummary.budget)}</div>
              </div>
              <div className={`kpi ${usedPct > 1 ? 'badv' : ''}`}>
                <div className="l">Terpakai</div>
                <div className="v">{usedPct == null ? '–' : fmtPct(usedPct)}</div>
                <div className="s">progres aktual {fmtPct(actVal)}</div>
              </div>
              <div className={`kpi ${costSummary.sisaBudget < 0 ? 'badv' : ''}`}>
                <div className="l">Sisa budget</div>
                <div className="v">{fmtRp(costSummary.sisaBudget)}</div>
              </div>
            </div>

            {/* Rencana vs aktual */}
            <div className="panel space-y-4">
              <div className="ph">
                <div>
                  <h2>Rencana vs aktual</h2>
                  <p className="note">
                    Pembanding dari Plan Awal › Rencana biaya.
                  </p>
                </div>
                <button type="button" onClick={() => setTab('laporan')} className="btn sm">
                  Buka laporan
                </button>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>Rencana vs aktual per kategori</h3>
                <div className="scroll">
                  <table className="aqpa-tbl">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th className="n">Rencana</th>
                        <th className="n">Aktual</th>
                        <th className="n">Selisih (Rencana − Aktual)</th>
                        <th className="n">% Terpakai</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costSummary.rows.map((r) => {
                        const pct = r.plan > 0 ? r.act / r.plan : null;
                        const status = r.plan <= 0 && r.act > 0
                          ? 'Tidak direncanakan'
                          : r.diff < 0
                            ? `Kelebihan ${fmtRp(-r.diff)}`
                            : r.act > 0
                              ? `Sisa ${fmtRp(r.diff)}`
                              : 'Belum terpakai';
                        return (
                          <tr key={r.k}>
                            <td>{r.k}</td>
                            <td className="n">{fmtRp(r.plan)}</td>
                            <td className="n">{fmtRp(r.act)}</td>
                            <td className="n" style={r.diff < 0 ? { color: 'var(--bad)' } : undefined}>{fmtRp(r.diff)}</td>
                            <td className="n">{pct == null ? '–' : fmtPct(pct)}</td>
                            <td>{status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="tot">
                        <td>TOTAL</td>
                        <td className="n">{fmtRp(costSummary.plan)}</td>
                        <td className="n">{fmtRp(costSummary.act)}</td>
                        <td className="n">{fmtRp(sisaPlan)}</td>
                        <td className="n">{costSummary.plan > 0 ? fmtPct(costSummary.act / costSummary.plan) : '–'}</td>
                        <td>{sisaPlan < 0 ? `Kelebihan ${fmtRp(-sisaPlan)}` : `Sisa ${fmtRp(sisaPlan)}`}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>Posisi budget</h3>
                <div className="scroll">
                  <table className="aqpa-tbl">
                    <thead>
                      <tr>
                        <th>Uraian</th>
                        <th className="n">Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Budget instalasi</td><td className="n">{fmtRp(costSummary.budget)}</td></tr>
                      <tr><td>Rencana biaya</td><td className="n">{fmtRp(costSummary.plan)}</td></tr>
                      <tr><td>Cadangan budget (budget − rencana)</td><td className="n">{fmtRp(reserve)}</td></tr>
                      <tr><td>Biaya aktual</td><td className="n">{fmtRp(costSummary.act)}</td></tr>
                      <tr className="tot">
                        <td>{costSummary.sisaBudget < 0 ? 'KELEBIHAN BUDGET (aktual − budget)' : 'SISA BUDGET (budget − aktual)'}</td>
                        <td className="n" style={{ color: costSummary.sisaBudget < 0 ? 'var(--bad)' : 'var(--lime)' }}>
                          {fmtRp(Math.abs(costSummary.sisaBudget))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Per kategori */}
            <div className="panel">
              <h2>Per kategori</h2>
              {catBars.length === 0 ? (
                <p className="note" style={{ marginTop: 8 }}>Belum ada biaya.</p>
              ) : (
                <div style={{ marginTop: 10 }}>
                  {catBars.map(([label, val]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 200px) minmax(0, 1fr) auto', gap: 10, alignItems: 'center', padding: '5px 0' }}>
                      <span>{label}</span>
                      <div className="bar" style={{ height: 12 }}>
                        <i style={{ width: `${(val / maxBar) * 100}%`, background: 'var(--steel)' }} />
                      </div>
                      <b className="small">{fmtRp(val)}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Catat biaya */}
            <div className={`panel ${isClosed ? 'aqpa-readonly-lock' : ''}`}>
              <div className="ph">
                <h2>Catat biaya</h2>
                {isClosed && <span className="pill">🔒 Terkunci (Closed)</span>}
              </div>
              <div className="grid" style={{ marginTop: 10 }}>
                <label className="f">Tanggal<input type="date" disabled={isClosed} value={costForm.date} onChange={(e) => setCostForm({ ...costForm, date: e.target.value })} /></label>
                <label className="f">Kategori<select disabled={isClosed} value={costForm.kategori} onChange={(e) => setCostForm({ ...costForm, kategori: e.target.value })}>{KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
                <label className="f">Deskripsi<input type="text" disabled={isClosed} placeholder="cth: Sewa chain block 2 ton" value={costForm.desc} onChange={(e) => setCostForm({ ...costForm, desc: e.target.value })} /></label>
                <label className="f">Qty<input type="number" disabled={isClosed} min="0" value={costForm.qty} onChange={(e) => setCostForm({ ...costForm, qty: e.target.value })} /></label>
                <label className="f">Harga satuan (Rp)<input type="number" disabled={isClosed} min="0" placeholder="0" value={costForm.price} onChange={(e) => setCostForm({ ...costForm, price: e.target.value })} /></label>
                <div className="f" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    disabled={isClosed}
                    onClick={() => {
                      if (isClosed) return;
                      const pr = num(costForm.price);
                      if (!(pr > 0)) return;
                      const targetDate = costForm.date || todayStr();
                      const dayObj = clone(days[targetDate] || { date: targetDate, teams: [], prog: {}, jp: {}, costs: [] });
                      const cid = rid('c');
                      dayObj.costs = [...(dayObj.costs || []), {
                        id: cid,
                        no: nextCostNo(project, days, costForm.kategori, cid, masterCodes),
                        kategori: costForm.kategori,
                        desc: costForm.desc.trim(),
                        qty: num(costForm.qty) || 1,
                        price: pr
                      }];
                      onSaveDay(project.id, targetDate, dayObj);
                      setCostForm({ ...costForm, desc: '', qty: 1, price: '' });
                    }}
                    className="btn pri"
                  >
                    + Catat
                  </button>
                </div>
              </div>
            </div>

            {/* Rincian biaya */}
            <div className="panel">
              <h2>Rincian biaya</h2>
              <div className="scroll" style={{ marginTop: 8 }}>
                <table className="aqpa-tbl ed">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Tanggal</th>
                      <th>Kategori</th>
                      <th>Deskripsi</th>
                      <th className="n">Qty</th>
                      <th className="n">Harga satuan</th>
                      <th className="n">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCostItems.length === 0 ? (
                      <tr><td colSpan={8} className="note">Belum ada biaya dicatat.</td></tr>
                    ) : (
                      allCostItems.map(({ date: dt, auto, c, locked }) => (
                        <tr key={`${dt}-${c.id}`} style={locked || auto ? { opacity: auto ? 0.85 : 0.65 } : undefined}>
                          <td style={{ whiteSpace: 'nowrap' }}><b>{c.no || '-'}</b></td>
                          <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(dt)}</td>
                          <td>{c.kategori}</td>
                          <td>{c.desc || '-'}</td>
                          <td className="n">{num(c.qty)}</td>
                          <td className="n">{auto ? '-' : fmtRp(c.price)}</td>
                          <td className="n">{fmtRp(auto ? c.total : num(c.qty) * num(c.price))}</td>
                          <td className="n">
                            {auto ? (
                              <span title="Dihitung otomatis dari kehadiran & jam lembur di Input Harian">🔒</span>
                            ) : isClosed ? (
                              <span title="Project berstatus Closed (read-only)">🔒</span>
                            ) : locked ? (
                              <span title="Terkunci – ubah lewat revisi di Input Harian">🔒</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const dayObj = clone(days[dt]);
                                  dayObj.costs = (dayObj.costs || []).filter((x) => x.id !== c.id);
                                  onSaveDay(project.id, dt, dayObj);
                                }}
                                className="x"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="note small" style={{ marginTop: 8 }}>
                Upah manpower dihitung otomatis dari kehadiran harian × rate level (Master Data Tabel 2), jam di atas 8 dihitung lembur. Nomor biaya dibuat otomatis: TAHUN-NOPROJECT-KODE-URUT.
              </p>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: KURVA S & RINGKASAN */}
      {tab === 'kurva' && (
        <div className="stack">
          <div className="ph">
            <div>
              <h1>Kurva S rencana vs aktual</h1>
              <p className="note">Posisi {fmtDate(asOf)}: rencana {fmtPct(planVal)}, aktual {fmtPct(actVal)} ({fmtSigned(devVal)}).</p>
            </div>
            {project.status === 'closed' && (
              <button
                type="button"
                onClick={() => onUpdateProject({ ...project, status: 'running', closedAt: '' })}
                className="btn sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Buka Kembali
              </button>
            )}
          </div>

          {/* Sub-tabs: Total project | Per produk | Per area */}
          <div className="seg" role="group" aria-label="Tampilan">
            {[
              { k: 'project', l: 'Total project' },
              { k: 'product', l: 'Per produk' },
              { k: 'area', l: 'Per area' }
            ].map((m) => (
              <button
                key={m.k}
                type="button"
                onClick={() => setKurvaScope(m.k)}
                className={kurvaScope === m.k ? 'on' : ''}
              >
                {m.l}
              </button>
            ))}
          </div>

          <div className="panel space-y-4">

          {kurvaScope === 'project' ? (
            curveData.dates.length > 1 ? (() => {
            const n = curveData.dates.length;
            const xAt = (i) => 44 + (836 * i) / (n - 1);
            const yAt = (v) => 180 - clamp(v, 0, 1) * 160;
            const step = Math.max(1, Math.ceil(n / 8));
            const todayIdx = project.status === 'running' ? curveData.dates.indexOf(todayStr()) : -1;
            let lastActIdx = -1;
            curveData.act.forEach((v, i) => { if (v != null) lastActIdx = i; });
            return (
              <div className="space-y-2">
                <div className="w-full h-72">
                  <svg viewBox="0 0 900 215" className="w-full h-full overflow-visible">
                    {[0, 0.25, 0.5, 0.75, 1].map((v) => {
                      const y = yAt(v);
                      return (
                        <g key={v}>
                          <line x1="44" x2="880" y1={y} y2={y} stroke={dark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
                          <text x="36" y={y + 3} textAnchor="end" fontSize="11" fill={dark ? '#94a3b8' : '#64748b'}>{Math.round(v * 100)}%</text>
                        </g>
                      );
                    })}
                    {Array.from({ length: n }).map((_, i) => (
                      i % step === 0 ? (
                        <text key={i} x={xAt(i)} y="200" textAnchor="middle" fontSize="10.5" fill={dark ? '#94a3b8' : '#64748b'}>
                          {fmtDate(curveData.dates[i]).replace(/ \d{4}$/, '')}
                        </text>
                      ) : null
                    ))}
                    {todayIdx >= 0 && (
                      <g>
                        <line x1={xAt(todayIdx)} x2={xAt(todayIdx)} y1="20" y2="180" stroke={dark ? '#64748b' : '#94a3b8'} strokeDasharray="3 3" strokeWidth="1" />
                        <text x={Math.min(xAt(todayIdx) + 5, 835)} y="30" fontSize="10.5" fill={dark ? '#94a3b8' : '#64748b'}>Hari ini</text>
                      </g>
                    )}
                    <path
                      fill="none"
                      stroke="#2a78d6"
                      strokeWidth="2"
                      d={curveData.plan.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`).join(' ')}
                    />
                    <path
                      fill="none"
                      stroke="#eb6834"
                      strokeWidth="2.5"
                      d={curveData.act
                        .map((v, i) => (v == null ? null : `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`))
                        .filter(Boolean)
                        .join(' ')}
                    />
                    {lastActIdx >= 0 && (
                      <g>
                        <circle cx={xAt(lastActIdx)} cy={yAt(curveData.act[lastActIdx])} r="4" fill="#eb6834" stroke={dark ? '#0f172a' : '#ffffff'} strokeWidth="1.5" />
                        <text x={xAt(lastActIdx) + 7} y={yAt(curveData.act[lastActIdx]) + 3} fontSize="10" fontWeight="700" fill={dark ? '#f1f5f9' : '#0f172a'}>
                          {fmtPct(curveData.act[lastActIdx])}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#2a78d6] inline-block" /> Rencana</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#eb6834] inline-block" /> Aktual</span>
                </div>

                {/* Rekap mingguan */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Rekap mingguan</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                          <th className="py-2 px-2">Minggu</th>
                          <th className="py-2 px-2">Periode</th>
                          <th className="py-2 px-2 text-right">Rencana kumulatif</th>
                          <th className="py-2 px-2 text-right">Aktual kumulatif</th>
                          <th className="py-2 px-2 text-right">Deviasi</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${dark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                        {(() => {
                          const startD = curveData.dates[0];
                          const endD = curveData.dates[curveData.dates.length - 1];
                          const weekStartOf = (s) => addDays(s, -((dow(s) + 6) % 7));
                          const baseWs = weekStartOf(project.reg?.estStart || startD);
                          let ws = weekStartOf(startD);
                          const rows = [];
                          while (ws <= endD && rows.length < 104) {
                            const we = addDays(ws, 6);
                            const wkNum = Math.floor(diffDays(baseWs, ws) / 7) + 1;
                            const pl = planAt(baseLines, we);
                            const hasAct = ws <= asOf;
                            const a = hasAct ? actualAt(project, days, minD(we, asOf)) : null;
                            const dv = a == null ? null : a - pl;
                            rows.push(
                              <tr key={ws}>
                                <td className="py-1.5 px-2 font-medium">Minggu ke-{wkNum}</td>
                                <td className="py-1.5 px-2 text-slate-400">{fmtDate(ws)} – {fmtDate(we)}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{fmtPct(pl)}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{a == null ? '–' : fmtPct(a)}</td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {dv == null ? '–' : (
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                      dv >= -0.005
                                        ? dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                                        : dv >= -0.05
                                          ? dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'
                                          : dark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {fmtSigned(dv)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                            ws = addDays(ws, 7);
                          }
                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })() : (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada data jadwal.</p>
          )
          ) : (() => {
            const groups = {};
            planLines(project).forEach((l) => {
              const key =
                kurvaScope === 'product'
                  ? l.product || l.produk || 'Lainnya'
                  : l.area || 'Umum';
              if (!groups[key]) groups[key] = [];
              groups[key].push(l);
            });
            const entries = Object.entries(groups);
            if (!entries.length || curveData.dates.length < 2) {
              return <p className="text-xs text-slate-400 py-8 text-center">Belum ada data jadwal.</p>;
            }
            const dates = curveData.dates;
            const n = dates.length;
            const xAt = (i) => 38 + (404 * i) / (n - 1);
            const yAt = (v) => 140 - clamp(v, 0, 1) * 120;
            const step = Math.max(1, Math.ceil(n / 5));
            const todayIdx = project.status === 'running' ? dates.indexOf(todayStr()) : -1;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entries.map(([name, ls]) => {
                  const bob = ls.reduce((s, x) => s + num(x.bobot), 0);
                  const plSeries = dates.map((d) => (bob > 0 ? planAt(ls, d) / bob : 0));
                  const acSeries = dates.map((d) => {
                    if (d > asOf) return null;
                    const c = cumByLine(days, d);
                    const sum = ls.reduce((s, l) => s + num(l.bobot) * Math.min(1, c[l.id] || 0), 0);
                    return bob > 0 ? sum / bob : 0;
                  });
                  const plNow = bob > 0 ? planAt(ls, asOf) / bob : 0;
                  const cNow = cumByLine(days, asOf);
                  const acNow = bob > 0 ? ls.reduce((s, l) => s + num(l.bobot) * Math.min(1, cNow[l.id] || 0), 0) / bob : 0;
                  const onTrack = acNow >= plNow - 0.005;
                  return (
                    <div key={name} className={`rounded-xl border p-3.5 space-y-2 ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs truncate">{name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                          onTrack
                            ? dark ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : dark ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {fmtPct(acNow)} / {fmtPct(plNow)}
                        </span>
                      </div>
                      <div className="w-full h-44">
                        <svg viewBox="0 0 460 170" className="w-full h-full overflow-visible">
                          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
                            const y = yAt(v);
                            return (
                              <g key={v}>
                                <line x1="38" x2="442" y1={y} y2={y} stroke={dark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
                                <text x="32" y={y + 3} textAnchor="end" fontSize="9.5" fill={dark ? '#94a3b8' : '#64748b'}>{Math.round(v * 100)}%</text>
                              </g>
                            );
                          })}
                          {Array.from({ length: n }).map((_, i) => (
                            i % step === 0 ? (
                              <text key={i} x={xAt(i)} y="158" textAnchor="middle" fontSize="9.5" fill={dark ? '#94a3b8' : '#64748b'}>
                                {fmtDate(dates[i]).replace(/ \d{4}$/, '')}
                              </text>
                            ) : null
                          ))}
                          {todayIdx >= 0 && (
                            <line x1={xAt(todayIdx)} x2={xAt(todayIdx)} y1="20" y2="140" stroke={dark ? '#64748b' : '#94a3b8'} strokeDasharray="3 3" strokeWidth="1" />
                          )}
                          <path
                            fill="none"
                            stroke="#2a78d6"
                            strokeWidth="1.8"
                            d={plSeries.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`).join(' ')}
                          />
                          <path
                            fill="none"
                            stroke="#eb6834"
                            strokeWidth="2.2"
                            d={acSeries.map((v, i) => (v == null ? null : `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(v)}`)).filter(Boolean).join(' ')}
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-0.5 bg-[#2a78d6] inline-block" /> Rencana</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-0.5 bg-[#eb6834] inline-block" /> Aktual</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>
        </div>
      )}

      {/* TAB: LAPORAN */}
      {tab === 'laporan' && (
        <LaporanView
          dark={dark}
          project={project}
          days={days}
          master={master}
          initialDate={date}
        />
      )}

      {/* TAB: IMPOR / EKSPOR EXCEL */}
      {tab === 'data' && (
        <DataImportExportView
          dark={dark}
          project={project}
          days={days}
          master={master}
          onUpdateProject={onUpdateProject}
          onSaveDay={onSaveDay}
        />
      )}
    </div>
  );
}
