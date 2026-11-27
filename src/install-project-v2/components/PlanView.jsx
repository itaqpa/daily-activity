import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Lock,
  Check,
  AlertTriangle,
  Sliders,
  Users,
  UserPlus,
  Wallet,
  TrendingUp,
  Save,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Search
} from 'lucide-react';

const SATUAN = ['unit', 'set', 'pcs', 'm²', 'm'];
const SOURCES = ['Internal', 'External'];
const KATEGORI = ['Part / Material', 'Consumable', 'Sewa Alat', 'Transportasi', 'Akomodasi', 'Konsumsi', 'Lain-lain'];

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const rid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const toUTC = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const addDays = (s, n) => {
  if (!isDate(s)) return '';
  return new Date(toUTC(s) + n * 86400000).toISOString().slice(0, 10);
};
const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
const dayCount = (a, b) => diffDays(a, b) + 1;
const minD = (...a) => a.filter(isDate).sort()[0] || '';
const maxD = (...a) => a.filter(isDate).sort().slice(-1)[0] || '';
const lineEnd = (l) => addDays(l.start, Math.max(1, l.days) - 1);
const sumBobot = (lines) => lines.reduce((s, l) => s + num(l.bobot), 0);
const bobotOk = (s) => Math.abs(s - 1) < 0.0005;
const fmtRp = (n) => 'Rp ' + Math.round(num(n)).toLocaleString('id-ID');
const fmtPct = (f, d = 1) => (num(f) * 100).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const fmtNum = (n, d = 0) => num(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDate = (s) => {
  if (!isDate(s)) return '-';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
};

function planFrac(l, d) {
  if (!isDate(l.start) || d < l.start) return 0;
  const e = lineEnd(l);
  if (d >= e) return 1;
  return dayCount(l.start, d) / Math.max(1, l.days);
}
const planAt = (lines, d) => lines.reduce((s, l) => s + num(l.bobot) * planFrac(l, d), 0);

function dateRange(a, b, max = 365) {
  const o = [];
  if (!isDate(a) || !isDate(b) || a > b) return o;
  let d = a;
  while (d <= b && o.length < max) {
    o.push(d);
    d = addDays(d, 1);
  }
  return o;
}

function normJobs(jobs) {
  const arr = clone(jobs);
  const t = arr.reduce((s, j) => s + num(j.bobot), 0);
  if (t <= 0) {
    arr.forEach((j) => { j.bobot = 1 / arr.length; });
  } else {
    arr.forEach((j) => { j.bobot = +(num(j.bobot) / t).toFixed(6); });
  }
  if (arr.length) {
    arr[arr.length - 1].bobot = +(1 - arr.slice(0, -1).reduce((s, j) => s + j.bobot, 0)).toFixed(6);
  }
  return arr;
}

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Jadwal & Item',
    sub: 'Periode, produk & bobot',
    desc: 'Atur tanggal mulai, durasi project, serta daftar item instalasi beserta bobotnya hingga total 100%.',
    icon: CalendarRange
  },
  {
    id: 2,
    title: 'Kuota Manpower',
    sub: 'Kebutuhan SDM & hari',
    desc: 'Tentukan estimasi jumlah dan hari kerja per level manpower sebagai dasar perhitungan rencana upah.',
    icon: Users
  },
  {
    id: 3,
    title: 'Personel & Tim',
    sub: 'Pilih user & bagi tim',
    desc: 'Pilih personel internal atau pekerja external yang ditugaskan dan kelompokkan ke dalam tim kerja.',
    icon: UserPlus
  },
  {
    id: 4,
    title: 'Rencana Biaya',
    sub: 'Anggaran per kategori',
    desc: 'Lengkapi alokasi biaya operasional di luar upah manpower dan pantau utilisasinya terhadap budget.',
    icon: Wallet
  },
  {
    id: 5,
    title: 'Kurva S & Baseline',
    sub: 'Preview & kunci plan',
    desc: 'Tinjau grafik Kurva S rencana dan kelengkapan data sebelum mengunci plan sebagai baseline.',
    icon: TrendingUp
  }
];

export default function PlanView(props) {
  const { open = true, inline = false, onClose, dark, project } = props;

  useEffect(() => {
    if (inline || !open || !onClose) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inline, open, onClose]);

  if (!inline && !open) return null;

  if (!project) {
    if (inline) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl border p-8 text-center space-y-4 ${
            dark
              ? 'bg-[#0b1222] border-cyan-500/25 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}
        >
          <p className="text-sm text-slate-400">Pilih atau registrasikan project terlebih dahulu di menu Project.</p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                dark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    );
  }
  return <PlanViewInner key={project.id} {...props} />;
}

