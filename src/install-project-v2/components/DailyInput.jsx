import { useState } from 'react';
import {
  Lock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  TrendingUp,
  Activity,
  Users,
  Wallet,
  Save,
  FileText,
  Printer
} from 'lucide-react';

const CUACA = ['Cerah', 'Berawan', 'Hujan ringan', 'Hujan lebat'];
const HARI_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const HARI_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const KATEGORI = ['Part / Material', 'Consumable', 'Sewa Alat', 'Transportasi', 'Akomodasi', 'Konsumsi', 'Lain-lain'];

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const rid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const toUTC = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const addDays = (s, n) => (isDate(s) ? new Date(toUTC(s) + n * 86400000).toISOString().slice(0, 10) : '');
const dow = (s) => new Date(toUTC(s)).getUTCDay();
const isHSE = (lv) => /^hse$/i.test(String(lv || '').trim());
const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function DailyInput({
  dark,
  cardCls,
  inputCls,
  project,
  days,
  date,
  setDate,
  dateStrip,
  curDay,
  isLocked,
  isClosed = false,
  revOpen,
  setRevOpen,
  todayInfo,
  baseLines,
  prevCum,
  masterJobs,
  saveDayUpdate,
  handleLockDay,
  onUpdateProject,
  onViewReport,
  fmtDate,
  fmtNum,
  fmtRp,
  fmtPct,
  planAt,
  planFrac,
  actualAt,
  jobCum,
  jobNorm,
  levelOn,
  costPrefix,
  nextCostNo
}) {
  const [newTeamName, setNewTeamName] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  const saved = Boolean(days[date]);
  const teams = curDay.teams || [];

  // Build date strip from project duration (estStart .. estStart + estDays - 1), filling gaps if active date is outside
  const stripDates = (() => {
    const start = project?.reg?.estStart;
    const totalDays = Math.max(1, parseInt(project?.reg?.estDays, 10) || 0);
    if (isDate(start) && totalDays > 0) {
      const end = addDays(start, Math.min(totalDays, 120) - 1);
      const minDate = isDate(date) && date < start ? date : start;
      const maxDate = isDate(date) && date > end ? date : end;
      const list = [];
      let cur = minDate;
      while (cur <= maxDate && list.length < 150) {
        list.push(cur);
        cur = addDays(cur, 1);
      }
      return list;
    }
    return dateStrip;
  })();
  const where = {};
  teams.forEach((t) => (t.members || []).forEach((m) => { where[m] = t.teamId; }));

  const tname = (id) => (project.teams || []).find((t) => t.id === id)?.name || '(team dihapus)';
  const openLines = (project.lines || []).filter((l) => (prevCum[l.id] || 0) < 0.999 || num(curDay.prog?.[l.id]) > 0);
  const absent = (project.manpower || []).filter((m) => !where[m.id]);

  // KPI calculations
  const tmpDays = { ...days, [date]: curDay };
  const planVal = planAt(baseLines, date);
  const actVal = actualAt(project, tmpDays, date);
  const prevActVal = actualAt(project, tmpDays, addDays(date, -1));
  const gainToday = actVal - prevActVal;
  const devVal = actVal - planVal;

  // HSE manpower
  const hseManpower = (project.manpower || []).filter((m) => isHSE(levelOn(project, curDay, m.id)));
  const hseOfLine = (lid) =>
    hseManpower
      .filter((m) => {
        if (!where[m.id]) return false;
        const sc = (curDay.hse || {})[m.id];
        return !Array.isArray(sc) || sc.includes(lid);
      })
      .map((m) => `HSE ${m.name}`);

  // Handlers
  const handleAddTeam = () => {
    const name = newTeamName.trim() || `Team ${String.fromCharCode(65 + (project.teams || []).length)}`;
    const newTeam = { id: rid('t'), name, members: [] };
    if (onUpdateProject) {
      onUpdateProject({ ...project, teams: [...(project.teams || []), newTeam] });
    }
    const nextDay = clone(curDay);
    nextDay.teams = [...(nextDay.teams || []), { teamId: newTeam.id, members: [], lines: [], hours: 8 }];
    saveDayUpdate(nextDay);
    setNewTeamName('');
  };

  const toggleMember = (teamId, memberId, checked) => {
    const nextDay = clone(curDay);
    nextDay.teams = (nextDay.teams || []).map((t) => ({
      ...t,
      members: (t.members || []).filter((m) => m !== memberId)
    }));
    if (checked) {
      const target = nextDay.teams.find((t) => t.teamId === teamId);
      if (target) target.members.push(memberId);
    }
    saveDayUpdate(nextDay);
  };

  const toggleTeamLine = (teamId, lineId, checked) => {
    const nextDay = clone(curDay);
    const target = (nextDay.teams || []).find((t) => t.teamId === teamId);
    if (target) {
      target.lines = (target.lines || []).filter((id) => id !== lineId);
      if (checked) target.lines.push(lineId);
    }
    saveDayUpdate(nextDay);
  };

  const updateTeamHours = (teamId, hours) => {
    const nextDay = clone(curDay);
    const target = (nextDay.teams || []).find((t) => t.teamId === teamId);
    if (target) target.hours = num(hours);
    saveDayUpdate(nextDay);
  };

  const handleAddCost = () => {
    const nextDay = clone(curDay);
    nextDay.costs = nextDay.costs || [];
    const id = rid('c');
    const no = nextCostNo ? nextCostNo(project, { ...days, [date]: nextDay }, 'Consumable', id) : '';
    nextDay.costs.push({ id, no, kategori: 'Consumable', desc: '', qty: 1, price: 0 });
    saveDayUpdate(nextDay);
  };

  const handleUpdateCost = (costId, field, value) => {
    const nextDay = clone(curDay);
    nextDay.costs = (nextDay.costs || []).map((c) => {
      if (c.id !== costId) return c;
      const updated = { ...c, [field]: value };
      if (field === 'kategori' && nextCostNo) {
        updated.no = nextCostNo(project, { ...days, [date]: nextDay }, value, costId);
      }
      return updated;
    });
    saveDayUpdate(nextDay);
  };

  const handleDeleteCost = (costId) => {
    const nextDay = clone(curDay);
    nextDay.costs = (nextDay.costs || []).filter((c) => c.id !== costId);
    saveDayUpdate(nextDay);
  };

  // Lines sorting & filtering
  const isAssigned = (lid) => teams.some((t) => (t.lines || []).includes(lid));
  let displayLines = [...(project.lines || [])].sort(
    (a, b) => (isAssigned(b.id) ? 1 : 0) - (isAssigned(a.id) ? 1 : 0) || String(a.code).localeCompare(String(b.code))
  );
  if (onlyAssigned) {
    displayLines = displayLines.filter((l) => isAssigned(l.id) || num(curDay.prog?.[l.id]) > 0);
  }

  return (
    <div className="space-y-4">
      {/* Header & Date Strip */}
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Input harian</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  saved
                    ? curDay.savedAt
                      ? dark
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : dark
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    : dark
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {saved ? (curDay.savedAt ? `Tersimpan${curDay.rev ? ` · Rev${curDay.rev}` : ''}` : 'Draft') : 'Kosong'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {HARI_LONG[dow(date)]}, {fmtDate(date)} ·{' '}
              {saved
                ? curDay.savedAt
                  ? 'Laporan harian terkunci'
                  : 'Perubahan tersimpan otomatis'
                : 'Belum ada data untuk tanggal ini'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDate(addDays(date, -1))}
              className={`p-2 rounded-xl border cursor-pointer transition-colors ${dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
              aria-label="Hari sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium outline-none ${inputCls}`}
            />
            <button
              type="button"
              onClick={() => setDate(addDays(date, 1))}
              className={`p-2 rounded-xl border cursor-pointer transition-colors ${dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
              aria-label="Hari berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project Duration Date Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
          {stripDates.map((dStr) => {
            const has = Boolean(days[dStr]?.savedAt || Object.values(days[dStr]?.prog || {}).some((v) => num(v) > 0));
            const active = dStr === date;
            const monLabel = MON_SHORT[+dStr.slice(5, 7) - 1] || '';
            return (
              <button
                key={dStr}
                type="button"
                onClick={() => setDate(dStr)}
                className={`min-w-[54px] px-2.5 py-2 rounded-xl border text-xs font-mono cursor-pointer shrink-0 text-center transition-all ${
                  active
                    ? dark
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm ring-1 ring-cyan-400/30'
                      : 'bg-sky-600 border-sky-600 text-white shadow-sm ring-2 ring-sky-600/20'
                    : dark
                      ? 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] opacity-80">{HARI_SHORT[dow(dStr)]}</div>
                <div className="font-bold text-base leading-tight">{+dStr.slice(8)}</div>
                <div className="text-[10px] opacity-75">{monLabel}</div>
                <div className="h-1.5 flex justify-center items-center mt-0.5">
                  {has && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        active && !dark ? 'bg-amber-300' : 'bg-orange-500'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {isLocked && (
          <div className={`rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2 text-xs ${dark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5" />
              {isClosed
                ? 'Project sudah berstatus Closed. Input harian terkunci (read-only).'
                : `Laporan ${fmtDate(date)} sudah tersimpan & terkunci${curDay.rev ? ` (Rev${curDay.rev})` : ''}.`}
            </span>
            {!isClosed && (
              <button
                type="button"
                onClick={() => setRevOpen({ ...revOpen, [date]: true })}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer transition-colors"
              >
                Buat Revisi Rev{num(curDay.rev) + 1}
              </button>
            )}
          </div>
        )}

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className={`rounded-xl border p-3 transition-colors ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Rencana s.d. tanggal</span>
              <Calendar className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-lg font-bold mt-1">{fmtPct(planVal)}</div>
          </div>

          <div className={`rounded-xl border p-3 transition-colors ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Aktual setelah input</span>
              <TrendingUp className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className={`text-lg font-bold mt-1 ${devVal < -0.005 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {fmtPct(actVal)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{devVal >= 0 ? '+' : ''}{fmtPct(devVal)}</div>
          </div>

          <div className={`rounded-xl border p-3 transition-colors ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Progres hari ini</span>
              <Activity className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-lg font-bold mt-1">{fmtPct(gainToday, 2)}</div>
          </div>

          <div className={`rounded-xl border p-3 transition-colors ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Manpower hadir</span>
              <Users className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-lg font-bold mt-1">{todayInfo.mp} orang</div>
            <div className="text-[11px] text-slate-400">{fmtNum(todayInfo.mh, 1)} man-hours</div>
          </div>

          <div className={`rounded-xl border p-3 transition-colors col-span-2 sm:col-span-1 ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200/80 bg-slate-50/70'}`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Biaya hari ini</span>
              <Wallet className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-lg font-bold font-mono mt-1">{fmtRp(todayInfo.cost)}</div>
            <div className="text-[11px] text-slate-400 truncate">
              upah {fmtRp(todayInfo.base)}{todayInfo.otCost ? ` + lembur ${fmtRp(todayInfo.otCost)}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* 1 · Pembagian team & kehadiran */}
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${dark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-sky-600 text-white'}`}>
              1
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Pembagian team & kehadiran</h3>
              <p className="text-xs text-slate-400">
                Centang anggota yang hadir dan item yang dikerjakan. Pindahkan manpower antar team dengan mencentang di team tujuan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              disabled={isLocked}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nama team baru..."
              className={`px-3 py-1.5 rounded-xl border text-xs outline-none w-40 ${inputCls}`}
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={handleAddTeam}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors ${dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <Plus className="w-3.5 h-3.5" /> Team
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {teams.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada team. Buat team di tab Manpower & Team atau tambahkan di sini.</p>
          ) : (
            teams.map((t) => {
              const mine = (project.manpower || []).filter((m) => (t.members || []).includes(m.id));
              const free = (project.manpower || []).filter((m) => !where[m.id]);
              const others = (project.manpower || []).filter((m) => where[m.id] && where[m.id] !== t.teamId);

              return (
                <div key={t.teamId} className={`rounded-xl border p-3 space-y-2.5 ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/40'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <h4 className="font-bold text-xs sm:text-sm">{tname(t.teamId)}</h4>
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Jam kerja:</span>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          disabled={isLocked}
                          value={t.hours ?? 8}
                          onChange={(e) => updateTeamHours(t.teamId, e.target.value)}
                          className={`w-16 pl-2 pr-7 py-1 rounded-lg border text-xs font-mono text-right outline-none ${inputCls}`}
                        />
                        <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none">jam</span>
                      </div>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">(&gt;8 jam = lembur)</span>
                    </label>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 mb-1.5">Anggota hari ini ({(t.members || []).length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...mine, ...free].map((m) => {
                        const on = (t.members || []).includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none ${
                              on
                                ? dark ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200 font-semibold' : 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                                : dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={isLocked}
                              checked={on}
                              onChange={(e) => toggleMember(t.teamId, m.id, e.target.checked)}
                              className="accent-sky-600"
                            />
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                on
                                  ? dark ? 'bg-cyan-400 text-slate-950' : 'bg-sky-600 text-white'
                                  : dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {getInitials(m.name)}
                            </span>
                            <span>{m.name}</span>
                            <span className="text-[10px] opacity-70 font-normal">
                              {levelOn(project, curDay, m.id)}{m.source === 'External' ? ' · Ext' : ''}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {others.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[11px] text-slate-400 cursor-pointer">
                          Pindahkan dari team lain ({others.length})
                        </summary>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {others.map((m) => (
                            <label
                              key={m.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none ${dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}
                            >
                              <input
                                type="checkbox"
                                disabled={isLocked}
                                checked={false}
                                onChange={(e) => toggleMember(t.teamId, m.id, e.target.checked)}
                                className="accent-sky-600"
                              />
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                  dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {getInitials(m.name)}
                              </span>
                              <span>{m.name}</span>
                              <span className="text-[10px] opacity-70">· di {tname(where[m.id])}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 mb-1.5">Item yang dikerjakan</div>
                    <div className="flex flex-wrap gap-1.5">
                      {openLines.length === 0 ? (
                        <span className="text-xs text-slate-400">Belum ada item di Plan Awal.</span>
                      ) : (
                        openLines.map((l) => {
                          const on = (t.lines || []).includes(l.id);
                          return (
                            <label
                              key={l.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none ${
                                on
                                  ? dark ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200 font-semibold' : 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                                  : dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isLocked}
                                checked={on}
                                onChange={(e) => toggleTeamLine(t.teamId, l.id, e.target.checked)}
                                className="accent-sky-600"
                              />
                              <span className="font-mono">{l.code}</span>
                              <span className="text-[11px] opacity-80 font-normal">
                                {l.product}{l.area ? ` · ${l.area}` : ''}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* HSE Scope */}
        {hseManpower.length > 0 && (
          <div className={`rounded-xl border p-3 space-y-2 ${dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/40'}`}>
            <h4 className="font-bold text-xs">Tanggung jawab HSE</h4>
            <div className="space-y-2">
              {hseManpower.map((m) => {
                const sc = (curDay.hse || {})[m.id];
                const isAll = !Array.isArray(sc);
                return (
                  <div key={m.id} className="flex flex-wrap items-start gap-3">
                    <div className="min-w-[140px]">
                      <div className="text-xs font-bold">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.source} · HSE</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <select
                        disabled={isLocked}
                        value={isAll ? 'all' : 'some'}
                        onChange={(e) => {
                          const nextDay = clone(curDay);
                          nextDay.hse = nextDay.hse || {};
                          nextDay.hse[m.id] = e.target.value === 'all' ? 'all' : (Array.isArray(sc) ? sc : []);
                          saveDayUpdate(nextDay);
                        }}
                        className={`w-full max-w-xs px-2.5 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`}
                      >
                        <option value="all">Semua area</option>
                        <option value="some">Item / area tertentu</option>
                      </select>
                      {!isAll && (
                        <div className="flex flex-wrap gap-1.5">
                          {(project.lines || []).map((l) => {
                            const checked = sc.includes(l.id);
                            return (
                              <label
                                key={l.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer ${
                                  checked
                                    ? dark ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200 font-semibold' : 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
                                    : dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isLocked}
                                  checked={checked}
                                  onChange={(e) => {
                                    const nextDay = clone(curDay);
                                    nextDay.hse = nextDay.hse || {};
                                    const cur = Array.isArray(nextDay.hse[m.id]) ? nextDay.hse[m.id] : [];
                                    nextDay.hse[m.id] = e.target.checked
                                      ? [...cur, l.id]
                                      : cur.filter((x) => x !== l.id);
                                    saveDayUpdate(nextDay);
                                  }}
                                />
                                <span className="font-mono">{l.code}</span>
                                <span className="text-[11px] opacity-80">{l.product}{l.area ? ` · ${l.area}` : ''}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {absent.length > 0 && (project.manpower || []).length > 0 && (
          <p className="text-[11px] text-slate-400">
            Tidak hadir / belum ditugaskan: {absent.map((m) => m.name).join(', ')}
          </p>
        )}
      </div>

      {/* 2 · Perkembangan pekerjaan */}
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 shadow-sm ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${dark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-sky-600 text-white'}`}>
              2
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Perkembangan pekerjaan</h3>
              <p className="text-xs text-slate-400">
                Isi tambahan progres <b>hari ini (+%)</b> per tahap pekerjaan. Progres item dihitung otomatis dari bobot masing-masing tahap.
              </p>
            </div>
          </div>
          <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer select-none ${
            onlyAssigned
              ? dark ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200 font-semibold' : 'border-sky-500 bg-sky-50 text-sky-900 font-semibold'
              : dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <input
              type="checkbox"
              checked={onlyAssigned}
              onChange={(e) => setOnlyAssigned(e.target.checked)}
              className="accent-sky-600"
            />
            <span>Hanya item yang ditugaskan</span>
          </label>
        </div>

        {displayLines.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">Tidak ada item.</p>
        ) : (
          <div className="space-y-3">
            {displayLines.map((l) => {
              const pv = Math.min(1, prevCum[l.id] || 0);
              const inc = num(curDay.prog?.[l.id]);
              const cum = Math.min(1, pv + inc);
              const pl = planFrac ? planFrac(l, date) : 0;
              const done = pv >= 0.999;
              const jc = jobCum(days, l, addDays(date, -1), masterJobs);
              const jp = (curDay.jp || {})[l.id] || {};
              const jobs = jobNorm(l, masterJobs);
              const tn = [
                ...teams.filter((t) => (t.lines || []).includes(l.id)).map((t) => tname(t.teamId)),
                ...hseOfLine(l.id)
              ];

              // Find last job
              let lastJob = null;
              jobs.forEach((j) => {
                const tot = Math.min(1, (jc[j.id] || 0) + num(jp[j.id]));
                if (tot > 0.0005) lastJob = { name: j.name, pct: tot };
              });

              return (
                <div
                  key={l.id}
                  className={`rounded-xl border p-3.5 space-y-3 transition-colors ${
                    dark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/70">
                    <div>
                      <div className="font-bold text-xs sm:text-sm">
                        <span className="font-mono mr-1">{l.code}</span> · {l.product}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {l.area || '-'} · {fmtNum(l.qty, 2)} {l.satuan}
                        {tn.length > 0 ? ` · ${tn.join(', ')}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Rencana</div>
                        <div className="font-mono font-semibold">{fmtPct(pl)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">S.d. kemarin</div>
                        <div className="font-mono font-semibold">{fmtPct(pv)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Hari ini</div>
                        <div className="font-mono font-semibold">
                          {inc > 0 ? <span className="text-emerald-500">+{fmtPct(inc, 2)}</span> : '–'}
                        </div>
                      </div>
                      <div className="min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Kumulatif</span>
                          <span className="font-mono font-bold text-xs text-inherit">{fmtPct(cum)}</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${clamp(cum, 0, 1) * 100}%` }} />
                        </div>
                      </div>
                      <div className="min-w-[100px]">
                        <div className="text-[10px] text-slate-400">Job terakhir</div>
                        <div className="font-medium">
                          {lastJob ? (
                            <span>
                              <b>{lastJob.name}</b> <span className="text-slate-400 text-[11px]">{fmtPct(lastJob.pct, 0)}</span>
                            </span>
                          ) : done ? (
                            'Selesai'
                          ) : (
                            <span className="text-slate-400">–</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {(!done || inc > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                      {jobs.map((j) => {
                        const before = Math.min(1, jc[j.id] || 0);
                        const val = num(jp[j.id]);
                        const maxAdd = Math.max(0, 1 - before);
                        const full = before >= 0.999;
                        return (
                          <div
                            key={j.id}
                            className={`flex flex-col justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-xs ${
                              val > 0
                                ? dark ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-sky-500 bg-sky-50'
                                : dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'
                            } ${full && !val ? 'opacity-55' : ''}`}
                          >
                            <div className="font-semibold truncate" title={j.name}>
                              {j.name} <span className="text-[10px] text-slate-400 font-normal">{fmtPct(j.w, 0)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1.5">
                              <input
                                type="number"
                                disabled={isLocked || (full && !val)}
                                min="0"
                                max={+(maxAdd * 100).toFixed(2)}
                                step="any"
                                placeholder="+%"
                                value={val ? +(val * 100).toFixed(2) : ''}
                                onChange={(e) => {
                                  const v = clamp(num(e.target.value) / 100, 0, maxAdd);
                                  const nextDay = clone(curDay);
                                  nextDay.jp = nextDay.jp || {};
                                  nextDay.jp[l.id] = nextDay.jp[l.id] || {};
                                  if (v > 0) nextDay.jp[l.id][j.id] = v;
                                  else delete nextDay.jp[l.id][j.id];
                                  nextDay.prog = nextDay.prog || {};
                                  nextDay.prog[l.id] = jobs.reduce((s, x) => s + x.w * num(nextDay.jp[l.id][x.id]), 0);
                                  saveDayUpdate(nextDay);
                                }}
                                className={`w-full px-1.5 py-1 rounded border text-xs font-mono text-right outline-none ${inputCls}`}
                              />
                              <span className="text-[11px] font-mono text-slate-400 w-9 text-right shrink-0">
                                {fmtPct(Math.min(1, before + val), 0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3 · Biaya yang timbul */}
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 shadow-sm ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${dark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-sky-600 text-white'}`}>
              3
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Biaya yang timbul</h3>
              <p className="text-xs text-slate-400">
                Pembelian part, consumable, sewa alat, transportasi, akomodasi, dll. Nomor biaya dibuat otomatis per kategori
                {costPrefix ? ` (contoh ${costPrefix(project, 'Akomodasi')}001)` : ''}.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLocked}
            onClick={handleAddCost}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors ${
              dark
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Tambah biaya
          </button>
        </div>

        <div className={`overflow-x-auto rounded-xl border ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b ${dark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <th className="py-2.5 px-3 font-semibold">No</th>
                <th className="py-2.5 px-3 font-semibold">Kategori</th>
                <th className="py-2.5 px-3 font-semibold">Deskripsi</th>
                <th className="py-2.5 px-3 font-semibold">Qty</th>
                <th className="py-2.5 px-3 font-semibold">Harga satuan</th>
                <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                <th className="py-2.5 px-3 w-8"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              {todayInfo.base > 0 && (
                <tr className={dark ? 'bg-slate-950/30 text-slate-300' : 'bg-slate-50/60 text-slate-700'}>
                  <td className="py-2 px-3 font-mono text-slate-400">AUTO</td>
                  <td className="py-2 px-3 font-medium">Upah manpower</td>
                  <td className="py-2 px-3 text-slate-400">{todayInfo.mp} orang hadir × tarif Tabel 2</td>
                  <td className="py-2 px-3 font-mono text-right">{todayInfo.mp}</td>
                  <td className="py-2 px-3 font-mono text-right text-slate-400">–</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold whitespace-nowrap">{fmtRp(todayInfo.base)}</td>
                  <td className="py-2 px-3 text-center text-slate-400" title="Otomatis dari kehadiran manpower">
                    <Lock className="w-3.5 h-3.5 inline" />
                  </td>
                </tr>
              )}
              {todayInfo.otCost > 0 && (
                <tr className={dark ? 'bg-slate-950/30 text-slate-300' : 'bg-slate-50/60 text-slate-700'}>
                  <td className="py-2 px-3 font-mono text-slate-400">AUTO</td>
                  <td className="py-2 px-3 font-medium">Lembur</td>
                  <td className="py-2 px-3 text-slate-400">{fmtNum(todayInfo.ot, 1)} jam × tarif lembur</td>
                  <td className="py-2 px-3 font-mono text-right">{fmtNum(todayInfo.ot, 1)}</td>
                  <td className="py-2 px-3 font-mono text-right text-slate-400">–</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold whitespace-nowrap">{fmtRp(todayInfo.otCost)}</td>
                  <td className="py-2 px-3 text-center text-slate-400" title="Otomatis dari jam lembur">
                    <Lock className="w-3.5 h-3.5 inline" />
                  </td>
                </tr>
              )}
              {(curDay.costs || []).length === 0 && todayInfo.base <= 0 && todayInfo.otCost <= 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 px-3 text-slate-400">
                    Belum ada biaya hari ini.
                  </td>
                </tr>
              ) : (
                (curDay.costs || []).map((c) => (
                  <tr key={c.id}>
                    <td className="py-1.5 px-2 font-mono font-semibold whitespace-nowrap">{c.no || '-'}</td>
                    <td className="py-1.5 px-2">
                      <select
                        disabled={isLocked}
                        value={c.kategori}
                        onChange={(e) => handleUpdateCost(c.id, 'kategori', e.target.value)}
                        className={`px-2 py-1 rounded border text-xs outline-none ${inputCls}`}
                      >
                        {KATEGORI.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={c.desc || ''}
                        placeholder="cth: Gasket 12in 4 pcs"
                        onChange={(e) => handleUpdateCost(c.id, 'desc', e.target.value)}
                        className={`w-full min-w-[160px] px-2 py-1 rounded border text-xs outline-none ${inputCls}`}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        disabled={isLocked}
                        value={c.qty ?? 1}
                        onChange={(e) => handleUpdateCost(c.id, 'qty', num(e.target.value))}
                        className={`w-16 px-2 py-1 rounded border text-xs font-mono text-right outline-none ${inputCls}`}
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        disabled={isLocked}
                        value={c.price ?? 0}
                        onChange={(e) => handleUpdateCost(c.id, 'price', num(e.target.value))}
                        className={`w-28 px-2 py-1 rounded border text-xs font-mono text-right outline-none ${inputCls}`}
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-semibold whitespace-nowrap">
                      {fmtRp(num(c.qty) * num(c.price))}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleDeleteCost(c.id)}
                        className="text-rose-500 hover:text-rose-400 disabled:opacity-40 cursor-pointer"
                        aria-label="Hapus biaya"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className={`border-t font-bold ${dark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-slate-100/80'}`}>
                <td colSpan={5} className="py-2.5 px-3">
                  Total biaya hari ini
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm">{fmtRp(todayInfo.cost)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4 · Catatan lapangan */}
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 shadow-sm ${cardCls}`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${dark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-sky-600 text-white'}`}>
            4
          </span>
          <h3 className="font-bold text-sm sm:text-base">Catatan lapangan</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Cuaca</span>
            <select
              disabled={isLocked}
              value={curDay.cuaca || ''}
              onChange={(e) => saveDayUpdate({ ...curDay, cuaca: e.target.value })}
              className={`w-full px-2.5 py-2 rounded-xl border text-xs outline-none ${inputCls}`}
            >
              <option value="">– Pilih cuaca –</option>
              {CUACA.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Catatan pekerjaan</span>
            <textarea
              rows={2}
              disabled={isLocked}
              placeholder="cth: Pekerjaan berjalan lancar..."
              value={curDay.catatan || ''}
              onChange={(e) => saveDayUpdate({ ...curDay, catatan: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${inputCls}`}
            />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Kendala / isu</span>
            <textarea
              rows={2}
              disabled={isLocked}
              placeholder="cth: Hujan 1 jam, tunggu permit..."
              value={curDay.kendala || ''}
              onChange={(e) => saveDayUpdate({ ...curDay, kendala: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${inputCls}`}
            />
          </label>
          <label className="block text-xs space-y-1">
            <span className="text-slate-400 font-medium">Rencana besok</span>
            <textarea
              rows={2}
              disabled={isLocked}
              placeholder="cth: Lanjut instalasi L02..."
              value={curDay.besok || ''}
              onChange={(e) => saveDayUpdate({ ...curDay, besok: e.target.value })}
              className={`w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none ${inputCls}`}
            />
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={`rounded-2xl border p-4 flex flex-wrap items-center gap-2.5 shadow-sm ${cardCls}`}>
        <button
          type="button"
          disabled={isLocked}
          onClick={handleLockDay}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors ${dark ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{revOpen[date] ? 'Simpan revisi' : 'Simpan laporan harian'}</span>
        </button>
        {onViewReport && (
          <button
            type="button"
            onClick={onViewReport}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lihat laporan harian</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Save PDF hari ini</span>
        </button>
      </div>
    </div>
  );
}
