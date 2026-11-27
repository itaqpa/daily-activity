export const SATUAN = ['unit', 'set', 'pcs', 'm²', 'm'];
export const SOURCES = ['Internal', 'External'];
export const KATEGORI = [
  'Part / Material',
  'Consumable',
  'Sewa Alat',
  'Transportasi',
  'Akomodasi',
  'Konsumsi',
  'Lain-lain'
];
export const CUACA = ['Cerah', 'Berawan', 'Hujan ringan', 'Hujan lebat'];
export const STATUS = {
  registered: 'Registered',
  planned: 'Planned',
  running: 'Running',
  closed: 'Closed'
};
export const OT_BASE = 8;

export const DEF_CODES = {
  'Part / Material': 'PM',
  Consumable: 'CS',
  'Sewa Alat': 'SA',
  Transportasi: 'TR',
  Akomodasi: 'AK',
  Konsumsi: 'KS',
  'Lain-lain': 'LL'
};

export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const rid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const MONL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
export const toUTC = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
export function addDays(s, n) {
  if (!isDate(s)) return '';
  const d = new Date(toUTC(s) + n * 86400000);
  return d.toISOString().slice(0, 10);
}
export const diffDays = (a, b) => (isDate(a) && isDate(b) ? Math.round((toUTC(b) - toUTC(a)) / 86400000) : 0);
export const dayCount = (a, b) => diffDays(a, b) + 1;
export function dateRange(a, b, max = 800) {
  const o = [];
  if (!isDate(a) || !isDate(b) || a > b) return o;
  let d = a;
  while (d <= b && o.length < max) {
    o.push(d);
    d = addDays(d, 1);
  }
  return o;
}
export const dow = (s) => (isDate(s) ? new Date(toUTC(s)).getUTCDay() : 0);
export const weekStart = (s) => addDays(s, -((dow(s) + 6) % 7));
export const monthOf = (s) => (s || '').slice(0, 7);
export const monthStart = (m) => m + '-01';
export function monthEnd(m) {
  if (!m || m.length < 7) return '';
  const y = +m.slice(0, 4);
  const mo = +m.slice(5, 7);
  return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
}
export const minD = (...a) => a.filter(isDate).sort()[0] || '';
export const maxD = (...a) => a.filter(isDate).sort().slice(-1)[0] || '';

export function fmtDate(s, long) {
  if (!isDate(s)) return '-';
  const m = +s.slice(5, 7) - 1;
  return `${+s.slice(8, 10)} ${long ? MONL[m] : MON[m]} ${s.slice(0, 4)}`;
}
export const fmtDay = (s) => (isDate(s) ? `${HARI[dow(s)]}, ${fmtDate(s, true)}` : '-');
export const fmtMonth = (m) => (m && m.length >= 7 ? `${MONL[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}` : '-');
export const fmtRange = (a, b) => `${fmtDate(a)} – ${fmtDate(b)}`;
export const fmtNum = (n, d = 0) => (+n || 0).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtRp = (n) => 'Rp ' + Math.round(+n || 0).toLocaleString('id-ID');
export const fmtPct = (f, d = 1) =>
  ((+f || 0) * 100).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