function PlanViewInner({ inline = false, onClose, onSavedBaseline, dark, project, master, onUpdateProject }) {
  const [p, setP] = useState(() => clone(project));
  const [step, setStep] = useState(1);
  const [openJobs, setOpenJobs] = useState({});
  const [customJobNames, setCustomJobNames] = useState({});
  const [showAddForm, setShowAddForm] = useState(() => !(project.lines && project.lines.length > 0));
  const [openSec, setOpenSec] = useState({ items: true, mp: true, cost: true, kurva: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [userList, setUserList] = useState([]);
  const [teamSearch, setTeamSearch] = useState({});
  const [extOpen, setExtOpen] = useState({});
  const [extForm, setExtForm] = useState({});
  const [newTeamName, setNewTeamName] = useState('');

  const saveTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const products = master?.products || [];
  const masterJobs = master?.jobs || [];
  const masterLevels = master?.levels || [];

  const [newLine, setNewLine] = useState({
    product: products[0]?.name || '',
    area: '',
    qty: 1,
    satuan: 'unit',
    start: project.reg?.estStart || '',
    days: 7,
    skip: []
  });

  useEffect(() => {
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const arr = Array.isArray(d) ? d : (d.data || []);
        setUserList([...new Set(arr.map((u) => u.name || u.nama || u.username).filter(Boolean))]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((text) => {
    if (!text) return;
    setMsg(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setMsg(''), 2800);
  }, []);

  const sendProjectPut = useCallback(async (nextP, toastMsg) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(nextP.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextP)
      });
      if (res.ok) {
        onUpdateProject(nextP);
        if (toastMsg) showToast(toastMsg);
        return true;
      }
      showToast('Gagal menyimpan perubahan');
      return false;
    } catch (err) {
      console.error('Save plan error:', err);
      showToast('Gagal menyimpan perubahan');
      return false;
    } finally {
      setSaving(false);
    }
  }, [onUpdateProject, showToast]);

  const persistProject = useCallback((nextP, toastMsg, { debounce = false } = {}) => {
    setP(nextP);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (debounce) {
      saveTimerRef.current = setTimeout(() => {
        sendProjectPut(nextP, toastMsg);
      }, 450);
      return Promise.resolve(true);
    }
    return sendProjectPut(nextP, toastMsg);
  }, [sendProjectPut]);

  const regStart = p.reg?.estStart;
  const regDays = p.reg?.estDays;
  const estFinish = useMemo(() => {
    return isDate(regStart) ? addDays(regStart, Math.max(1, regDays || 1) - 1) : '';
  }, [regStart, regDays]);

  const totalBobot = sumBobot(p?.lines || []);
  const isBobotValid = bobotOk(totalBobot);
  const hasOverTarget = (p?.lines || []).some((l) => estFinish && lineEnd(l) > estFinish);

  const nextCode = () => {
    let n = 0;
    (p?.lines || []).forEach((l) => {
      const m = /(\d+)$/.exec(l.code || '');
      if (m) n = Math.max(n, +m[1]);
    });
    return 'L' + String(n + 1).padStart(2, '0');
  };

  const handleAddLine = () => {
    if (!newLine.product || !p) return;
    const jobs = normJobs(masterJobs.filter((j) => !newLine.skip.includes(j.id)));
    const item = {
      id: rid('l'),
      code: nextCode(),
      product: newLine.product,
      area: newLine.area.trim(),
      qty: num(newLine.qty) || 1,
      satuan: newLine.satuan || 'unit',
      bobot: 0,
      start: isDate(newLine.start) ? newLine.start : p.reg.estStart,
      days: Math.max(1, parseInt(newLine.days, 10) || 1),
      jobs
    };
    const nextP = { ...p, lines: [...(p.lines || []), item] };
    setNewLine({ ...newLine, area: '' });
    persistProject(nextP, 'Item ditambahkan');
  };

  const updateLine = (lid, patch, debounce = false) => {
    const nextP = {
      ...p,
      lines: p.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l))
    };
    persistProject(nextP, '', { debounce });
  };

  const duplicateLine = (l) => {
    const idx = p.lines.findIndex((x) => x.id === l.id);
    const copy = { ...clone(l), id: rid('l'), code: nextCode(), bobot: 0 };
    const lines = [...p.lines];
    lines.splice(idx + 1, 0, copy);
    persistProject({ ...p, lines }, 'Item diduplikat');
  };

  const deleteLine = (lid) => {
    persistProject({ ...p, lines: p.lines.filter((l) => l.id !== lid) }, 'Item dihapus');
  };

  const bobotRata = () => {
    const n = p.lines.length;
    if (!n) return;
    const lines = p.lines.map((l, i) => ({
      ...l,
      bobot: i < n - 1 ? +(1 / n).toFixed(6) : 0
    }));
    lines[n - 1].bobot = +(1 - lines.slice(0, -1).reduce((s, l) => s + l.bobot, 0)).toFixed(6);
    persistProject({ ...p, lines }, 'Bobot dibagi rata');
  };

  const bobotAuto = () => {
    const n = p.lines.length;
    if (!n) return;
    const w = p.lines.map((l) => (num(l.qty) || 1) * Math.max(1, l.days));
    const t = w.reduce((s, x) => s + x, 0) || 1;
    const lines = p.lines.map((l, i) => ({
      ...l,
      bobot: i < n - 1 ? +(w[i] / t).toFixed(6) : 0
    }));
    lines[n - 1].bobot = +(1 - lines.slice(0, -1).reduce((s, l) => s + l.bobot, 0)).toFixed(6);
    persistProject({ ...p, lines }, 'Bobot dihitung otomatis (Qty × Lama)');
  };

  // Manpower Plan helpers
  const rateOf = (source, level) => {
    const v = masterLevels.find((x) => x.source === source && x.level === level) || masterLevels.find((x) => x.level === level);
    return v ? { rate: num(v.rate), ot: num(v.ot) } : { rate: 0, ot: 0 };
  };

  const mpRows = (p?.mpPlan || []).map((r) => {
    const rt = rateOf(r.source, r.level);
    const md = num(r.qty) * num(r.days);
    return { ...r, rate: rt.rate, ot: rt.ot, mandays: md, cost: md * rt.rate };
  });
  const totalMpCost = mpRows.reduce((s, x) => s + x.cost, 0);
  const totalMpQty = mpRows.reduce((s, x) => s + num(x.qty), 0);
  const totalMpDays = mpRows.reduce((s, x) => s + x.mandays, 0);

  const addMpPlan = () => {
    const lv = masterLevels[0] || { source: 'Internal', level: 'Helper' };
    const next = [...(p.mpPlan || []), { id: rid('r'), source: lv.source, level: lv.level, qty: 1, days: p.reg.estDays || 30 }];
    persistProject({ ...p, mpPlan: next });
  };

  const updateMpPlan = (id, patch, debounce = false) => {
    const next = (p.mpPlan || []).map((r) => (r.id === id ? { ...r, ...patch } : r));
    persistProject({ ...p, mpPlan: next }, '', { debounce });
  };

  const deleteMpPlan = (id) => {
    persistProject({ ...p, mpPlan: (p.mpPlan || []).filter((r) => r.id !== id) });
  };

  // Cost Plan
  const costRows = ['Upah manpower', 'Lembur', ...KATEGORI];
  const costPlanValues = {};
  costRows.forEach((k) => {
    costPlanValues[k] = k === 'Upah manpower' ? totalMpCost : num((p?.costPlan || {})[k]);
  });
  const totalCostPlan = Object.values(costPlanValues).reduce((s, v) => s + v, 0);
  const budget = num(p?.reg?.budget);

  // Save Baseline
  const handleSaveBaseline = async () => {
    if (!isBobotValid || !p.lines.length || saving) return;
    const nextP = {
      ...p,
      status: p.status === 'registered' ? 'planned' : p.status,
      baseline: { ts: Date.now(), lines: clone(p.lines) }
    };
    const ok = await persistProject(nextP, 'Plan disimpan sebagai baseline Kurva S');
    if (ok) {
      if (onSavedBaseline) onSavedBaseline(nextP);
      else if (onClose) onClose();
    }
  };

  // Gantt & S-Curve calculations
  const lines = p.lines;
  const baseline = p.baseline;
  const ganttStart = minD(p.reg?.estStart, ...(lines || []).map((l) => l.start));
  const ganttEnd = maxD(estFinish, ...(lines || []).map(lineEnd));
  const ganttTotalDays = ganttStart && ganttEnd ? Math.max(1, dayCount(ganttStart, ganttEnd)) : 1;

  const curveDates = useMemo(() => dateRange(ganttStart, ganttEnd, 365), [ganttStart, ganttEnd]);
  const curvePlan = useMemo(() => curveDates.map((d) => planAt(lines || [], d)), [curveDates, lines]);
  const curveBase = useMemo(
    () => (baseline?.lines ? curveDates.map((d) => planAt(baseline.lines, d)) : null),
    [curveDates, baseline]
  );

  // Real step completion status
  const stepDoneMap = {
    1: (lines || []).length > 0 && isBobotValid,
    2: (p.mpPlan || []).length > 0,
    3: (p.manpower || []).length > 0,
    4: totalCostPlan > 0,
    5: Boolean(baseline)
  };

  const shellCls = dark
    ? 'bg-[#0b1222]/90 border-cyan-500/25 backdrop-blur-xl'
    : 'bg-white border-slate-200 shadow-sm';
  const railCls = dark
    ? 'bg-slate-950/60 border-slate-800/90'
    : 'bg-slate-50/80 border-slate-200/90';
  const innerCardCls = dark
    ? 'bg-slate-900/55 border-slate-800'
    : 'bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)]';
  const inputCls = dark
    ? 'bg-slate-950/80 border-slate-700/80 text-slate-100 focus:border-cyan-400'
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';

  const activeMeta = WIZARD_STEPS.find((s) => s.id === step) || WIZARD_STEPS[0];
  const nextMeta = WIZARD_STEPS.find((s) => s.id === step + 1);

  const innerContent = (
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          inline
            ? `w-full space-y-4`
            : `w-full max-w-7xl 2xl:max-w-[1420px] h-dvh sm:h-[90vh] sm:max-h-[860px] rounded-none sm:rounded-2xl border-0 sm:border shadow-2xl overflow-hidden flex flex-col ${shellCls}`
        }
      >
      <section className="flex flex-col min-w-0 min-h-0 flex-1">
        {/* Header */}
        <header className={`rounded-xl border px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 mb-4 ${innerCardCls}`}>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Plan awal project · <span className={dark ? 'text-cyan-400 font-mono' : 'text-sky-700 font-mono'}>{p.no}</span>
            </h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Isi produk yang diinstal per area beserta quantity, bobot, kuota manpower, tim, dan rencana biaya. Kurva S planning terbentuk otomatis.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            {saving && (
              <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                Menyimpan...
              </span>
            )}
            {msg && !saving && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                {msg}
              </span>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal Plan Awal"
                title="Tutup (Esc)"
                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  dark
                    ? 'border-slate-700/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Stacked Content (All sections on one page, matching HTML) */}
        <div className={inline ? 'space-y-4' : 'flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 pb-5 space-y-4'}>
          {/* 1. JADWAL & ITEM */}
              {/* Compact Periode & Bobot Strip */}
              <div className={`rounded-xl border p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x ${dark ? 'divide-slate-800' : 'divide-slate-200'} ${innerCardCls}`}>
                <div className="px-2">
                  <div className="text-[11px] text-slate-400 mb-1">Mulai Rencana</div>
                  <input
                    type="date"
                    value={p.reg?.estStart || ''}
                    onChange={(e) => persistProject({ ...p, reg: { ...p.reg, estStart: e.target.value } })}
                    className={`w-full px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-semibold outline-none ${inputCls}`}
                  />
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400 mb-1">Durasi Rencana</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={p.reg?.estDays || 30}
                      onChange={(e) => persistProject({ ...p, reg: { ...p.reg, estDays: Math.max(1, parseInt(e.target.value, 10) || 1) } }, '', { debounce: true })}
                      className={`w-20 px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-semibold font-mono outline-none ${inputCls}`}
                    />
                    <span className="text-xs text-slate-400">hari</span>
                  </div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Target Selesai</div>
                  <div className={`text-xs sm:text-sm font-bold mt-1 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>
                    {fmtDate(estFinish)}
                  </div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Total Bobot ({(p.lines || []).length} item)</div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                        isBobotValid
                          ? dark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          : dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {fmtPct(totalBobot, 1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Rincian Rencana Table (with Tambah Item inside, collapsible) */}
              <div className={`rounded-xl border p-3.5 space-y-3 ${innerCardCls}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenSec((s) => ({ ...s, items: !s.items }))}
                      className="flex items-center gap-1.5 text-left cursor-pointer"
                    >
                      {openSec.items ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      <h3 className="font-bold text-sm">Daftar Item Pekerjaan ({(p.lines || []).length})</h3>
                    </button>
                    {hasOverTarget && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Melewati target
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenSec((s) => ({ ...s, items: true }));
                        setShowAddForm((v) => !v);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        dark ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10' : 'border-sky-300 text-sky-700 hover:bg-sky-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Item
                    </button>
                  </div>
                </div>

                {openSec.items && (
                  <>

                {showAddForm && (
                  <div className={`px-4 pb-4 pt-2 border-t space-y-3 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2.5">
                      <label className="block text-xs space-y-1 xl:col-span-2">
                        <span className="text-slate-400">Produk</span>
                        <select
                          value={newLine.product}
                          onChange={(e) => setNewLine({ ...newLine, product: e.target.value })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                        >
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.name}>{pr.code} – {pr.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs space-y-1">
                        <span className="text-slate-400">Area</span>
                        <input
                          type="text"
                          placeholder="cth: Boiler Unit 1"
                          value={newLine.area}
                          onChange={(e) => setNewLine({ ...newLine, area: e.target.value })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block text-xs space-y-1">
                          <span className="text-slate-400">Qty</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={newLine.qty}
                            onChange={(e) => setNewLine({ ...newLine, qty: e.target.value })}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                          />
                        </label>
                        <label className="block text-xs space-y-1">
                          <span className="text-slate-400">Satuan</span>
                          <select
                            value={newLine.satuan}
                            onChange={(e) => setNewLine({ ...newLine, satuan: e.target.value })}
                            className={`w-full px-1.5 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                          >
                            {SATUAN.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </label>
                      </div>
                      <label className="block text-xs space-y-1">
                        <span className="text-slate-400">Mulai</span>
                        <input
                          type="date"
                          value={newLine.start}
                          onChange={(e) => setNewLine({ ...newLine, start: e.target.value })}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                        />
                      </label>
                      <label className="block text-xs space-y-1">
                        <span className="text-slate-400">Lama (hari)</span>
                        <input
                          type="number"
                          min="1"
                          value={newLine.days}
                          onChange={(e) => setNewLine({ ...newLine, days: e.target.value })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {masterJobs.map((j) => {
                          const on = !newLine.skip.includes(j.id);
                          return (
                            <button
                              key={j.id}
                              type="button"
                              onClick={() => {
                                const skip = newLine.skip.includes(j.id)
                                  ? newLine.skip.filter((x) => x !== j.id)
                                  : [...newLine.skip, j.id];
                                if (skip.length >= masterJobs.length) return;
                                setNewLine({ ...newLine, skip });
                              }}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all ${
                                on
                                  ? dark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-sky-50 text-sky-700 border-sky-300'
                                  : dark ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {on ? '✓ ' : ''}{j.name} ({fmtPct(j.bobot, 0)})
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddLine}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 ${
                          dark ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-sky-600 text-white hover:bg-sky-700'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambahkan</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={bobotRata}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer ${
                        dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Bagi rata
                    </button>
                    <button
                      type="button"
                      onClick={bobotAuto}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer ${
                        dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Otomatis (Qty × Lama)
                    </button>
                  </div>

                {/* Mobile & Tablet Card List (< lg) */}
                <div className="lg:hidden space-y-2.5">
                  {costRows.map((k, idx) => {
                    const val = costPlanValues[k];
                    const denom = budget > 0 ? budget : totalCostPlan;
                    const share = denom > 0 ? val / denom : 0;
                    const sharePct = +(share * 100).toFixed(2);
                    return (
                      <div
                        key={k}
                        className={`rounded-xl border p-3 space-y-2 ${
                          dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-xs">
                            <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                            {k}
                            {k === 'Upah manpower' && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${dark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-100 text-sky-700'}`}>
                                AUTO
                              </span>
                            )}
                          </div>
                          {k === 'Upah manpower' && (
                            <span className="font-mono text-[11px] text-slate-400">{fmtPct(share, 1)}</span>
                          )}
                        </div>
                        {k === 'Upah manpower' ? (
                          <div className={`text-right font-mono text-xs font-semibold ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>
                            {fmtRp(val)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <label className="block text-[10px] space-y-0.5">
                              <span className="text-slate-400">Porsi (%)</span>
                              <div className={`flex items-center rounded-lg border px-2 py-1 ${inputCls}`}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  disabled={budget <= 0}
                                  value={val > 0 ? sharePct : ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const pct = Math.max(0, num(e.target.value));
                                    const rp = Math.round((pct / 100) * budget);
                                    persistProject(
                                      { ...p, costPlan: { ...(p.costPlan || {}), [k]: rp } },
                                      '',
                                      { debounce: true }
                                    );
                                  }}
                                  className="w-full bg-transparent text-xs font-mono text-right outline-none disabled:opacity-50"
                                />
                                <span className="text-[10px] font-mono text-slate-400 ml-0.5">%</span>
                              </div>
                            </label>
                            <label className="block text-[10px] space-y-0.5 col-span-2">
                              <span className="text-slate-400">Anggaran Rencana</span>
                              <div className={`flex items-center rounded-lg border px-2 py-1 ${inputCls}`}>
                                <span className="text-[10px] font-mono text-slate-400 mr-1 shrink-0">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={(p.costPlan || {})[k] ? Math.round(num((p.costPlan || {})[k])).toLocaleString('id-ID') : ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    const parsed = raw ? parseInt(raw, 10) : 0;
                                    persistProject(
                                      { ...p, costPlan: { ...(p.costPlan || {}), [k]: parsed } },
                                      '',
                                      { debounce: true }
                                    );
                                  }}
                                  className="w-full bg-transparent text-xs font-mono text-right outline-none"
                                />
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className={`rounded-xl border p-3 flex items-center justify-between text-xs font-bold ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                    <span>Total Rencana Biaya</span>
                    <span className={`font-mono ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(totalCostPlan)}</span>
                  </div>
                </div>

                {/* Desktop Table (lg+) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className={`sticky top-0 z-10 ${dark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                      <tr className={`border-b font-mono uppercase text-[10px] ${dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                        <th className="py-2 px-1.5">Kode</th>
                        <th className="py-2 px-1.5">Produk & Area</th>
                        <th className="py-2 px-1.5">Qty</th>
                        <th className="py-2 px-1.5">Bobot %</th>
                        <th className="py-2 px-1.5">Jadwal & Gantt</th>
                        <th className="py-2 px-1.5">Tahap</th>
                        <th className="py-2 px-1.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? 'divide-slate-800/70' : 'divide-slate-100'}`}>
                      {(p.lines || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            Belum ada item pekerjaan. Tambahkan dari form di atas.
                          </td>
                        </tr>
                      ) : (
                        p.lines.map((l) => {
                          const leftPct = ganttStart ? (diffDays(ganttStart, l.start) / ganttTotalDays) * 100 : 0;
                          const widthPct = Math.max(2, (l.days / ganttTotalDays) * 100);
                          const over = estFinish && lineEnd(l) > estFinish;
                          const isOpen = !!openJobs[l.id];
                          const jobSum = (l.jobs || []).reduce((s, j) => s + num(j.bobot), 0);
                          const jobOk = bobotOk(jobSum);

                          return (
                            <React.Fragment key={l.id}>
                              <tr className={`align-top transition-colors ${isOpen ? (dark ? 'bg-cyan-500/5' : 'bg-sky-50/50') : ''}`}>
                                <td className="py-2.5 px-1.5 font-mono font-bold whitespace-nowrap">{l.code}</td>
                                <td className="py-2 px-1.5 min-w-[160px] xl:min-w-[220px]">
                                  <div className="flex flex-col xl:flex-row gap-1.5">
                                    <select
                                      value={l.product}
                                      onChange={(e) => updateLine(l.id, { product: e.target.value })}
                                      title={l.product}
                                      className={`w-full xl:w-24 px-2 py-1 rounded-md border text-xs font-mono font-semibold outline-none ${inputCls}`}
                                    >
                                      {products.map((pr) => (
                                        <option key={pr.id} value={pr.name} title={pr.name}>{pr.code}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Area..."
                                      value={l.area}
                                      onChange={(e) => updateLine(l.id, { area: e.target.value }, true)}
                                      className={`w-full xl:flex-1 px-2 py-1 rounded-md border text-[11px] outline-none ${inputCls}`}
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-1.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={l.qty}
                                      onChange={(e) => updateLine(l.id, { qty: num(e.target.value) }, true)}
                                      className={`w-14 px-1.5 py-1 rounded-md border text-xs outline-none ${inputCls}`}
                                    />
                                    <select
                                      value={l.satuan}
                                      onChange={(e) => updateLine(l.id, { satuan: e.target.value })}
                                      className={`px-1.5 py-1 rounded-md border text-xs outline-none ${inputCls}`}
                                    >
                                      {SATUAN.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                </td>
                                <td className="py-1.5 px-1.5 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    value={+(num(l.bobot) * 100).toFixed(2)}
                                    onChange={(e) => updateLine(l.id, { bobot: Math.max(0, num(e.target.value)) / 100 }, true)}
                                    className={`w-20 px-2 py-1 rounded-md border text-xs font-mono text-right outline-none ${inputCls}`}
                                  />
                                </td>
                                <td className="py-2 px-1.5 min-w-[260px]">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="date"
                                      value={l.start}
                                      onChange={(e) => updateLine(l.id, { start: e.target.value })}
                                      className={`px-1.5 py-1 rounded-md border text-[11px] outline-none shrink-0 ${inputCls}`}
                                    />
                                    <input
                                      type="number"
                                      min="1"
                                      value={l.days}
                                      onChange={(e) => updateLine(l.id, { days: Math.max(1, parseInt(e.target.value, 10) || 1) }, true)}
                                      className={`w-12 px-1.5 py-1 rounded-md border text-[11px] font-mono outline-none shrink-0 ${inputCls}`}
                                      title="Lama (hari)"
                                    />
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">→ {fmtDate(lineEnd(l))}</span>
                                    <div className={`flex-1 min-w-[56px] h-2 rounded-full relative overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                      <div
                                        className={`absolute top-0 bottom-0 rounded-full ${over ? 'bg-rose-500' : dark ? 'bg-cyan-400' : 'bg-sky-600'}`}
                                        style={{ left: `${Math.max(0, leftPct)}%`, width: `${widthPct}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => setOpenJobs({ ...openJobs, [l.id]: !isOpen })}
                                    className={`px-2 py-1 rounded-md text-[11px] font-medium border cursor-pointer ${
                                      isOpen
                                        ? dark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-sky-600 text-white border-sky-600'
                                        : dark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    <Sliders className="w-3 h-3 inline mr-1" />
                                    {(l.jobs || []).length}/{masterJobs.length}
                                  </button>
                                </td>
                                <td className="py-2 px-1.5 whitespace-nowrap text-right">
                                  <button
                                    type="button"
                                    onClick={() => duplicateLine(l)}
                                    className="p-1 text-sky-400 hover:opacity-80 cursor-pointer"
                                    title="Duplikat"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteLine(l.id)}
                                    className="p-1 text-rose-400 hover:opacity-80 cursor-pointer ml-0.5"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                              {isOpen && (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className={`p-3.5 border-l-2 ${
                                        dark
                                          ? 'bg-slate-950/70 border-l-cyan-400'
                                          : 'bg-slate-50/90 border-l-sky-500'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                        <div className="flex items-center gap-2 text-xs">
                                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${dark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-100 text-sky-700'}`}>
                                            {l.code}
                                          </span>
                                          <span className="font-semibold">
                                            Bobot Tahap Pekerjaan · {l.product} {l.area ? `(${l.area})` : ''}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                                              jobOk
                                                ? dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                                                : dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700'
                                            }`}
                                          >
                                            Total: {fmtPct(jobSum, 1)}
                                          </span>
                                          {!jobOk && (
                                            <button
                                              type="button"
                                              onClick={() => updateLine(l.id, { jobs: normJobs(l.jobs || []) })}
                                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer ${
                                                dark ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10' : 'border-sky-300 text-sky-700 bg-white hover:bg-sky-50'
                                              }`}
                                            >
                                              Normalisasi 100%
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {(l.jobs || []).map((j, jIdx) => {
                                          const pct = +(num(j.bobot) * 100).toFixed(2);
                                          return (
                                            <div
                                              key={j.id}
                                              className={`rounded-xl border p-3 space-y-2 transition-colors ${
                                                dark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                                  <span className="text-slate-400 font-mono text-[11px] shrink-0">{jIdx + 1}.</span>
                                                  <input
                                                    type="text"
                                                    value={j.name}
                                                    onChange={(e) => {
                                                      const nextJobs = l.jobs.map((x) => (x.id === j.id ? { ...x, name: e.target.value } : x));
                                                      updateLine(l.id, { jobs: nextJobs }, true);
                                                    }}
                                                    className={`w-full min-w-0 bg-transparent text-xs font-semibold outline-none border-b border-transparent focus:border-cyan-400/60 ${
                                                      dark ? 'text-slate-100' : 'text-slate-800'
                                                    }`}
                                                  />
                                                </div>
                                                {(l.jobs || []).length > 1 && (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const nextJobs = l.jobs.filter((x) => x.id !== j.id);
                                                      updateLine(l.id, { jobs: nextJobs });
                                                    }}
                                                    title="Hapus tahap"
                                                    className="text-rose-400 hover:opacity-80 cursor-pointer p-0.5 shrink-0"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2.5">
                                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                  <div
                                                    className={`h-full rounded-full transition-all ${dark ? 'bg-cyan-400/80' : 'bg-sky-500'}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                                  />
                                                </div>
                                                <div className={`inline-flex items-center rounded-lg border px-2 py-0.5 shrink-0 ${inputCls}`}>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                    value={pct}
                                                    onChange={(e) => {
                                                      const val = Math.max(0, num(e.target.value)) / 100;
                                                      const nextJobs = l.jobs.map((x) => (x.id === j.id ? { ...x, bobot: val } : x));
                                                      updateLine(l.id, { jobs: nextJobs }, true);
                                                    }}
                                                    className="w-12 bg-transparent text-xs font-mono text-right outline-none"
                                                  />
                                                  <span className="text-[11px] font-mono text-slate-400 ml-0.5">%</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Tambah tahap dari Master atau Opsional */}
                                      <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 ${dark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {masterJobs
                                            .filter((mj) => !(l.jobs || []).some((j) => j.id === mj.id || j.name.toLowerCase() === mj.name.toLowerCase()))
                                            .map((mj) => (
                                              <button
                                                key={mj.id}
                                                type="button"
                                                onClick={() => {
                                                  const nextJobs = [...(l.jobs || []), { id: mj.id, name: mj.name, bobot: 0 }];
                                                  updateLine(l.id, { jobs: nextJobs });
                                                }}
                                                className={`px-2 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${
                                                  dark ? 'border-slate-700 text-slate-300 hover:border-cyan-400/50' : 'border-slate-200 bg-white text-slate-600 hover:bg-sky-50'
                                                }`}
                                              >
                                                + {mj.name}
                                              </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                          <input
                                            type="text"
                                            placeholder="Tambah tahap opsional..."
                                            value={customJobNames[l.id] || ''}
                                            onChange={(e) => setCustomJobNames({ ...customJobNames, [l.id]: e.target.value })}
                                            className={`w-44 sm:w-52 px-2.5 py-1 rounded-lg border text-xs outline-none ${inputCls}`}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nm = (customJobNames[l.id] || '').trim();
                                              if (!nm) return;
                                              const nextJobs = [...(l.jobs || []), { id: rid('j'), name: nm, bobot: 0 }];
                                              setCustomJobNames({ ...customJobNames, [l.id]: '' });
                                              updateLine(l.id, { jobs: nextJobs });
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer shrink-0 ${
                                              dark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-sky-600 text-white'
                                            }`}
                                          >
                                            + Tahap
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </div>
          {/* 2. KUOTA MANPOWER */}
              <div className={`rounded-xl border p-4 space-y-3 ${innerCardCls}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenSec((s) => ({ ...s, mp: !s.mp }))}
                    className="flex items-start gap-2 text-left cursor-pointer"
                  >
                    {openSec.mp ? <ChevronUp className="w-4 h-4 text-slate-400 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5" />}
                    <div>
                      <h3 className="font-bold text-sm">Kebutuhan Level Manpower</h3>
                      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Rate mengikuti Master Data dan otomatis dihitung ke Rencana Biaya.
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSec((s) => ({ ...s, mp: true }));
                      addMpPlan();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      dark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30' : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    + Tambah Level
                  </button>
                </div>

                {openSec.mp && (
                  <>
                <div className={`rounded-xl border p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x ${dark ? 'divide-slate-800 border-slate-800 bg-slate-950/30' : 'divide-slate-200 border-slate-200 bg-slate-50/60'}`}>
                  <div className="px-2">
                    <div className="text-[11px] text-slate-400">Total Manpower</div>
                    <div className={`text-sm font-bold mt-0.5 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>{fmtNum(totalMpQty)} orang</div>
                  </div>
                  <div className="px-2 pt-2 sm:pt-0">
                    <div className="text-[11px] text-slate-400">Durasi Project</div>
                    <div className="text-sm font-bold mt-0.5">{p.reg?.estDays || 30} hari</div>
                  </div>
                  <div className="px-2 pt-2 sm:pt-0">
                    <div className="text-[11px] text-slate-400">Total Hari-Orang</div>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>{fmtNum(totalMpDays)} mandays</div>
                  </div>
                  <div className="px-2 pt-2 sm:pt-0">
                    <div className="text-[11px] text-slate-400">Total Biaya Manpower</div>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>{fmtRp(totalMpCost)}</div>
                  </div>
                </div>

                {/* Mobile & Tablet Card List (< lg) */}
                <div className="lg:hidden space-y-2.5">
                  {mpRows.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Belum ada rencana manpower. Klik "+ Tambah Level" untuk menambahkan.
                    </div>
                  ) : (
                    <>
                      {mpRows.map((r) => (
                        <div
                          key={r.id}
                          className={`rounded-xl border p-3 space-y-2.5 ${
                            dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <select
                                value={r.source}
                                onChange={(e) => updateMpPlan(r.id, { source: e.target.value })}
                                className={`px-2 py-1 rounded-lg border text-xs outline-none ${inputCls}`}
                              >
                                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select
                                value={r.level}
                                onChange={(e) => updateMpPlan(r.id, { level: e.target.value })}
                                className={`flex-1 min-w-0 px-2 py-1 rounded-lg border text-xs outline-none ${inputCls}`}
                              >
                                {[...new Set(masterLevels.filter((v) => v.source === r.source).map((v) => v.level))].map((lv) => (
                                  <option key={lv} value={lv}>{lv}</option>
                                ))}
                              </select>
                            </div>
                            <button type="button" onClick={() => deleteMpPlan(r.id)} className="p-1.5 text-rose-400 cursor-pointer shrink-0" title="Hapus">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <label className="block text-[10px] space-y-0.5">
                              <span className="text-slate-400">Jumlah (orang)</span>
                              <input
                                type="number"
                                min="0"
                                value={r.qty}
                                onChange={(e) => updateMpPlan(r.id, { qty: parseInt(e.target.value, 10) || 0 }, true)}
                                className={`w-full px-2 py-1 rounded-lg border text-xs font-mono outline-none ${inputCls}`}
                              />
                            </label>
                            <label className="block text-[10px] space-y-0.5">
                              <span className="text-slate-400">Hari Kerja</span>
                              <input
                                type="number"
                                min="1"
                                value={r.days}
                                onChange={(e) => updateMpPlan(r.id, { days: Math.max(1, parseInt(e.target.value, 10) || 1) }, true)}
                                className={`w-full px-2 py-1 rounded-lg border text-xs font-mono outline-none ${inputCls}`}
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Rate / 8 jam</span>
                              <span className="font-mono">{fmtRp(r.rate)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Lembur / jam</span>
                              <span className="font-mono">{fmtRp(r.ot)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Hari-orang</span>
                              <span className="font-mono font-semibold">{fmtNum(r.mandays)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Biaya rencana</span>
                              <span className={`font-mono font-bold ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(r.cost)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className={`rounded-xl border p-3 flex items-center justify-between text-xs font-bold ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                        <span>Total ({fmtNum(totalMpQty)} orang · {fmtNum(totalMpDays)} hari-orang)</span>
                        <span className={`font-mono ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(totalMpCost)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Desktop Table (lg+) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className={`sticky top-0 z-10 ${dark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                      <tr className={`border-b font-mono uppercase text-[10px] ${dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                        <th className="py-2 px-2">Source</th>
                        <th className="py-2 px-2">Level</th>
                        <th className="py-2 px-2">Jumlah (orang)</th>
                        <th className="py-2 px-2">Hari Kerja</th>
                        <th className="py-2 px-2 text-right">Rate / 8 jam</th>
                        <th className="py-2 px-2 text-right">Lembur / jam</th>
                        <th className="py-2 px-2 text-right">Hari-orang</th>
                        <th className="py-2 px-2 text-right">Biaya rencana</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                      {mpRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-slate-400">
                            Belum ada rencana manpower. Klik "+ Tambah Level" untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        mpRows.map((r) => (
                          <tr key={r.id}>
                            <td className="py-2 px-2">
                              <select
                                value={r.source}
                                onChange={(e) => updateMpPlan(r.id, { source: e.target.value })}
                                className={`px-2 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                              >
                                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={r.level}
                                onChange={(e) => updateMpPlan(r.id, { level: e.target.value })}
                                className={`px-2 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                              >
                                {[...new Set(masterLevels.filter((v) => v.source === r.source).map((v) => v.level))].map((lv) => (
                                  <option key={lv} value={lv}>{lv}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0"
                                value={r.qty}
                                onChange={(e) => updateMpPlan(r.id, { qty: parseInt(e.target.value, 10) || 0 }, true)}
                                className={`w-20 px-2 py-1.5 rounded-lg border text-xs font-mono outline-none ${inputCls}`}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="1"
                                value={r.days}
                                onChange={(e) => updateMpPlan(r.id, { days: Math.max(1, parseInt(e.target.value, 10) || 1) }, true)}
                                className={`w-20 px-2 py-1.5 rounded-lg border text-xs font-mono outline-none ${inputCls}`}
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-400">{fmtRp(r.rate)}</td>
                            <td className="py-2 px-2 text-right font-mono text-slate-400">{fmtRp(r.ot)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtNum(r.mandays)}</td>
                            <td className={`py-2 px-2 text-right font-mono font-semibold ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(r.cost)}</td>
                            <td className="py-2 px-2 text-right">
                              <button type="button" onClick={() => deleteMpPlan(r.id)} className="text-rose-400 hover:opacity-80 cursor-pointer p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {mpRows.length > 0 && (
                      <tfoot>
                        <tr className={`font-bold border-t ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                          <td colSpan={2} className="py-2 px-2">Total</td>
                          <td className="py-2 px-2 font-mono">{fmtNum(totalMpQty)} orang</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td className="py-2 px-2 text-right font-mono">{fmtNum(totalMpDays)}</td>
                          <td className={`py-2 px-2 text-right font-mono ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(totalMpCost)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                  </>
                )}
              </div>
          {/* 4. RENCANA BIAYA */}
              <div className={`rounded-xl border p-4 space-y-3 ${innerCardCls}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenSec((s) => ({ ...s, cost: !s.cost }))}
                    className="flex items-start gap-2 text-left cursor-pointer"
                  >
                    {openSec.cost ? <ChevronUp className="w-4 h-4 text-slate-400 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5" />}
                    <div>
                      <h3 className="font-bold text-sm">Rencana Biaya</h3>
                      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Alokasi biaya per kategori terhadap budget project.
                      </p>
                    </div>
                  </button>
                  <span className={`font-mono text-xs font-semibold ${budget - totalCostPlan < 0 ? 'text-rose-400' : dark ? 'text-cyan-300' : 'text-sky-700'}`}>
                    {fmtRp(totalCostPlan)}
                  </span>
                </div>

                {openSec.cost && (
                  <>
                <div className={`rounded-xl border p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x ${dark ? 'divide-slate-800 border-slate-800 bg-slate-950/30' : 'divide-slate-200 border-slate-200 bg-slate-50/60'}`}>
                  <div className="px-2">
                    <div className="text-[11px] text-slate-400">Budget Project</div>
                    <div className="text-sm font-bold font-mono mt-0.5">{fmtRp(budget)}</div>
                  </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Total Rencana</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>{fmtRp(totalCostPlan)}</div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Sisa Budget</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${budget - totalCostPlan < 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                    {fmtRp(budget - totalCostPlan)}
                  </div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Utilisasi</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold font-mono">{budget > 0 ? fmtPct(totalCostPlan / budget) : '0%'}</span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full ${budget > 0 && totalCostPlan > budget ? 'bg-rose-500' : 'bg-sky-500'}`}
                        style={{ width: `${Math.min(100, budget > 0 ? (totalCostPlan / budget) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
                </div>
                {/* Mobile & Tablet Card List (< lg) */}
                <div className="lg:hidden space-y-2.5">
                  {costRows.map((k, idx) => {
                    const val = costPlanValues[k];
                    const denom = budget > 0 ? budget : totalCostPlan;
                    const share = denom > 0 ? val / denom : 0;
                    const sharePct = +(share * 100).toFixed(2);
                    return (
                      <div
                        key={k}
                        className={`rounded-xl border p-3 space-y-2 ${
                          dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-xs">
                            <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                            {k}
                            {k === 'Upah manpower' && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${dark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-100 text-sky-700'}`}>
                                AUTO
                              </span>
                            )}
                          </div>
                          {k === 'Upah manpower' && (
                            <span className="font-mono text-[11px] text-slate-400">{fmtPct(share, 1)}</span>
                          )}
                        </div>
                        {k === 'Upah manpower' ? (
                          <div className={`text-right font-mono text-xs font-semibold ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>
                            {fmtRp(val)}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <label className="block text-[10px] space-y-0.5">
                              <span className="text-slate-400">Porsi (%)</span>
                              <div className={`flex items-center rounded-lg border px-2 py-1 ${inputCls}`}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  disabled={budget <= 0}
                                  value={val > 0 ? sharePct : ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const pct = Math.max(0, num(e.target.value));
                                    const rp = Math.round((pct / 100) * budget);
                                    persistProject(
                                      { ...p, costPlan: { ...(p.costPlan || {}), [k]: rp } },
                                      '',
                                      { debounce: true }
                                    );
                                  }}
                                  className="w-full bg-transparent text-xs font-mono text-right outline-none disabled:opacity-50"
                                />
                                <span className="text-[10px] font-mono text-slate-400 ml-0.5">%</span>
                              </div>
                            </label>
                            <label className="block text-[10px] space-y-0.5 col-span-2">
                              <span className="text-slate-400">Anggaran Rencana</span>
                              <div className={`flex items-center rounded-lg border px-2 py-1 ${inputCls}`}>
                                <span className="text-[10px] font-mono text-slate-400 mr-1 shrink-0">Rp</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={(p.costPlan || {})[k] ? Math.round(num((p.costPlan || {})[k])).toLocaleString('id-ID') : ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    const parsed = raw ? parseInt(raw, 10) : 0;
                                    persistProject(
                                      { ...p, costPlan: { ...(p.costPlan || {}), [k]: parsed } },
                                      '',
                                      { debounce: true }
                                    );
                                  }}
                                  className="w-full bg-transparent text-xs font-mono text-right outline-none"
                                />
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className={`rounded-xl border p-3 flex items-center justify-between text-xs font-bold ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                    <span>Total Rencana Biaya</span>
                    <span className={`font-mono ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(totalCostPlan)}</span>
                  </div>
                </div>

                {/* Desktop Table (lg+) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className={`sticky top-0 z-10 ${dark ? 'bg-[#0f172a]' : 'bg-white'}`}>
                      <tr className={`border-b font-mono uppercase text-[10px] ${dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                        <th className="py-2 px-2 w-10">No.</th>
                        <th className="py-2 px-2">Kategori Biaya</th>
                        <th className="py-2 px-2 text-right">Porsi</th>
                        <th className="py-2 px-2 text-right">Anggaran Rencana</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                      {costRows.map((k, idx) => {
                        const val = costPlanValues[k];
                        const denom = budget > 0 ? budget : totalCostPlan;
                        const share = denom > 0 ? val / denom : 0;
                        const sharePct = +(share * 100).toFixed(2);
                        return (
                          <tr key={k}>
                            <td className="py-2 px-2 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2 px-2 font-medium">
                              {k}
                              {k === 'Upah manpower' && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${dark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-100 text-sky-700'}`}>
                                  AUTO
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {k === 'Upah manpower' ? (
                                <span className="font-mono text-slate-400">{fmtPct(share, 1)}</span>
                              ) : (
                                <div className={`inline-flex items-center rounded-lg border px-2 py-1 ${inputCls}`}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    disabled={budget <= 0}
                                    title={budget <= 0 ? 'Isi Budget Project terlebih dahulu untuk menghitung dari %' : 'Isi % dari budget'}
                                    value={val > 0 ? sharePct : ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const pct = Math.max(0, num(e.target.value));
                                      const rp = Math.round((pct / 100) * budget);
                                      persistProject(
                                        { ...p, costPlan: { ...(p.costPlan || {}), [k]: rp } },
                                        '',
                                        { debounce: true }
                                      );
                                    }}
                                    className="w-14 bg-transparent text-xs font-mono text-right outline-none disabled:opacity-50"
                                  />
                                  <span className="text-[11px] font-mono text-slate-400 ml-0.5">%</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {k === 'Upah manpower' ? (
                                <span className={`font-mono font-semibold ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(val)}</span>
                              ) : (
                                <div className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 w-44 ${inputCls}`}>
                                  <span className="text-[11px] font-mono text-slate-400 mr-1.5 shrink-0">Rp</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={(p.costPlan || {})[k] ? Math.round(num((p.costPlan || {})[k])).toLocaleString('id-ID') : ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '');
                                      const parsed = raw ? parseInt(raw, 10) : 0;
                                      persistProject(
                                        { ...p, costPlan: { ...(p.costPlan || {}), [k]: parsed } },
                                        '',
                                        { debounce: true }
                                      );
                                    }}
                                    className="w-full bg-transparent text-xs font-mono text-right outline-none"
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className={`font-bold border-t ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                        <td colSpan={2} className="py-2.5 px-2">Total Rencana Biaya</td>
                        <td className="py-2.5 px-2 text-right font-mono">100,0%</td>
                        <td className={`py-2.5 px-2 text-right font-mono ${dark ? 'text-cyan-300' : 'text-sky-700'}`}>{fmtRp(totalCostPlan)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                  </>
                )}
              </div>
          {/* 5. KURVA S & BASELINE */}
              <div className={`rounded-xl border p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x ${dark ? 'divide-slate-800' : 'divide-slate-200'} ${innerCardCls}`}>
                <div className="px-2">
                  <div className="text-[11px] text-slate-400">Periode Rencana</div>
                  <div className="text-xs sm:text-sm font-bold mt-0.5">{fmtDate(p.reg?.estStart)} – {fmtDate(estFinish)}</div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Total Item</div>
                  <div className="text-xs sm:text-sm font-bold mt-0.5">{(p.lines || []).length} item</div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Kuota / Personel</div>
                  <div className="text-xs sm:text-sm font-bold mt-0.5">{fmtNum(totalMpQty)} kuota · {(p.manpower || []).length} org</div>
                </div>
                <div className="px-2 pt-2 sm:pt-0">
                  <div className="text-[11px] text-slate-400">Budget Rencana</div>
                  <div className={`text-xs sm:text-sm font-bold font-mono mt-0.5 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>{fmtRp(totalCostPlan)}</div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 space-y-3 ${innerCardCls}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-sm">Kurva S Planning (S-Curve)</h3>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-3 h-0.5 inline-block ${dark ? 'bg-cyan-400' : 'bg-sky-600'}`} />
                      Rencana Saat Ini
                    </span>
                    {curveBase && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block" />
                        Baseline Tersimpan
                      </span>
                    )}
                  </div>
                </div>

                {curveDates.length > 1 ? (
                  <div className="w-full h-52">
                    <svg viewBox="0 0 600 185" className="w-full h-full overflow-visible">
                      {[0, 0.25, 0.5, 0.75, 1].map((v) => {
                        const y = 150 - v * 135;
                        return (
                          <g key={v}>
                            <line x1="38" x2="590" y1={y} y2={y} stroke={dark ? '#1e293b' : '#e2e8f0'} strokeWidth="1" />
                            <text x="32" y={y + 3} textAnchor="end" fontSize="10" fill={dark ? '#94a3b8' : '#64748b'}>
                              {Math.round(v * 100)}%
                            </text>
                          </g>
                        );
                      })}
                      {/* X-axis date labels (start, mid, end) */}
                      {[0, Math.floor((curveDates.length - 1) / 2), curveDates.length - 1].map((idx) => {
                        const x = 38 + (552 * idx) / (curveDates.length - 1);
                        return (
                          <text
                            key={idx}
                            x={x}
                            y="172"
                            textAnchor={idx === 0 ? 'start' : idx === curveDates.length - 1 ? 'end' : 'middle'}
                            fontSize="10"
                            fill={dark ? '#94a3b8' : '#64748b'}
                          >
                            {fmtDate(curveDates[idx])}
                          </text>
                        );
                      })}
                      {curveBase && (
                        <path
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                          d={curveBase
                            .map((v, i) => `${i === 0 ? 'M' : 'L'}${38 + (552 * i) / (curveDates.length - 1)},${150 - v * 135}`)
                            .join(' ')}
                        />
                      )}
                      <path
                        fill="none"
                        stroke={dark ? '#22d3ee' : '#0284c7'}
                        strokeWidth="2.5"
                        d={curvePlan
                          .map((v, i) => `${i === 0 ? 'M' : 'L'}${38 + (552 * i) / (curveDates.length - 1)},${150 - v * 135}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tambahkan item pekerjaan di Step 1 untuk membentuk Kurva S Planning.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className={`px-3 py-2.5 rounded-xl border ${isBobotValid ? (dark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (dark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                  {isBobotValid ? '✓' : '!'} Total bobot: {fmtPct(totalBobot, 1)}
                </div>
                <div className={`px-3 py-2.5 rounded-xl border ${(p.lines || []).length > 0 ? (dark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (dark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500')}`}>
                  {(p.lines || []).length > 0 ? `✓ ${(p.lines || []).length} item terjadwal` : '• Belum ada item pekerjaan'}
                </div>
                <div className={`px-3 py-2.5 rounded-xl border ${totalCostPlan > 0 ? (dark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (dark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500')}`}>
                  {totalCostPlan > 0 ? '✓ Manpower & biaya terisi' : '• Manpower & biaya belum diisi'}
                </div>
              </div>
        </div>

        {/* Baseline Action Footer */}
        <footer className={`rounded-xl border px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 ${innerCardCls}`}>
          <div className="text-xs font-mono text-slate-400">
            {!isBobotValid
              ? 'Sesuaikan total bobot item menjadi 100% sebelum mengunci baseline.'
              : p.baseline
                ? `Baseline terkunci (${new Date(p.baseline.ts).toLocaleDateString('id-ID')})`
                : 'Semua data siap dikunci sebagai baseline Kurva S.'}
          </div>

          <button
            type="button"
            disabled={!isBobotValid || !(p.lines || []).length}
            onClick={handleSaveBaseline}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-40 ${
              dark
                ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_-4px_rgba(34,211,238,0.6)]'
                : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            {p.baseline ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{p.baseline ? 'Perbarui Baseline' : 'Simpan & Kunci Baseline'}</span>
          </button>
        </footer>
      </section>
      </div>
  );

  if (inline) return innerContent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Plan Awal Project ${p.no}`}
      onClick={onClose}
    >
      {innerContent}
    </div>
  );
}
