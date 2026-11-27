import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  FolderOpen,
  Calendar,
  MapPin,
  User,
  Wallet,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  Layers,
  ClipboardList,
  Play,
  LayoutGrid,
  List,
  ChevronDown,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { registerModel, exportModelToXlsx } from '../utils/reportModels';

const STATUS_META = {
  registered: { label: 'Registered', dark: 'bg-slate-800 text-slate-300 border-slate-600', light: 'bg-slate-100 text-slate-700 border-slate-300' },
  planned: { label: 'Planned', dark: 'bg-sky-500/15 text-sky-300 border-sky-500/30', light: 'bg-sky-50 text-sky-700 border-sky-200' },
  running: { label: 'Running', dark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', dark: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const addDays = (s, n) => {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return dt.toISOString().slice(0, 10);
};

const fmtDate = (s) => {
  if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return '-';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
};

const fmtRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const fmtPct = (f) => ((Number(f) || 0) * 100).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

function SearchSelect({ value, onChange, options, placeholder, dark, inputCls, required }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const list = useMemo(() => {
    const q = (open ? search : '').trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 60);
  }, [options, search, open]);

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={open ? search : value}
        placeholder={placeholder}
        required={required}
        onFocus={() => {
          setSearch(value || '');
          setOpen(true);
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        className={`w-full pl-3.5 pr-9 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          setSearch(value || '');
          setOpen((o) => !o);
        }}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer ${dark ? 'text-slate-400' : 'text-slate-500'}`}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={`absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-xl z-50 ${
            dark ? 'bg-[#0d1526] border-cyan-500/30 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {list.length > 0 ? (
            list.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  setSearch(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                  opt === value
                    ? dark
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'bg-sky-50 text-sky-700 font-semibold'
                    : dark
                      ? 'hover:bg-slate-800'
                      : 'hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))
          ) : (
            <div className={`px-3.5 py-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tidak ditemukan (ketik manual atau tunggu data dimuat)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectView({
  dark,
  projects,
  activeId,
  loading,
  perms = {},
  onSelectProject,
  onOpenDetail,
  onNavigate,
  onRefresh
}) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'card' on desktop; mobile always card
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', project?: obj, done?: obj }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [salesOpts, setSalesOpts] = useState([]);
  const [customerOpts, setCustomerOpts] = useState([]);
  const [leaderOpts, setLeaderOpts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadRefs() {
      try {
        const [sRes, cRes, uRes] = await Promise.all([
          fetch('/api/sales').catch(() => null),
          fetch('/api/customers').catch(() => null),
          fetch('/api/users').catch(() => null)
        ]);
        if (cancelled) return;
        if (sRes && sRes.ok) {
          const sd = await sRes.json();
          const arr = Array.isArray(sd) ? sd : (sd.data || []);
          setSalesOpts([...new Set(arr.map((x) => x.nama || x.name || x.nama_sales).filter(Boolean))]);
        }
        if (cRes && cRes.ok) {
          const cd = await cRes.json();
          const arr = Array.isArray(cd) ? cd : (cd.data || []);
          setCustomerOpts([...new Set(arr.map((x) => x.nama || x.name || x.nama_customer).filter(Boolean))]);
        }
        if (uRes && uRes.ok) {
          const ud = await uRes.json();
          const arr = Array.isArray(ud) ? ud : (ud.data || []);
          setLeaderOpts([...new Set(arr.map((x) => x.nama || x.name || x.username).filter(Boolean))]);
        }
      } catch {
        // ignore
      }
    }
    loadRefs();
    return () => { cancelled = true; };
  }, []);

  const [form, setForm] = useState({
    sales: '',
    customer: '',
    location: '',
    leader: '',
    budget: '',
    estStart: todayStr(),
    estDays: 30,
    note: '',
    status: 'registered',
    closedAt: ''
  });

  const counts = useMemo(() => {
    const c = { all: projects.length, registered: 0, planned: 0, running: 0, closed: 0 };
    projects.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status]++;
    });
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!q) return true;
      const hay = [p.no, p.reg?.customer, p.reg?.location, p.reg?.leader, p.reg?.sales]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, filter, query]);

  const openCreate = () => {
    setErr('');
    setForm({
      sales: '',
      customer: '',
      location: '',
      leader: '',
      budget: '',
      estStart: todayStr(),
      estDays: 30,
      note: '',
      status: 'registered',
      closedAt: ''
    });
    setModal({ mode: 'create' });
  };

  const openEdit = (p) => {
    setErr('');
    setForm({
      sales: p.reg?.sales || '',
      customer: p.reg?.customer || '',
      location: p.reg?.location || '',
      leader: p.reg?.leader || '',
      budget: p.reg?.budget ?? '',
      estStart: p.reg?.estStart || todayStr(),
      estDays: p.reg?.estDays || 30,
      note: p.reg?.note || '',
      status: p.status || 'registered',
      closedAt: p.closedAt || ''
    });
    setModal({ mode: 'edit', project: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!form.sales.trim()) missing.push('Nama Sales');
    if (!form.customer.trim()) missing.push('Customer Name');
    if (!form.location.trim()) missing.push('Location');
    if (!form.leader.trim()) missing.push('Leader Project');
    if (missing.length) {
      setErr('Lengkapi: ' + missing.join(', '));
      return;
    }
    if (!form.estStart) {
      setErr('Isi estimasi tanggal project dimulai');
      return;
    }
    if (!(Number(form.estDays) >= 1)) {
      setErr('Estimasi lama project minimal 1 hari');
      return;
    }

    setErr('');
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const leaderId = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        const payload = {
          id,
          status: 'registered',
          reg: {
            sales: form.sales.trim(),
            customer: form.customer.trim(),
            location: form.location.trim(),
            leader: form.leader.trim(),
            budget: Number(form.budget) || 0,
            estStart: form.estStart,
            estDays: Math.max(1, parseInt(form.estDays, 10) || 30),
            note: form.note.trim()
          },
          manpower: [
            { id: leaderId, name: form.leader.trim(), source: 'Internal', level: 'Leader' }
          ]
        };
        const res = await fetch('/api/install-project-v2/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Gagal menyimpan project');
        }
        const created = await res.json();
        await onRefresh(created.id);
        setModal({ mode: 'create', done: created });
      } else {
        const p = modal.project;
        const payload = {
          ...p,
          status: form.status,
          closedAt: form.status === 'closed' ? (form.closedAt || todayStr()) : '',
          reg: {
            ...p.reg,
            sales: form.sales.trim(),
            customer: form.customer.trim(),
            location: form.location.trim(),
            leader: form.leader.trim(),
            budget: Number(form.budget) || 0,
            estStart: form.estStart,
            estDays: Math.max(1, parseInt(form.estDays, 10) || 30),
            note: form.note.trim()
          }
        };
        const res = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(p.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Gagal memperbarui project');
        }
        await onRefresh(p.id);
        setModal(null);
      }
    } catch (ex) {
      setErr(ex.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus project');
      setDeleteTarget(null);
      await onRefresh();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  const estFinishPreview =
    form.estStart && Number(form.estDays) >= 1
      ? fmtDate(addDays(form.estStart, Math.round(Number(form.estDays)) - 1))
      : '-';

  const cardCls = dark
    ? 'relative bg-[#0b1222]/85 border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_-12px_rgba(6,182,212,0.35)]'
    : 'relative bg-white/95 border-sky-200/90 shadow-[0_4px_24px_-8px_rgba(2,132,199,0.18)]';

  const inputCls = dark
    ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30';

  return (
    <div className="space-y-5">
      {/* Top Action & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className={`border-l-4 pl-3.5 ${dark ? 'border-cyan-400' : 'border-sky-600'}`}>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Daftar &amp; Monitoring Project</h2>
          <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {counts.all} project terdaftar · {counts.registered} registered · {counts.running} running · {counts.closed} closed
          </p>
        </div>
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {perms.canEdit && (
            <button
              type="button"
              onClick={() => onNavigate('master')}
              className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold border transition-all cursor-pointer min-w-0 ${
                dark
                  ? 'border-[#1e3a5a] bg-[#111b2a] hover:border-cyan-400 text-slate-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
              }`}
            >
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span className="truncate">Master Data</span>
            </button>
          )}
          {perms.canExport && (
            <button
              type="button"
              onClick={() => exportModelToXlsx(registerModel(projects))}
              disabled={!projects.length}
              className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold border transition-all cursor-pointer disabled:opacity-40 min-w-0 ${
                dark
                  ? 'border-[#1e3a5a] bg-[#111b2a] hover:border-cyan-400 text-slate-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="truncate sm:hidden">Export</span>
              <span className="hidden sm:inline">Export Register</span>
            </button>
          )}
          {perms.canCreate && (
            <button
              onClick={openCreate}
              className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all cursor-pointer min-w-0 ${
                dark
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_24px_-4px_rgba(34,211,238,0.75)]'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
              }`}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate sm:hidden">Project Baru</span>
              <span className="hidden sm:inline">Registrasi Project Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 overflow-x-auto pb-1 sm:pb-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          {
            label: 'Total Project',
            val: counts.all,
            icon: Layers,
            dot: dark ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-sky-500',
            iconCls: dark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : 'text-sky-600 bg-sky-50 border-sky-200',
            cardExtra: dark ? 'border-cyan-500/30' : ''
          },
          {
            label: 'Registered',
            val: counts.registered,
            icon: ClipboardList,
            dot: dark ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-sky-500',
            iconCls: dark ? 'text-sky-400 bg-sky-500/10 border-sky-500/30' : 'text-sky-600 bg-sky-50 border-sky-200',
            cardExtra: dark ? 'border-sky-500/30' : ''
          },
          {
            label: 'Running',
            val: counts.running,
            icon: Play,
            dot: dark ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-500',
            iconCls: dark ? 'text-emerald-400 bg-emerald-500/15 border-emerald-400/40' : 'text-emerald-600 bg-emerald-50 border-emerald-200',
            cardExtra: dark ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-slate-900/80' : 'border-emerald-200 bg-emerald-50/30'
          },
          {
            label: 'Closed',
            val: counts.closed,
            icon: CheckCircle2,
            dot: dark ? 'bg-slate-400' : 'bg-slate-400',
            iconCls: dark ? 'text-slate-300 bg-slate-800 border-slate-700' : 'text-slate-600 bg-slate-100 border-slate-200',
            cardExtra: dark ? 'border-slate-700/80' : ''
          },
        ].map((k) => {
          const KIcon = k.icon;
          return (
            <div key={k.label} className={`min-w-[165px] shrink-0 sm:min-w-0 snap-start rounded-xl border p-3.5 sm:p-4 flex items-center gap-3 sm:gap-3.5 relative ${cardCls} ${k.cardExtra}`}>
              <span className={`w-1.5 h-1.5 rounded-full absolute top-3 right-3 ${k.dot}`} />
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${k.iconCls}`}>
                <KIcon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-mono uppercase tracking-widest ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {k.label}
                </div>
                <div className="text-2xl font-bold font-mono leading-tight mt-0.5">{k.val}</div>
                <div className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{k.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className={`rounded-2xl border p-4 space-y-4 ${cardCls}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[['all', 'Semua'], ['registered', 'Registered'], ['planned', 'Planned'], ['running', 'Running'], ['closed', 'Closed']].map(
              ([k, label]) => {
                const active = filter === k;
                return (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      active
                        ? dark
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                          : 'bg-sky-600 text-white border-sky-600'
                        : dark
                          ? 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label} ({counts[k]})
                  </button>
                );
              }
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari no, customer, lokasi, leader..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
              />
            </div>

            <div
              className={`hidden lg:inline-flex rounded-xl border p-0.5 ${
                dark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewMode === 'list'
                    ? dark
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-white text-sky-700 shadow-sm'
                    : dark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  viewMode === 'card'
                    ? dark
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-white text-sky-700 shadow-sm'
                    : dark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Card"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Empty / List */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Memuat data project...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {projects.length === 0
                ? 'Belum ada project terdaftar. Klik "Registrasi Project Baru" untuk memulai.'
                : 'Tidak ada project yang cocok dengan filter pencarian.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (when viewMode === 'list') */}
            <div className={`${viewMode === 'list' ? 'hidden lg:block' : 'hidden'} overflow-x-auto`}>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-mono uppercase ${dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-3">No Project</th>
                    <th className="py-3 px-3">Customer & Lokasi</th>
                    <th className="py-3 px-3">Leader / Sales</th>
                    <th className="py-3 px-3 text-right">Budget</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Progres</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? 'divide-slate-800/70' : 'divide-slate-100'}`}>
                  {filtered.map((p) => {
                    const isSel = p.id === activeId;
                    const st = STATUS_META[p.status] || STATUS_META.registered;
                    const act = Number(p.summary?.actual) || 0;
                    const cost = Number(p.summary?.cost) || 0;
                    const isRegOnly = p.status === 'registered';
                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          if (isRegOnly) {
                            onSelectProject(p.id);
                            onNavigate('plan');
                          } else if (onOpenDetail) {
                            onOpenDetail(p.id);
                          }
                        }}
                        className={`transition-colors cursor-pointer ${
                          isSel
                            ? dark
                              ? 'bg-cyan-500/10'
                              : 'bg-sky-50/70'
                            : dark
                              ? 'hover:bg-slate-800/40'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 align-top">
                          <div className={`font-mono font-bold text-sm hover:underline ${dark ? 'text-cyan-400' : 'text-sky-600'}`}>{p.no}</div>
                          <div className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {fmtDate(p.reg?.estStart)} · {p.reg?.estDays || 0} hari
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold">{p.reg?.customer || '-'}</div>
                          <div className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {p.reg?.location || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div>{p.reg?.leader || '-'}</div>
                          <div className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Sales: {p.reg?.sales || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="font-semibold">{fmtRp(p.reg?.budget)}</div>
                          <div className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            terpakai {fmtRp(cost)}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${dark ? st.dark : st.light}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                              <div
                                className="h-full rounded-full bg-orange-500"
                                style={{ width: `${Math.min(100, Math.max(0, act * 100))}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-semibold">{fmtPct(act)}</span>
                          </div>
                          <div className={`text-[11px] mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            rencana {fmtPct(Number(p.summary?.plan) || 0)}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                onSelectProject(p.id);
                                onNavigate('plan');
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                                isRegOnly || !p.baseline
                                  ? dark
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                    : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                  : dark
                                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                              title={isRegOnly ? 'Wajib isi Plan Awal sebelum pelaksanaan' : 'Lihat / Edit Plan Awal'}
                            >
                              Plan
                            </button>
                            {!isRegOnly && (
                              <button
                                onClick={() => {
                                  onSelectProject(p.id);
                                  onNavigate('ringkasan');
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                  dark
                                    ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30'
                                    : 'bg-sky-600 text-white hover:bg-sky-700'
                                }`}
                              >
                                Buka →
                              </button>
                            )}
                            {perms.canEdit && (
                              <button
                                onClick={() => openEdit(p)}
                                className={`p-1.5 rounded-lg border cursor-pointer ${
                                  dark
                                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                                title="Edit Project"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {perms.canDelete && (
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className={`p-1.5 rounded-lg border cursor-pointer ${
                                  dark
                                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/15'
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Hapus Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (always) & Desktop Cards (when viewMode === 'card') */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${viewMode === 'card' ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:hidden'} gap-3`}>
              {filtered.map((p) => {
                const isSel = p.id === activeId;
                const st = STATUS_META[p.status] || STATUS_META.registered;
                const act = Number(p.summary?.actual) || 0;
                const isRegOnly = p.status === 'registered';
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 space-y-3 ${
                      isSel
                        ? dark
                          ? 'bg-cyan-500/10 border-cyan-400/50'
                          : 'bg-sky-50/80 border-sky-300'
                        : dark
                          ? 'bg-slate-950/50 border-slate-800'
                          : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-sm">{p.no}</span>
                        <h3 className="font-bold text-base mt-0.5">{p.reg?.customer || '-'}</h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${dark ? st.dark : st.light}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{p.reg?.location || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{p.reg?.leader || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{fmtDate(p.reg?.estStart)} ({p.reg?.estDays}h)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{fmtRp(p.reg?.budget)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                          className={`h-full rounded-full ${dark ? 'bg-cyan-400' : 'bg-sky-600'}`}
                          style={{ width: `${Math.min(100, Math.max(0, act * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold">{fmtPct(act)}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          onSelectProject(p.id);
                          onNavigate('plan');
                        }}
                        className={`${isRegOnly ? 'flex-1' : ''} px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${
                          isRegOnly || !p.baseline
                            ? dark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                            : dark
                              ? 'border-slate-700 text-slate-300'
                              : 'border-slate-200 text-slate-600 bg-white'
                        }`}
                      >
                        Plan
                      </button>
                      {!isRegOnly && (
                        <button
                          onClick={() => {
                            onSelectProject(p.id);
                            onNavigate('ringkasan');
                          }}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                            dark
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-sky-600 text-white'
                          }`}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Buka
                        </button>
                      )}
                      {perms.canEdit && (
                        <button
                          onClick={() => openEdit(p)}
                          className={`p-2 rounded-lg border cursor-pointer ${
                            dark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600 bg-white'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {perms.canDelete && (
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className={`p-2 rounded-lg border cursor-pointer ${
                            dark ? 'border-rose-500/30 text-rose-400' : 'border-rose-200 text-rose-600 bg-white'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${
              dark
                ? 'bg-[#090f1d] border-cyan-500/40 text-slate-100 shadow-[0_0_50px_-12px_rgba(34,211,238,0.4)]'
                : 'bg-white border-sky-200 text-slate-900 shadow-[0_20px_50px_-12px_rgba(2,132,199,0.25)]'
            }`}
          >
            {modal.done ? (
              <div className="text-center p-6 sm:p-8 space-y-5">
                <div
                  className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${
                    dark
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_25px_-5px_rgba(52,211,153,0.5)]'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
                    SYS.REGISTERED // BERHASIL
                  </div>
                  <h3 className="text-2xl font-bold font-mono mt-1">{modal.done.no}</h3>
                  <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {modal.done.reg?.customer} · {modal.done.reg?.location} · mulai {fmtDate(modal.done.reg?.estStart)} ({modal.done.reg?.estDays} hari)
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onSelectProject(modal.done.id);
                      setModal(null);
                      onNavigate('plan');
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                      dark
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_-4px_rgba(34,211,238,0.7)]'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    <span>Lanjut ke Plan Awal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium border cursor-pointer ${
                      dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                {/* Modal Header */}
                <div
                  className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
                    dark
                      ? 'bg-slate-900/90 border-cyan-500/20'
                      : 'bg-gradient-to-r from-sky-50 to-indigo-50/60 border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        dark
                          ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                          : 'bg-white border-sky-200 text-sky-600 shadow-sm'
                      }`}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                            dark
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-sky-100 text-sky-700 border-sky-200'
                          }`}
                        >
                          {modal.mode === 'create' ? 'FASE 1 · REGISTRASI' : 'UPDATE PROJECT'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold mt-0.5">
                        {modal.mode === 'create' ? 'Registrasi Project Baru' : `Edit Project ${modal.project.no}`}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className={`p-2 rounded-xl border cursor-pointer transition-colors ${
                      dark
                        ? 'border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Nama Sales *
                      </span>
                      <SearchSelect
                        value={form.sales}
                        onChange={(v) => setForm({ ...form, sales: v })}
                        options={salesOpts}
                        placeholder="Cari / pilih Nama Sales..."
                        dark={dark}
                        inputCls={inputCls}
                        required
                      />
                    </label>
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Customer Name *
                      </span>
                      <SearchSelect
                        value={form.customer}
                        onChange={(v) => setForm({ ...form, customer: v })}
                        options={customerOpts}
                        placeholder="Cari / pilih Customer..."
                        dark={dark}
                        inputCls={inputCls}
                        required
                      />
                    </label>
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Location *
                      </span>
                      <input
                        type="text"
                        placeholder="Kota / Site Plant"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
                        required
                      />
                    </label>
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Leader Project *
                      </span>
                      <SearchSelect
                        value={form.leader}
                        onChange={(v) => setForm({ ...form, leader: v })}
                        options={leaderOpts}
                        placeholder="Cari / pilih Leader Project..."
                        dark={dark}
                        inputCls={inputCls}
                        required
                      />
                    </label>
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Budget Installation (Rp)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all ${inputCls}`}
                      />
                    </label>
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Estimasi Mulai *
                      </span>
                      <input
                        type="date"
                        value={form.estStart}
                        onChange={(e) => setForm({ ...form, estStart: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
                        required
                      />
                    </label>
                    <label className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Estimasi Lama (hari) *
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.estDays}
                        onChange={(e) => setForm({ ...form, estDays: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all ${inputCls}`}
                        required
                      />
                    </label>
                    <div className="block text-xs font-medium space-y-1.5">
                      <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                        Estimasi Selesai
                      </span>
                      <div
                        className={`px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold flex items-center justify-between ${
                          dark
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                            : 'bg-sky-50 border-sky-200 text-sky-700'
                        }`}
                      >
                        <span>{estFinishPreview}</span>
                        <Calendar className="w-4 h-4 opacity-70" />
                      </div>
                    </div>
                    {modal.mode === 'edit' && (
                      <>
                        <label className="block text-xs font-medium space-y-1.5">
                          <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                            Status
                          </span>
                          <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}
                          >
                            <option value="registered">Registered</option>
                            <option value="planned">Planned</option>
                            <option value="running">Running</option>
                            <option value="closed">Closed</option>
                          </select>
                        </label>
                        {form.status === 'closed' && (
                          <label className="block text-xs font-medium space-y-1.5">
                            <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                              Tanggal Selesai (Closed)
                            </span>
                            <input
                              type="date"
                              value={form.closedAt || todayStr()}
                              onChange={(e) => setForm({ ...form, closedAt: e.target.value })}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>

                  <label className="block text-xs font-medium space-y-1.5">
                    <span className={`font-mono uppercase tracking-wider text-[11px] ${dark ? 'text-cyan-400/80' : 'text-slate-600'}`}>
                      Catatan
                    </span>
                    <textarea
                      rows={2}
                      placeholder="Catatan tambahan (opsional)..."
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputCls}`}
                    />
                  </label>

                  {err && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                      {err}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div
                  className={`px-6 py-4 border-t flex items-center justify-end gap-2.5 ${
                    dark ? 'bg-slate-900/60 border-cyan-500/15' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer ${
                      dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all ${
                      dark
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-[0_0_20px_-4px_rgba(34,211,238,0.7)]'
                        : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
                    }`}
                  >
                    {saving ? 'Menyimpan...' : modal.mode === 'create' ? 'Simpan & Registrasikan' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${
              dark ? 'bg-[#0b1120] border-rose-500/30 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Hapus Project {deleteTarget.no}?</h3>
            </div>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Project <b>{deleteTarget.reg?.customer}</b> beserta seluruh plan, manpower, dan log harian akan dihapus permanen.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer ${
                  dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