export const fmtSigned = (f, d = 1) => ((+f || 0) >= 0.00005 ? '+' : '') + fmtPct(f, d);
export const fmtTs = (t) => {
  if (!t) return '';
  try {
    return new Date(t).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};
export const pct100 = (f) => +((+f || 0) * 100).toFixed(2);

/* ================= Plan & Progress ================= */
export const lineEnd = (l) => addDays(l.start, Math.max(1, num(l.days)) - 1);
export function planFrac(l, d) {
  if (!isDate(l.start) || d < l.start) return 0;
  const e = lineEnd(l);
  if (d >= e) return 1;
  return dayCount(l.start, d) / Math.max(1, num(l.days));
}
export const planLines = (p) => (p?.baseline ? p.baseline.lines : p?.lines) || [];
export const sumBobot = (lines) => (lines || []).reduce((s, l) => s + num(l.bobot), 0);
export const bobotOk = (s) => Math.abs(s - 1) < 0.0005;
export const planAt = (lines, d) => (lines || []).reduce((s, l) => s + num(l.bobot) * planFrac(l, d), 0);
export const plannedFinish = (p) => addDays(p?.reg?.estStart, Math.max(1, num(p?.reg?.estDays)) - 1);
export const planEnd = (p, lines) => maxD(plannedFinish(p), ...(lines || []).map(lineEnd));
const lineKey = (l) => [l.id, l.product, l.area, num(l.qty), l.satuan, +num(l.bobot).toFixed(6), l.start, l.days].join('|');
export const planDiffers = (p) =>
  !!p?.baseline &&
  (p.baseline.lines || []).map(lineKey).join('#') !== (p.lines || []).map(lineKey).join('#');

export const mpById = (p, id) => (p?.manpower || []).find((m) => m.id === id);
export const teamById = (p, id) => (p?.teams || []).find((t) => t.id === id);
export const lineById = (p, id) => (p?.lines || []).find((l) => l.id === id);

export function dayHasData(d) {
  if (!d) return false;
  return (
    Object.values(d.prog || {}).some((v) => num(v) > 0) ||
    (d.date <= todayStr() && (d.teams || []).some((t) => (t.members || []).length)) ||
    (d.costs || []).length > 0 ||
    !!(d.catatan || d.kendala || d.besok) ||
    !!d.savedAt
  );
}
export const dataDates = (D) => Object.keys(D || {}).filter((k) => dayHasData(D[k])).sort();

export function cumByLine(D, upTo, from) {
  const c = {};
  Object.keys(D || {}).forEach((k) => {
    if (k > upTo || (from && k < from)) return;
    const pr = D[k]?.prog || {};
    for (const id in pr) c[id] = (c[id] || 0) + num(pr[id]);
  });
  return c;
}

export function actualAt(p, D, d, filter) {
  const c = cumByLine(D, d);
  let s = 0;
  let w = 0;
  (p?.lines || []).forEach((l) => {
    if (filter && !filter(l)) return;
    w += num(l.bobot);
    s += num(l.bobot) * Math.min(1, c[l.id] || 0);
  });
  return filter ? (w > 0 ? s / w : 0) : s;
}
export const lineActual = (D, lid, d) => Math.min(1, cumByLine(D, d)[lid] || 0);
export function lineDoneDate(D, lid) {
  let c = 0;
  for (const k of Object.keys(D || {}).sort()) {
    c += num(D[k]?.prog?.[lid]);
    if (c >= 0.999) return k;
  }
  return '';
}
export function firstActual(D) {
  for (const k of Object.keys(D || {}).sort()) {
    if (Object.values(D[k]?.prog || {}).some((v) => num(v) > 0)) return k;
  }
  return '';
}

/* ================= Timeline & Curve ================= */
export function asOfDate(p) {
  const t = todayStr();
  if (p?.status === 'closed' && isDate(p.closedAt)) return p.closedAt;
  return t;
}
export function timeline(p, D) {
  const base = planLines(p);
  const dd = dataDates(D);
  const start = minD(
    p?.reg?.estStart,
    ...(p?.lines || []).map((l) => l.start),
    ...base.map((l) => l.start),
    dd[0]
  );
  let end = maxD(planEnd(p, p?.lines || []), planEnd(p, base), dd[dd.length - 1]);
  let actEnd = dd[dd.length - 1] || '';
  if (p?.status === 'running') {
    const t = todayStr();
    if (t >= start) {
      actEnd = maxD(actEnd, t);
      end = maxD(end, t);
    }
  }
  if (p?.status === 'closed' && isDate(p.closedAt)) {
    actEnd = maxD(actEnd, p.closedAt);
    end = maxD(end, p.closedAt);
  }
  if (start && end && diffDays(start, end) > 720) end = addDays(start, 720);
  return { start, end, actEnd };
}

export function curve(p, D, opt = {}) {
  const f = opt.filter;
  const tl = timeline(p, D);
  const dates = dateRange(tl.start, tl.end);
  const norm = (lines) => {
    const sel = f ? (lines || []).filter(f) : lines || [];
    const w = sumBobot(sel);
    return (d) => (sel.length && w > 0 ? planAt(sel, d) / (f ? w : 1) : 0);
  };
  const pb = norm(planLines(p));
  const pr = planDiffers(p) ? norm(p.lines) : null;
  const sel = f ? (p?.lines || []).filter(f) : p?.lines || [];
  const w = sumBobot(sel);
  const keys = Object.keys(D || {}).sort();
  let ki = 0;
  const cum = {};
  const act = dates.map((d) => {
    while (ki < keys.length && keys[ki] <= d) {
      const pg = D[keys[ki]]?.prog || {};
      for (const id in pg) cum[id] = (cum[id] || 0) + num(pg[id]);
      ki++;
    }
    if (!tl.actEnd || d > tl.actEnd) return null;
    let s = 0;
    sel.forEach((l) => {
      s += num(l.bobot) * Math.min(1, cum[l.id] || 0);
    });
    return f ? (w > 0 ? s / w : 0) : s;
  });
  const cut = opt.until || null;
  return {
    dates,
    plan: dates.map(pb),
    rev: pr ? dates.map(pr) : null,
    act: cut ? act.map((v, i) => (dates[i] <= cut ? v : null)) : act,
    actEnd: tl.actEnd
  };
}

export function curveSeries(c) {
  const s = [{ name: c.rev ? 'Rencana (baseline)' : 'Rencana', hex: '#2a78d6', points: c.plan }];
  if (c.rev) s.push({ name: 'Rencana revisi', hex: '#1baf7a', points: c.rev, dash: true });
  s.push({ name: 'Aktual', hex: '#eb6834', points: c.act, bold: true });
  return s;
}

/* ================= Manpower, HSE & Daily Info ================= */
export function rateOf(masterLevels, source, level) {
  const L = masterLevels || [];
  const v = L.find((x) => x.source === source && x.level === level) || L.find((x) => x.level === level);
  return v ? { rate: num(v.rate), ot: num(v.ot) } : { rate: 0, ot: 0 };
}
export function levelOn(p, d, mid) {
  const m = mpById(p, mid);
  return (d && d.lv && d.lv[mid]) || (m ? m.level : '');
}
export const lvKey = (src, lv) => `${src} · ${lv}`;

export function dayInfo(p, d, masterLevels) {
  const present = new Map();
  let mh = 0;
  let ot = 0;
  (d?.teams || []).forEach((t) => {
    const hrs = num(t.hours);
    const o = Math.max(0, hrs - OT_BASE);
    (t.members || []).forEach((m) => {
      const mp = mpById(p, m);
      if (!mp || present.has(m)) return;
      present.set(m, o);
      mh += hrs;
      ot += o;
    });
  });
  let wage = 0;
  let otCost = 0;
  const byLevel = {};
  present.forEach((o, m) => {
    const mp = mpById(p, m);
    const lv = levelOn(p, d, m);
    const r = rateOf(masterLevels, mp.source, lv);
    wage += r.rate;
    otCost += o * r.ot;
    const k = lvKey(mp.source, lv);
    byLevel[k] = (byLevel[k] || 0) + 1;
  });
  const other = (d?.costs || []).reduce((s, c) => s + num(c.qty) * num(c.price), 0);
  return {
    present: [...present.keys()],
    mp: present.size,
    mh,
    ot,
    wage: wage + otCost,
    base: wage,
    otCost,
    other,
    cost: wage + otCost + other,
    byLevel
  };
}

export const teamsOfLine = (d, lid) => (d?.teams || []).filter((t) => (t.lines || []).includes(lid));
export const isHSE = (lv) => /^hse$/i.test(String(lv || '').trim());
export function hseScope(p, d, mid) {
  const s = (d?.hse || {})[mid];
  return Array.isArray(s) ? s.filter((id) => lineById(p, id)) : 'all';
}
export function presentHSE(p, d) {
  const ids = [];
  (d?.teams || []).forEach((t) =>
    (t.members || []).forEach((m) => {
      if (mpById(p, m) && isHSE(levelOn(p, d, m)) && !ids.includes(m)) ids.push(m);
    })
  );
  return ids;
}
export function hseOfLine(p, d, lid) {
  return presentHSE(p, d).filter((m) => {
    const s = hseScope(p, d, m);
    return s === 'all' || s.includes(lid);
  });
}
export function hseLabel(p, d, m) {
  const s = hseScope(p, d, m);
  return s === 'all' ? 'Semua area' : s.map((id) => (lineById(p, id) || {}).code).filter(Boolean).join(', ') || 'belum ditentukan';
}

/* ================= Period, KPIs & Summary ================= */
export function periodInfo(p, D, from, to, masterLevels) {
  const ks = Object.keys(D || {}).filter((k) => k >= from && k <= to).sort();
  const o = { days: [], mpDays: 0, mh: 0, wage: 0, cat: {}, other: 0, cost: 0, pos: {}, people: {}, issues: [], workDays: 0 };
  KATEGORI.forEach((k) => { o.cat[k] = 0; });
  ks.forEach((k) => {
    const d = D[k];
    if (!dayHasData(d)) return;
    const i = dayInfo(p, d, masterLevels);
    o.days.push({ date: k, d, i });
    o.mpDays += i.mp;
    o.mh += i.mh;
    o.wage += i.wage;
    o.other += i.other;
    o.cost += i.cost;
    if (i.mp > 0) o.workDays++;
    (d.costs || []).forEach((c) => {
      const kk = KATEGORI.includes(c.kategori) ? c.kategori : 'Lain-lain';
      o.cat[kk] += num(c.qty) * num(c.price);
    });
    (d.teams || []).forEach((t) =>
      (t.members || []).forEach((m) => {
        const mp = mpById(p, m);
        if (!mp) return;
        const ps = lvKey(mp.source, levelOn(p, d, m));
        o.pos[ps] = o.pos[ps] || { days: new Set(), mh: 0 };
        o.pos[ps].days.add(k + '|' + m);
        o.pos[ps].mh += num(t.hours);
        const pe = (o.people[m] = o.people[m] || { days: new Set(), mh: 0, first: k, last: k });
        pe.days.add(k);
        pe.mh += num(t.hours);
        if (k < pe.first) pe.first = k;
        if (k > pe.last) pe.last = k;
      })
    );
    if (d.kendala) o.issues.push({ date: k, text: d.kendala });
  });
  o.actStart = actualAt(p, D, addDays(from, -1));
  o.actEnd = actualAt(p, D, to);
  o.gain = o.actEnd - o.actStart;
  const base = planLines(p);
  o.planStart = planAt(base, addDays(from, -1));
  o.planEnd = planAt(base, to);
  o.planGain = o.planEnd - o.planStart;
  return o;
}

export function costTo(p, D, upTo, masterLevels) {
  let s = 0;
  Object.keys(D || {}).forEach((k) => {
    if (k <= upTo) s += dayInfo(p, D[k], masterLevels).cost;
  });
  return s;
}

export function kpis(p, D, asOf, masterLevels) {
  asOf = asOf || asOfDate(p);
  const base = planLines(p);
  const plan = planAt(base, asOf);
  const actual = actualAt(p, D, asOf);
  const fa = firstActual(D);
  let forecast = '';
  let done = '';
  if (actual >= 0.999) {
    const ds = (p?.lines || []).map((l) => lineDoneDate(D, l.id));
    done = ds.length && ds.every(Boolean) ? maxD(...ds) : '';
    forecast = done || asOf;
  } else if (actual > 0 && fa) {
    const el = Math.max(1, dayCount(fa, asOf));
    forecast = addDays(asOf, Math.ceil((1 - actual) / (actual / el)));
  }
  const cost = costTo(p, D, asOf, masterLevels);
  const budget = num(p?.reg?.budget);
  return {
    asOf,
    plan,
    actual,
    dev: actual - plan,
    spi: plan > 0 ? actual / plan : null,
    elapsed: Math.max(0, dayCount(p?.reg?.estStart, asOf)),
    total: num(p?.reg?.estDays) || 1,
    remain: diffDays(asOf, plannedFinish(p)),
    finish: plannedFinish(p),
    forecast,
    done,
    cost,
    budget,
    used: budget > 0 ? cost / budget : null,
    first: fa
  };
}

export function projSummary(p, D, masterLevels) {
  const k = kpis(p, D, null, masterLevels);
  const dd = dataDates(D);
  let mh = 0;
  dd.forEach((x) => { mh += dayInfo(p, D[x], masterLevels).mh; });
  return {
    actual: +k.actual.toFixed(5),
    plan: +k.plan.toFixed(5),
    cost: Math.round(k.cost),
    mh: Math.round(mh * 10) / 10,
    lastDay: dd[dd.length - 1] || '',
    asOf: k.asOf
  };
}

export const devTone = (dev) => (dev >= -0.005 ? 'ok' : dev >= -0.05 ? 'warn' : 'bad');
export const devLabel = (dev) => (dev >= -0.005 ? 'Sesuai / lebih cepat' : dev >= -0.05 ? 'Sedikit terlambat' : 'Terlambat');
export const weekNo = (p, ws) => Math.floor(diffDays(weekStart(p?.reg?.estStart || ws), ws) / 7) + 1;
export function productGroups(p) {
  const g = {};
  (p?.lines || []).forEach((l) => {
    const k = l.product || '(tanpa nama)';
    (g[k] = g[k] || []).push(l);
  });
  return g;
}
export function lineStatus(l, act, plan) {
  if (act >= 0.999) return 'Selesai';
  if (act <= 0 && plan <= 0) return 'Belum mulai';
  if (act >= plan - 0.005) return 'Sesuai rencana';
  return 'Terlambat ' + fmtPct(plan - act);
}

/* ================= Job Stages ================= */
export function jobNorm(l, masterJobs = []) {
  const js = l?.jobs && l.jobs.length ? l.jobs : masterJobs;
  if (!js.length) return [];
  const t = js.reduce((s, j) => s + num(j.bobot), 0);
  return js.map((j) => ({ id: j.id, name: j.name, w: t > 0 ? num(j.bobot) / t : 1 / js.length }));
}
export function applyDayJobs(d, l, cum, jobs) {
  const jp = d?.jp && d.jp[l.id];
  const out = {};
  if (jp && Object.keys(jp).length) {
    jobs.forEach((j) => {
      const v = Math.min(num(jp[j.id]), Math.max(0, 1 - (cum[j.id] || 0)));
      if (v > 0) {
        cum[j.id] = (cum[j.id] || 0) + v;
        out[j.id] = v;
      }
    });
  } else if (num(d?.prog?.[l.id]) > 0) {
    let rem = num(d.prog[l.id]);
    for (const j of jobs) {
      const cap = (1 - (cum[j.id] || 0)) * j.w;
      const take = Math.min(rem, cap);
      if (take > 1e-12) {
        cum[j.id] = (cum[j.id] || 0) + take / j.w;
        out[j.id] = take / j.w;
        rem -= take;
      }
      if (rem <= 1e-9) break;
    }
  }
  return out;
}
export function jobCum(D, l, upTo, masterJobs = []) {
  const jobs = jobNorm(l, masterJobs);
  const cum = {};
  jobs.forEach((j) => { cum[j.id] = 0; });
  Object.keys(D || {}).sort().forEach((k) => {
    if (k <= upTo) applyDayJobs(D[k], l, cum, jobs);
  });
  return cum;
}
export function jobsToday(D, l, date, masterJobs = []) {
  const jobs = jobNorm(l, masterJobs);
  const cum = {};
  jobs.forEach((j) => { cum[j.id] = 0; });
  let today = {};
  Object.keys(D || {}).sort().forEach((k) => {
    if (k > date) return;
    const o = applyDayJobs(D[k], l, cum, jobs);
    if (k === date) today = o;
  });
  return { jobs, cum, today };
}
export function lastJob(D, l, upTo, masterJobs = []) {
  const jobs = jobNorm(l, masterJobs);
  const c = jobCum(D, l, upTo, masterJobs);
  let last = null;
  jobs.forEach((j) => {
    if ((c[j.id] || 0) > 0.0005) last = j;
  });
  return last ? { name: last.name, pct: c[last.id] } : null;
}
export function jobsLabel(l, today, masterJobs = []) {
  return jobNorm(l, masterJobs)
    .filter((j) => today[j.id] > 0)
    .map((j) => `${j.name} +${fmtPct(today[j.id])}`)
    .join('; ');
}
export function progFromJobs(l, jp, masterJobs = []) {
  return jobNorm(l, masterJobs).reduce((s, j) => s + j.w * num((jp || {})[j.id]), 0);
}

/* ================= MP Plan & Cost ================= */
export function mpPlanRows(p, masterLevels) {
  return (p?.mpPlan || []).map((r) => {
    const rt = rateOf(masterLevels, r.source, r.level);
    return {
      ...r,
      rate: rt.rate,
      ot: rt.ot,
      mandays: num(r.qty) * num(r.days),
      cost: num(r.qty) * num(r.days) * rt.rate
    };
  });
}
export function mpActualByLevel(p, D, upTo, masterLevels) {
  const o = {};
  Object.keys(D || {}).forEach((k) => {
    if (k > upTo) return;
    const i = dayInfo(p, D[k], masterLevels);
    for (const key in i.byLevel) {
      o[key] = o[key] || { days: 0, max: 0, workDays: 0 };
      o[key].days += i.byLevel[key];
      o[key].max = Math.max(o[key].max, i.byLevel[key]);
      o[key].workDays++;
    }
  });
  return o;
}

export function costPrefix(p, kat, masterCodes = DEF_CODES) {
  const m = /(\d{4})-(\d+)\s*$/.exec(p?.no || '');
  const y = m ? m[1] : todayStr().slice(0, 4);
  const n = m ? String(+m[2]).padStart(2, '0') : '00';
  const code =
    (masterCodes || DEF_CODES)[kat] ||
    String(kat || 'LL').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() ||
    'LL';
  return `${y}-${n}-${code}-`;
}
export function nextCostNo(p, D, kat, exceptId, masterCodes = DEF_CODES) {
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

export const COST_ROWS = () => ['Upah manpower', 'Lembur', ...KATEGORI];
export function costPlanOf(p, masterLevels) {
  const o = {};
  const mp = mpPlanRows(p, masterLevels).reduce((s, x) => s + x.cost, 0);
  COST_ROWS().forEach((k) => {
    o[k] = k === 'Upah manpower' ? mp : num((p?.costPlan || {})[k]);
  });
  return o;
}
export function costActualOf(p, D, upTo, masterLevels) {
  const o = {};
  COST_ROWS().forEach((k) => { o[k] = 0; });
  Object.keys(D || {}).forEach((k) => {
    if (upTo && k > upTo) return;
    const d = D[k];
    const i = dayInfo(p, d, masterLevels);
    o['Upah manpower'] += i.base;
    o['Lembur'] += i.otCost;
    (d.costs || []).forEach((c) => {
      const kk = KATEGORI.includes(c.kategori) ? c.kategori : 'Lain-lain';
      o[kk] += num(c.qty) * num(c.price);
    });
  });
  return o;
}
export function costCompare(p, D, upTo, masterLevels) {
  const pl = costPlanOf(p, masterLevels);
  const ac = costActualOf(p, D, upTo, masterLevels);
  const rows = COST_ROWS().map((k) => ({
    k,
    plan: pl[k],
    act: ac[k],
    diff: pl[k] - ac[k],
    used: pl[k] > 0 ? ac[k] / pl[k] : null
  }));
  const plan = rows.reduce((s, r) => s + r.plan, 0);
  const act = rows.reduce((s, r) => s + r.act, 0);
  const budget = num(p?.reg?.budget);
  const prog = actualAt(p, D, upTo || asOfDate(p));
  const eac = prog > 0.02 ? act / prog : null;
  return {
    rows,
    plan,
    act,
    budget,
    sisaBudget: budget - act,
    sisaPlan: plan - act,
    prog,
    eac,
    reserve: budget - plan
  };
}
