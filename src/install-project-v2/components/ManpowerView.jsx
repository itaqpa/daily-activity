import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { fmtDate } from '../utils/calc';

const SOURCES = ['Internal', 'External'];
const rid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (o) => JSON.parse(JSON.stringify(o));
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (s, n) => {
  if (!isDate(s)) return todayStr();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86400000).toISOString().slice(0, 10);
};
const isHSE = (lv) => /^hse$/i.test(String(lv || '').trim());

export default function ManpowerView({ dark, project, master, days, onUpdateProject, onSaveDay }) {
  const { user } = useAuth();
  const actorName = user?.nama || user?.name || user?.username || user?.email || 'User';
  const [p, setP] = useState(() => clone(project));
  const [date, setDate] = useState(() => todayStr());
  const [userNames, setUserNames] = useState([]);
  const [mpForm, setMpForm] = useState({ name: '', source: 'Internal', level: 'Leader' });
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);

  const masterLevels = master?.levels || [];
  const levelNames = (src) => [...new Set(masterLevels.filter((v) => !src || v.source === src).map((v) => v.level))];

  useEffect(() => {
    setP(clone(project));
  }, [project?.id]);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const arr = Array.isArray(d) ? d : (d.data || []);
        setUserNames([...new Set(arr.map((u) => u.name || u.nama || u.username).filter(Boolean))]);
      })
      .catch(() => {});
  }, []);

  const persistProject = async (nextP) => {
    setP(nextP);
    setSaving(true);
    try {
      const res = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(nextP.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nextP, actor_name: actorName })
      });
      if (res.ok) onUpdateProject(nextP);
    } finally {
      setSaving(false);
    }
  };

  // Current day record (or auto-copied from previous day)
  const prevDayKey = useMemo(() => {
    return Object.keys(days || {})
      .filter((k) => k < date && (days[k]?.teams || []).some((t) => (t.members || []).length > 0))
      .sort()
      .pop() || '';
  }, [days, date]);

  const currentDay = useMemo(() => {
    if (days && days[date]) return clone(days[date]);
    const prev = prevDayKey ? days[prevDayKey] : null;
    const teams = prev
      ? clone(prev.teams || []).filter((t) => (p.teams || []).some((pt) => pt.id === t.teamId))
      : (p.teams || []).map((t) => ({ teamId: t.id, members: [...(t.members || [])], lines: [], hours: 8 }));
    (p.teams || []).forEach((t) => {
      if (!teams.some((x) => x.teamId === t.id)) teams.push({ teamId: t.id, members: [], lines: [], hours: 8 });
    });
    return {
      date,
      teams,
      prog: {},
      jp: {},
      act: {},
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
  }, [days, date, prevDayKey, p.teams]);

  const levelOn = (d, mid) => {
    const m = (p.manpower || []).find((x) => x.id === mid);
    return (d?.lv && d.lv[mid]) || (m ? m.level : '');
  };

  const inTeam = useMemo(() => {
    const map = {};
    (currentDay.teams || []).forEach((t) => (t.members || []).forEach((m) => { map[m] = t.teamId; }));
    return map;
  }, [currentDay]);

  const levelCounts = useMemo(() => {
    const cnt = {};
    (p.manpower || []).forEach((m) => {
      const k = `${m.source} · ${levelOn(currentDay, m.id)}`;
      cnt[k] = (cnt[k] || 0) + 1;
    });
    return cnt;
  }, [p.manpower, currentDay]);

  const handleAddMp = () => {
    const name = mpForm.name.trim();
    if (!name) return;
    if ((p.manpower || []).some((m) => m.name.toLowerCase() === name.toLowerCase())) return;
    const lv = levelNames(mpForm.source).includes(mpForm.level) ? mpForm.level : (levelNames(mpForm.source)[0] || 'Helper');
    const nextP = {
      ...p,
      manpower: [...(p.manpower || []), { id: rid('m'), name, source: mpForm.source, level: lv }]
    };
    setMpForm({ ...mpForm, name: '' });
    persistProject(nextP);
  };

  const handleDeleteMp = (mid) => {
    const nextP = {
      ...p,
      manpower: (p.manpower || []).filter((m) => m.id !== mid),
      teams: (p.teams || []).map((t) => ({ ...t, members: (t.members || []).filter((x) => x !== mid) }))
    };
    persistProject(nextP);
  };

  const handleAddTeam = () => {
    const name = teamName.trim() || `Team ${String.fromCharCode(65 + (p.teams || []).length)}`;
    const nextP = { ...p, teams: [...(p.teams || []), { id: rid('t'), name, members: [] }] };
    setTeamName('');
    persistProject(nextP);
  };

  const handleDeleteTeam = (tid) => {
    persistProject({ ...p, teams: (p.teams || []).filter((t) => t.id !== tid) });
  };

  const updateDayAndSave = async (nextDay) => {
    await onSaveDay(p.id, date, nextDay);
  };

  const handleDayLevelChange = (mid, newLv) => {
    const nextDay = clone(currentDay);
    nextDay.lv = nextDay.lv || {};
    nextDay.lv[mid] = newLv;
    updateDayAndSave(nextDay);
  };

  const handleDayTeamChange = (mid, tid) => {
    const nextDay = clone(currentDay);
    nextDay.teams = (nextDay.teams || []).map((t) => ({
      ...t,
      members: (t.members || []).filter((x) => x !== mid)
    }));
    if (tid) {
      let target = nextDay.teams.find((t) => t.teamId === tid);
      if (!target) {
        target = { teamId: tid, members: [], lines: [], hours: 8 };
        nextDay.teams.push(target);
      }
      target.members.push(mid);
    }
    updateDayAndSave(nextDay);
  };

  const handleHseScopeChange = (mid, scopeType, lid) => {
    const nextDay = clone(currentDay);
    nextDay.hse = nextDay.hse || {};
    if (scopeType === 'all') {
      nextDay.hse[mid] = 'all';
    } else if (scopeType === 'some') {
      nextDay.hse[mid] = Array.isArray(nextDay.hse[mid]) ? nextDay.hse[mid] : [];
    } else if ((scopeType === 'toggle' || lid) && lid) {
      let arr = Array.isArray(nextDay.hse[mid]) ? nextDay.hse[mid] : [];
      arr = arr.includes(lid) ? arr.filter((x) => x !== lid) : [...arr, lid];
      nextDay.hse[mid] = arr;
    }
    updateDayAndSave(nextDay);
  };

  const cardCls = dark
    ? 'bg-[#0b1222]/85 border-cyan-500/25 backdrop-blur-xl'
    : 'bg-white/95 border-slate-200 shadow-sm';
  const inputCls = dark
    ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 focus:border-cyan-400'
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';

  if (!project) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${cardCls}`}>
        <p className="text-sm text-slate-400">Pilih project terlebih dahulu di menu Project.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {/* Header */}
      <div className="ph">
        <div>
          <h1>Manpower &amp; team</h1>
          <p className="note">
            Registrasikan manpower {p.no} beserta source &amp; level, lalu atur level dan komposisi team per tanggal. Rate mengikuti Master Data dan tidak ditampilkan di sini. {saving && '· Menyimpan...'}
          </p>
        </div>
      </div>

      {/* 1. Registrasi Manpower */}
      <div className="panel">
        <h2>Registrasi manpower</h2>

        <div className="grid" style={{ marginTop: 10 }}>
          <label className="f">
            Nama manpower
            <input
              type="text"
              list="dl-users"
              placeholder="Nama lengkap..."
              value={mpForm.name}
              onChange={(e) => setMpForm({ ...mpForm, name: e.target.value })}
            />
            <datalist id="dl-users">
              {userNames.map((u) => <option key={u} value={u} />)}
            </datalist>
          </label>
          <label className="f">
            Source
            <select
              value={mpForm.source}
              onChange={(e) => {
                const src = e.target.value;
                setMpForm({ ...mpForm, source: src, level: levelNames(src)[0] || 'Helper' });
              }}
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="f">
            Level
            <select
              value={mpForm.level}
              onChange={(e) => setMpForm({ ...mpForm, level: e.target.value })}
            >
              {levelNames(mpForm.source).map((lv) => <option key={lv} value={lv}>{lv}</option>)}
            </select>
          </label>
          <div className="f" style={{ justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleAddMp} className="btn pri">
              + Daftarkan
            </button>
          </div>
        </div>
        <p className="note small" style={{ marginTop: 6 }}>
          Internal = manpower AQPA Indonesia · External = daily manpower yang direkrut khusus untuk project ini.
        </p>

        <div className="scroll" style={{ marginTop: 10 }}>
          <table className="aqpa-tbl ed">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Source</th>
                <th>Level default</th>
                <th className="n">Hari hadir</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(p.manpower || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="note">Belum ada manpower terdaftar.</td>
                </tr>
              ) : (
                p.manpower.map((m) => {
                  const hadir = Object.values(days || {}).filter(
                    (d) => (d.teams || []).some((t) => (t.members || []).includes(m.id))
                  ).length;
                  return (
                    <tr key={m.id}>
                      <td>
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            persistProject({
                              ...p,
                              manpower: (p.manpower || []).map((x) => (x.id === m.id ? { ...x, name: val } : x))
                            });
                          }}
                          style={{ minWidth: 160 }}
                        />
                      </td>
                      <td>
                        <select
                          value={m.source}
                          onChange={(e) => {
                            const src = e.target.value;
                            const nextLv = levelNames(src).includes(m.level) ? m.level : (levelNames(src)[0] || 'Helper');
                            persistProject({
                              ...p,
                              manpower: (p.manpower || []).map((x) => (x.id === m.id ? { ...x, source: src, level: nextLv } : x))
                            });
                          }}
                        >
                          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          value={m.level}
                          onChange={(e) => {
                            const lv = e.target.value;
                            persistProject({
                              ...p,
                              manpower: (p.manpower || []).map((x) => (x.id === m.id ? { ...x, level: lv } : x))
                            });
                          }}
                        >
                          {[...new Set([...levelNames(m.source), m.level])].map((lv) => (
                            <option key={lv} value={lv}>{lv}</option>
                          ))}
                        </select>
                      </td>
                      <td className="n">{hadir}</td>
                      <td className="n">
                        <button type="button" onClick={() => handleDeleteMp(m.id)} className="x" aria-label="Hapus manpower">
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Level & Komposisi Team per Tanggal */}
      <div className="panel">
        <div className="ph">
          <div>
            <h2>Level &amp; komposisi team per tanggal</h2>
            <p className="note">
              {days && days[date] ? 'Tersimpan di database' : prevDayKey ? `Disalin dari ${prevDayKey}` : 'Mengikuti team default'}. Level &amp; team boleh berbeda dari hari sebelumnya.
            </p>
          </div>
          <div className="row">
            <button type="button" onClick={() => setDate(addDays(date, -1))} className="btn sm" aria-label="Hari sebelumnya">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: 'auto' }}
            />
            <button type="button" onClick={() => setDate(addDays(date, 1))} className="btn sm" aria-label="Hari berikutnya">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDate(todayStr())}
              className={`btn sm ${date === todayStr() ? 'pri' : ''}`}
            >
              Hari ini
            </button>
          </div>
        </div>

        <div className="chips" style={{ marginBottom: 10 }}>
          {Object.entries(levelCounts).sort().map(([k, v]) => (
            <span key={k} className="chip">
              {k} <small>{v}</small>
            </span>
          ))}
        </div>

        <div className="scroll">
          <table className="aqpa-tbl ed">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Level pada tanggal ini</th>
                <th>Team</th>
                <th>Tanggung jawab (khusus HSE)</th>
              </tr>
            </thead>
            <tbody>
              {(p.manpower || []).map((m) => {
                const lv = levelOn(currentDay, m.id);
                const tid = inTeam[m.id] || '';
                const hseScope = (currentDay.hse || {})[m.id];
                const isAll = !Array.isArray(hseScope);
                return (
                  <tr key={m.id} style={!tid ? { opacity: 0.65 } : undefined}>
                    <td>
                      <b>{m.name}</b> <span className="note small">({m.source})</span>
                    </td>
                    <td>
                      <select
                        value={lv}
                        onChange={(e) => handleDayLevelChange(m.id, e.target.value)}
                      >
                        {[...new Set([...levelNames(m.source), lv])].map((x) => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={tid}
                        onChange={(e) => handleDayTeamChange(m.id, e.target.value)}
                      >
                        <option value="">– Tidak hadir / belum ditugaskan –</option>
                        {(p.teams || []).map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {isHSE(lv) ? (
                        <div className="space-y-1.5">
                          <select
                            value={isAll ? 'all' : 'some'}
                            onChange={(e) => handleHseScopeChange(m.id, e.target.value)}
                          >
                            <option value="all">Semua area</option>
                            <option value="some">Item / area tertentu</option>
                          </select>
                          {!isAll && (
                            <div className="chips" style={{ marginTop: 6 }}>
                              {(p.lines || []).map((l) => {
                                const on = hseScope.includes(l.id);
                                return (
                                  <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => handleHseScopeChange(m.id, 'toggle', l.id)}
                                    className={`chip ${on ? 'on' : ''}`}
                                  >
                                    {l.code}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="note small">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Daftar Team */}
      <div className="panel">
        <div className="ph">
          <div>
            <h2>Team</h2>
            <p className="note">Kelompok kerja harian. Tanggung jawab area untuk HSE diatur per orang di tabel di atas.</p>
          </div>
          <div className="row">
            <input
              type="text"
              placeholder="Nama team baru..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{ width: 200 }}
            />
            <button type="button" onClick={handleAddTeam} className="btn pri">
              + Team
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(p.teams || []).map((t) => {
            const dt = (currentDay.teams || []).find((x) => x.teamId === t.id) || { members: [] };
            const memberNames = dt.members
              .map((mid) => (p.manpower || []).find((m) => m.id === mid))
              .filter(Boolean);
            return (
              <div key={t.id} className="team flex flex-col justify-between gap-2.5">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        persistProject({
                          ...p,
                          teams: (p.teams || []).map((x) => (x.id === t.id ? { ...x, name: val } : x))
                        });
                      }}
                      style={{ fontWeight: 600, maxWidth: 200 }}
                    />
                    <span className="pill info">{memberNames.length} org</span>
                  </div>
                  <button type="button" onClick={() => handleDeleteTeam(t.id)} className="x" aria-label="Hapus team">
                    ✕
                  </button>
                </div>
                <div className="chips">
                  {memberNames.length > 0 ? (
                    memberNames.map((m) => (
                      <span key={m.id} className="chip">
                        {m.name} <small>{m.level}</small>
                      </span>
                    ))
                  ) : (
                    <span className="note small">Belum ada anggota ({fmtDate(date)})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
