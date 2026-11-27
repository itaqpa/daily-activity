import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  KATEGORI,
  STATUS,
  OT_BASE,
  SOURCES,
  num,
  clone,
  rid,
  isDate,
  todayStr,
  addDays,
  diffDays,
  dayCount,
  dateRange,
  dow,
  HARI,
  weekStart,
  monthOf,
  monthStart,
  monthEnd,
  minD,
  maxD,
  fmtDate,
  fmtDay,
  fmtMonth,
  fmtRange,
  fmtNum,
  fmtRp,
  fmtPct,
  fmtSigned,
  fmtTs,
  lineEnd,
  planFrac,
  planLines,
  sumBobot,
  bobotOk,
  planAt,
  plannedFinish,
  planDiffers,
  mpById,
  teamById,
  lineById,
  dataDates,
  cumByLine,
  actualAt,
  lineActual,
  lineDoneDate,
  firstActual,
  asOfDate,
  curve,
  curveSeries,
  levelOn,
  lvKey,
  dayInfo,
  teamsOfLine,
  presentHSE,
  hseOfLine,
  hseLabel,
  periodInfo,
  costTo,
  kpis,
  devTone,
  devLabel,
  weekNo,
  productGroups,
  lineStatus,
  jobNorm,
  jobCum,
  jobsToday,
  lastJob,
  jobsLabel,
  progFromJobs,
  mpPlanRows,
  mpActualByLevel,
  COST_ROWS,
  costPlanOf,
  costActualOf,
  costCompare,
  costPrefix,
  nextCostNo
} from './calc';

export const AUD = { internal: 'Internal', customer: 'Customer' };
const isInt = (aud) => aud !== 'customer';
const slug = (s) => String(s || '').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

export function cellText(v, f) {
  if (v == null || v === '') return '';
  if (typeof v === 'number') {
    if (f === 'pct') return fmtPct(v, 1);
    if (f === 'rp') return fmtRp(v);
    if (f === 'dec1') return fmtNum(v, 1);
    if (f === 'dec2') return fmtNum(v, 2);
    if (f === 'int') return fmtNum(v, 0);
    return String(v);
  }
  return String(v);
}
export const isNumFmt = (f) => ['pct', 'rp', 'dec1', 'dec2', 'int'].includes(f);

function titleBlock(p, label, val, aud) {
  const r = [
    ['No Project', p.no],
    ['Customer', p.reg?.customer || '-'],
    ['Lokasi', p.reg?.location || '-'],
    ['Leader Project', p.reg?.leader || '-'],
    [label, val],
    ['Status', STATUS[p.status] || p.status],
    ['Estimasi Jadwal', `${fmtRange(p.reg?.estStart, plannedFinish(p))} (${p.reg?.estDays || 0} hari)`]
  ];
  if (isInt(aud)) {
    r.splice(4, 0, ['Sales', p.reg?.sales || '-']);
    r.push(['Budget Instalasi', fmtRp(p.reg?.budget)]);
  }
  return { t: 'kv', rows: r };
}

function chartBlock(p, D, o = {}) {
  const c = curve(p, D, { until: o.until });
  return {
    t: 'chart',
    title: o.title || 'Kurva S – Rencana vs Aktual',
    dates: c.dates,
    series: curveSeries(c),
    marker: o.marker || '',
    markerLabel: o.markerLabel || ''
  };
}

const signBlock = (p, a) => ({
  t: 'sign',
  items: a || [
    { role: 'Dibuat oleh (Leader)', name: p.reg?.leader },
    { role: 'Diperiksa (Project Manager)', name: '' },
    { role: 'Diketahui (Customer)', name: '' }
  ]
});

function baseModel(p, title, kind, period, aud) {
  const t = `${title}${aud ? ' – ' + AUD[aud] : ''}`;
  return {
    title: t,
    subtitle: `${p.no} · ${p.reg?.customer || ''} · ${p.reg?.location || ''}`.replace(/ · $/, ''),
    headRight: `${t} | ${p.no}`,
    orientation: 'portrait',
    file: `${slug(kind)}${aud ? '_' + AUD[aud] : ''}_${slug(p.no)}${period ? '_' + slug(period) : ''}`,
    sheets: []
  };
}

function kpiItems(p, D, d, masterLevels, extra = []) {
  const k = kpis(p, D, d, masterLevels);
  return [
    { l: 'Rencana s.d. tanggal', v: fmtPct(k.plan) },
    { l: 'Aktual s.d. tanggal', v: fmtPct(k.actual), tone: devTone(k.dev) === 'ok' ? 'ok' : devTone(k.dev) === 'bad' ? 'bad' : '' },
    { l: 'Deviasi', v: fmtSigned(k.dev), s: devLabel(k.dev), tone: devTone(k.dev) === 'bad' ? 'bad' : '' },
    { l: 'Hari ke', v: `${k.elapsed} / ${k.total}`, s: 'hari kalender' },
    ...extra
  ];
}

const teamLabel = (p, t) => (teamById(p, t.teamId) ? teamById(p, t.teamId).name : 'Team');
const teamItems = (p, t) => (t.lines || []).map((id) => (lineById(p, id) || {}).code).filter(Boolean).join(', ') || '-';

function costRows(o, cumC, cumW) {
  const rows = KATEGORI.map((k) => (cumC ? [k, o.cat[k], cumC[k]] : [k, o.cat[k]])).filter((r) =>
    r.slice(1).some((v) => v > 0)
  );
  rows.push(
    cumC
      ? ['Upah manpower (Tabel 2, termasuk lembur)', o.wage, cumW]
      : ['Upah manpower (Tabel 2, termasuk lembur)', o.wage]
  );
  rows.push(
    cumC
      ? ['TOTAL', o.cost, KATEGORI.reduce((s, k) => s + cumC[k], 0) + cumW]
      : ['TOTAL', o.cost]
  );
  return rows;
}

function peopleRows(p, o) {
  return Object.keys(o.people)
    .map((id) => {
      const m = mpById(p, id) || {};
      const x = o.people[id];
      return [m.name || '?', m.source || '-', m.level || '-', fmtDate(x.first), fmtDate(x.last), x.days.size, x.mh];
    })
    .sort((a, b) => String(a[2]).localeCompare(b[2]) || String(a[0]).localeCompare(b[0]));
}

function posRows(o) {
  const r = Object.keys(o.pos).sort().map((k) => [k, o.pos[k].days.size, o.pos[k].mh]);
  if (r.length) r.push(['TOTAL', r.reduce((s, x) => s + x[1], 0), r.reduce((s, x) => s + x[2], 0)]);
  return r;
}

function jobMatrix(p, D, upTo, masterJobs) {
  const names = [];
  (p.lines || []).forEach((l) =>
    jobNorm(l, masterJobs).forEach((j) => {
      if (!names.includes(j.name)) names.push(j.name);
    })
  );
  const rows = (p.lines || []).map((l) => {
    const c = jobCum(D, l, upTo, masterJobs);
    const js = jobNorm(l, masterJobs);
    return [
      `${l.code} · ${l.area || l.product}`,
      ...names.map((n) => {
        const j = js.find((x) => x.name === n);
        return j ? c[j.id] : '';
      }),
      lineActual(D, l.id, upTo)
    ];
  });
  return { t: 'table', head: ['Item', ...names, 'Total Item'], fmt: ['text', ...names.map(() => 'pct'), 'pct'], rows };
}

function mpPlanVsActual(p, D, upTo, masterLevels) {
  const act = mpActualByLevel(p, D, upTo, masterLevels);
  const rows = [];
  const seen = new Set();
  mpPlanRows(p, masterLevels).forEach((r) => {
    const k = lvKey(r.source, r.level);
    seen.add(k);
    const a = act[k] || { days: 0, max: 0 };
    rows.push([r.source, r.level, num(r.qty), a.max, r.mandays, a.days, a.days - r.mandays]);
  });
  Object.keys(act).forEach((k) => {
    if (seen.has(k)) return;
    const [s, l] = k.split(' · ');
    rows.push([s, l, 0, act[k].max, 0, act[k].days, act[k].days]);
  });
  return {
    t: 'table',
    head: ['Source', 'Level', 'Rencana (orang)', 'Aktual Maks/hari', 'Rencana Hari-orang', 'Aktual Hari-orang', 'Selisih'],
    fmt: ['text', 'text', 'int', 'int', 'int', 'int', 'int'],
    rows,
    empty: 'Belum ada rencana manpower di Plan Awal.'
  };
}

export function dailyModel(p, D, date, aud = 'internal', master = {}) {
  const masterJobs = master?.jobs || [];
  const masterLevels = master?.levels || [];
  const d = D[date] || { date, teams: [], prog: {}, jp: {}, lv: {}, hse: {}, costs: [], rev: 0, revs: [] };
  const i = dayInfo(p, d, masterLevels);
  const inn = isInt(aud);
  const gain = actualAt(p, D, date) - actualAt(p, D, addDays(date, -1));
  const cum = cumByLine(D, date);
  const M = baseModel(p, 'Laporan Harian', 'Laporan-Harian', date, aud);

  const work = (p.lines || [])
    .filter((l) => num(d.prog?.[l.id]) > 0 || teamsOfLine(d, l.id).length)
    .map((l) => {
      const jt = jobsToday(D, l, date, masterJobs);
      const lj = lastJob(D, l, date, masterJobs);
      const r = [
        l.code,
        l.product,
        l.area,
        +(num(d.prog?.[l.id]) * num(l.qty)).toFixed(2),
        num(d.prog?.[l.id]),
        Math.min(1, cum[l.id] || 0),
        planFrac(l, date),
        jobsLabel(l, jt.today, masterJobs) || '-',
        lj ? `${lj.name} (${fmtPct(lj.pct, 0)})` : '-'
      ];
      if (inn) {
        r.splice(
          3,
          0,
          [
            ...teamsOfLine(d, l.id).map((t) => teamLabel(p, t)),
            ...hseOfLine(p, d, l.id).map((m) => 'HSE ' + ((mpById(p, m) || {}).name || ''))
          ].join(', ') || '-'
        );
      }
      return r;
    });

  const wh = ['Kode', 'Produk', 'Area', 'Qty Hari Ini', '% Hari Ini', 'Kumulatif', 'Rencana', 'Job Dikerjakan Hari Ini', 'Job Terakhir'];
  const wf = ['text', 'text', 'text', 'dec2', 'pct', 'pct', 'pct', 'text', 'text'];
  if (inn) {
    wh.splice(3, 0, 'Team');
    wf.splice(3, 0, 'text');
  }

  const blocks = [
    titleBlock(p, 'Tanggal Laporan', fmtDay(date), aud),
    {
      t: 'kpi',
      items: kpiItems(
        p,
        D,
        date,
        masterLevels,
        inn
          ? [
              { l: 'Progres hari ini', v: fmtSigned(gain, 2) },
              { l: 'Manpower hadir', v: `${i.mp} orang` },
              { l: 'Man-hours', v: fmtNum(i.mh, 1), s: i.ot ? fmtNum(i.ot, 1) + ' jam lembur' : '' },
              { l: 'Biaya hari ini', v: fmtRp(i.cost) }
            ]
          : [
              { l: 'Progres hari ini', v: fmtSigned(gain, 2) },
              { l: 'Item dikerjakan', v: String(work.length) }
            ]
      )
    },
    { t: 'h', text: 'Pekerjaan yang dikerjakan hari ini' },
    { t: 'table', head: wh, fmt: wf, rows: work, empty: 'Belum ada progres dicatat.' }
  ];

  if (inn) {
    const tRows = (d.teams || [])
      .filter((t) => (t.members || []).length)
      .map((t) => [
        teamLabel(p, t),
        t.members
          .map((m) => {
            const x = mpById(p, m);
            return x ? `${x.name} (${levelOn(p, d, m)}${x.source === 'External' ? ', Ext' : ''})` : '';
          })
          .filter(Boolean)
          .join(', '),
        teamItems(p, t),
        num(t.hours),
        Math.max(0, num(t.hours) - OT_BASE),
        num(t.hours) * t.members.length
      ]);
    if (tRows.length) tRows.push(['TOTAL', `${i.mp} orang hadir`, '', '', i.ot, i.mh]);

    const cRows = (d.costs || []).map((c) => [c.no || '-', c.kategori, c.desc || '-', num(c.qty), num(c.price), num(c.qty) * num(c.price)]);
    if (i.base > 0) cRows.push(['-', 'Upah manpower', `${i.mp} orang × tarif Tabel 2`, i.mp, '', i.base]);
    if (i.otCost > 0) cRows.push(['-', 'Lembur', `${fmtNum(i.ot, 1)} jam × tarif lembur`, i.ot, '', i.otCost]);
    cRows.push(['TOTAL', '', '', '', '', i.cost]);

    blocks.push(
      { t: 'h', text: 'Team & kehadiran manpower' },
      {
        t: 'table',
        head: ['Team', 'Anggota (Level)', 'Item', 'Jam Kerja', 'Lembur (jam)', 'Man-hours'],
        fmt: ['text', 'text', 'text', 'dec1', 'dec1', 'dec1'],
        rows: tRows,
        tot: tRows.length ? [tRows.length - 1] : [],
        empty: 'Belum ada pembagian team.'
      },
      ...(presentHSE(p, d).length
        ? [{ t: 'p', text: 'Tanggung jawab HSE: ' + presentHSE(p, d).map((m) => `${(mpById(p, m) || {}).name} – ${hseLabel(p, d, m)}`).join('; '), ink: true }]
        : []),
      { t: 'p', text: 'Komposisi level: ' + (Object.keys(i.byLevel).map((k) => `${k} ${i.byLevel[k]}`).join(', ') || '-'), ink: true },
      { t: 'h', text: 'Biaya yang timbul hari ini' },
      {
        t: 'table',
        head: ['No', 'Kategori', 'Deskripsi', 'Qty', 'Harga Satuan', 'Total'],
        fmt: ['text', 'text', 'text', 'dec2', 'rp', 'rp'],
        rows: cRows,
        tot: [cRows.length - 1]
      }
    );
  }

  blocks.push(
    { t: 'h', text: 'Catatan lapangan' },
    {
      t: 'kv',
      cols: 1,
      rows: [
        ['Cuaca', d.cuaca || '-'],
        ['Catatan pekerjaan', d.catatan || '-'],
        ['Kendala / isu', d.kendala || '-'],
        ['Rencana besok', d.besok || '-']
      ]
    },
    chartBlock(p, D, { until: date, marker: date, markerLabel: 'Tanggal laporan' }),
    signBlock(p)
  );

  const rev = num(d.rev);
  if (rev) {
    M.file += `_Rev${rev}`;
    M.title += ` (Rev${rev})`;
    M.headRight = M.headRight.replace(' |', ` Rev${rev} |`);
    blocks.splice(1, 0, {
      t: 'p',
      text: `Revisi Rev${rev} – ${d.revAt ? fmtTs(d.revAt) : ''}.`,
      ink: true
    });
  }
  M.sheets.push({ name: 'Laporan Harian', blocks });
  return M;
}

function itemTable(p, D, from, to, masterJobs) {
  const c0 = cumByLine(D, addDays(from, -1));
  const c1 = cumByLine(D, to);
  return (p.lines || []).map((l) => {
    const a0 = Math.min(1, c0[l.id] || 0);
    const a1 = Math.min(1, c1[l.id] || 0);
    const pl = planFrac(l, to);
    const lj = lastJob(D, l, to, masterJobs);
    return [l.code, l.product, l.area, num(l.qty), num(l.bobot), pl, a0, a1, a1 - a0, lj ? lj.name : '-', lineStatus(l, a1, pl)];
  });
}

function cumCat(D, upTo) {
  const o = {};
  KATEGORI.forEach((k) => { o[k] = 0; });
  Object.keys(D || {}).forEach((k) => {
    if (k > upTo) return;
    (D[k].costs || []).forEach((c) => {
      const kk = KATEGORI.includes(c.kategori) ? c.kategori : 'Lain-lain';
      o[kk] += num(c.qty) * num(c.price);
    });
  });
  return o;
}

function cumWage(p, D, upTo, masterLevels) {
  let s = 0;
  Object.keys(D || {}).forEach((k) => {
    if (k <= upTo) s += dayInfo(p, D[k], masterLevels).wage;
  });
  return s;
}

export function periodModel(p, D, from, to, kind, aud = 'internal', master = {}) {
  const masterJobs = master?.jobs || [];
  const masterLevels = master?.levels || [];
  const o = periodInfo(p, D, from, to, masterLevels);
  const weekly = kind === 'week';
  const inn = isInt(aud);
  const title = weekly ? 'Laporan Mingguan' : 'Laporan Bulanan';
  const label = weekly ? `Minggu ke-${weekNo(p, from)}` : fmtMonth(monthOf(from));
  const M = baseModel(p, title, weekly ? 'Laporan-Mingguan' : 'Laporan-Bulanan', weekly ? from : monthOf(from), aud);
  const costCum = costTo(p, D, to, masterLevels);
  const recap = [];

  if (weekly) {
    dateRange(from, to).forEach((d) => {
      const x = o.days.find((z) => z.date === d);
      const g = actualAt(p, D, d) - actualAt(p, D, addDays(d, -1));
      recap.push([
        `${HARI[dow(d)].slice(0, 3)} ${fmtDate(d)}`,
        x ? g : null,
        actualAt(p, D, d),
        planAt(planLines(p), d),
        ...(inn ? [x ? x.i.mp : null, x ? x.i.mh : null, x ? x.i.cost : null] : []),
        x && x.d.kendala ? x.d.kendala : ''
      ]);
    });
  } else {
    let ws = weekStart(from);
    while (ws <= to) {
      const a = maxD(ws, from);
      const b = minD(addDays(ws, 6), to);
      const w = periodInfo(p, D, a, b, masterLevels);
      recap.push([
        `Minggu ke-${weekNo(p, ws)} (${fmtDate(a).replace(/ \d{4}$/, '')} – ${fmtDate(b).replace(/ \d{4}$/, '')})`,
        w.gain,
        w.actEnd,
        w.planEnd,
        ...(inn ? [w.mpDays, w.mh, w.cost] : []),
        w.issues.length ? w.issues.length + ' kendala' : ''
      ]);
      ws = addDays(ws, 7);
    }
  }

  const next = weekly ? addDays(to, 7) : monthEnd(monthOf(addDays(to, 1)));
  const tgt = (p.lines || [])
    .map((l) => [l.code, l.product, l.area, planFrac(l, next), lineActual(D, l.id, to)])
    .filter((r) => r[3] > r[4] + 0.0005)
    .map((r) => [...r, r[3] - r[4]]);
  const cc = cumCat(D, to);
  const cw = cumWage(p, D, to, masterLevels);
  const cr = costRows(o, cc, cw);

  const rh = [
    weekly ? 'Tanggal' : 'Minggu',
    'Progres',
    'Kumulatif Aktual',
    'Kumulatif Rencana',
    ...(inn ? [weekly ? 'Manpower' : 'Hari-orang', 'Man-hours', 'Biaya'] : []),
    'Kendala'
  ];
  const rf = ['text', 'pct', 'pct', 'pct', ...(inn ? ['int', 'dec1', 'rp'] : []), 'text'];

  const blocks = [
    titleBlock(p, 'Periode', `${label} · ${fmtRange(from, to)}`, aud),
    {
      t: 'kpi',
      items: kpiItems(p, D, to, masterLevels, [
        { l: 'Progres periode ini', v: fmtSigned(o.gain, 2), s: 'rencana ' + fmtSigned(o.planGain, 2) },
        ...(inn
          ? [
              { l: 'Hari-orang', v: fmtNum(o.mpDays), s: o.workDays + ' hari kerja' },
              { l: 'Man-hours', v: fmtNum(o.mh, 1) },
              {
                l: 'Biaya periode ini',
                v: fmtRp(o.cost),
                s: 'kumulatif ' + fmtRp(costCum) + (p.reg?.budget ? ` (${fmtPct(costCum / p.reg.budget)} budget)` : '')
              }
            ]
          : [{ l: 'Hari kerja', v: String(o.workDays) }])
      ])
    },
    { t: 'h', text: weekly ? 'Rekap harian' : 'Rekap mingguan' },
    { t: 'table', head: rh, fmt: rf, rows: recap },
    { t: 'h', text: 'Progres per item pekerjaan' },
    {
      t: 'table',
      head: ['Kode', 'Produk', 'Area', 'Qty', 'Bobot', 'Rencana', 'Aktual Awal', 'Aktual Akhir', 'Kenaikan', 'Job Terakhir', 'Status'],
      fmt: ['text', 'text', 'text', 'dec2', 'pct', 'pct', 'pct', 'pct', 'pct', 'text', 'text'],
      rows: itemTable(p, D, from, to, masterJobs)
    },
    { t: 'h', text: 'Progres per job (kumulatif akhir periode)' },
    jobMatrix(p, D, to, masterJobs)
  ];

  if (inn) {
    blocks.push(
      { t: 'h', text: 'Manpower per level' },
      { t: 'table', head: ['Source · Level', 'Hari-orang', 'Man-hours'], fmt: ['text', 'int', 'dec1'], rows: posRows(o), tot: Object.keys(o.pos).length ? [Object.keys(o.pos).length] : [], empty: 'Tidak ada kehadiran tercatat.' },
      { t: 'h', text: 'Rencana vs aktual manpower (kumulatif)' },
      mpPlanVsActual(p, D, to, masterLevels),
      { t: 'h', text: 'Kehadiran per manpower' },
      { t: 'table', head: ['Nama', 'Source', 'Level', 'Pertama', 'Terakhir', 'Hari Kerja', 'Jam Kerja'], fmt: ['text', 'text', 'text', 'text', 'text', 'int', 'dec1'], rows: peopleRows(p, o), empty: 'Tidak ada kehadiran tercatat.' },
      { t: 'h', text: 'Biaya per kategori' },
      { t: 'table', head: ['Kategori', 'Periode Ini', 'Kumulatif'], fmt: ['text', 'rp', 'rp'], rows: cr, tot: [cr.length - 1] }
    );
  }

  blocks.push(
    { t: 'h', text: 'Kendala & isu' },
    { t: 'table', head: ['Tanggal', 'Kendala'], fmt: ['text', 'text'], rows: o.issues.map((x) => [fmtDate(x.date), x.text]), empty: 'Tidak ada kendala tercatat.' },
    { t: 'h', text: weekly ? 'Target minggu depan' : 'Target bulan depan' },
    { t: 'table', head: ['Kode', 'Produk', 'Area', 'Target Rencana', 'Aktual Saat Ini', 'Sisa ke Target'], fmt: ['text', 'text', 'text', 'pct', 'pct', 'pct'], rows: tgt, empty: 'Tidak ada target tambahan pada periode berikutnya.' },
    chartBlock(p, D, { until: to, marker: to, markerLabel: 'Akhir periode' }),
    signBlock(p)
  );
  M.sheets.push({ name: title, blocks });
  return M;
}

export const weeklyModel = (p, D, ws, aud, master) => periodModel(p, D, ws, addDays(ws, 6), 'week', aud, master);
export const monthlyModel = (p, D, m, aud, master) => periodModel(p, D, monthStart(m), monthEnd(m), 'month', aud, master);

export function finalModel(p, D, aud = 'internal', master = {}) {
  const masterJobs = master?.jobs || [];
  const masterLevels = master?.levels || [];
  const inn = isInt(aud);
  const dd = dataDates(D);
  const asOf = p.status === 'closed' && isDate(p.closedAt) ? p.closedAt : dd[dd.length - 1] || todayStr();
  const k = kpis(p, D, asOf, masterLevels);
  const from = minD(p.reg?.estStart, dd[0]);
  const o = periodInfo(p, D, from, asOf, masterLevels);
  const actStart = firstActual(D);
  const actEnd = k.done || (p.status === 'closed' ? p.closedAt : '');
  const durA = actStart && actEnd ? dayCount(actStart, actEnd) : null;
  const M = baseModel(p, 'Laporan Akhir Project', 'Laporan-Akhir-Project', '', aud);

  const items = (p.lines || []).map((l) => {
    const fs = Object.keys(D).sort().find((x) => num(D[x].prog?.[l.id]) > 0) || '';
    const de = lineDoneDate(D, l.id);
    return [
      l.code,
      l.product,
      l.area,
      num(l.qty),
      l.satuan,
      num(l.bobot),
      fmtDate(l.start),
      fmtDate(lineEnd(l)),
      fs ? fmtDate(fs) : '-',
      de ? fmtDate(de) : '-',
      de ? diffDays(lineEnd(l), de) : null,
      lineActual(D, l.id, asOf)
    ];
  });

  const pg = productGroups(p);
  const prod = Object.keys(pg).map((n) => {
    const ls = pg[n];
    return [n, ls.length, ls.reduce((s, l) => s + num(l.qty), 0), sumBobot(ls), actualAt(p, D, asOf, (l) => ls.includes(l))];
  });

  const months = [];
  if (from && asOf) {
    let m = monthOf(from);
    while (m <= monthOf(asOf)) {
      const w = periodInfo(p, D, maxD(monthStart(m), from), minD(monthEnd(m), asOf), masterLevels);
      months.push([fmtMonth(m), w.gain, w.actEnd, ...(inn ? [w.mpDays, w.mh, w.cost] : [])]);
      m = monthOf(addDays(monthEnd(m), 1));
    }
  }

  const cr = costRows(o);
  const sl = actEnd ? diffDays(k.finish, actEnd) : null;
  const kp = [
    { l: 'Progres akhir', v: fmtPct(k.actual), tone: k.actual >= 0.999 ? 'ok' : '' },
    { l: 'Rencana selesai', v: fmtDate(k.finish) },
    { l: 'Aktual selesai', v: actEnd ? fmtDate(actEnd) : '-' },
    { l: 'Durasi rencana / aktual', v: `${p.reg?.estDays || 0} / ${durA == null ? '-' : durA} hari` },
    { l: 'Selisih jadwal', v: sl == null ? '-' : `${sl > 0 ? '+' : ''}${sl} hari`, tone: sl > 0 ? 'bad' : 'ok' }
  ];
  if (inn) {
    kp.push(
      { l: 'Total biaya', v: fmtRp(o.cost), s: p.reg?.budget ? fmtPct(o.cost / p.reg.budget) + ' dari budget' : '' },
      { l: 'Sisa budget', v: fmtRp(num(p.reg?.budget) - o.cost), tone: num(p.reg?.budget) - o.cost < 0 ? 'bad' : '' },
      { l: 'Man-hours', v: fmtNum(o.mh, 1), s: fmtNum(o.mpDays) + ' hari-orang' },
      { l: 'Manpower terlibat', v: Object.keys(o.people).length + ' orang' }
    );
  }

  const blocks = [
    titleBlock(p, 'Posisi Data', fmtDate(asOf), aud),
    ...(p.status !== 'closed' ? [{ t: 'p', text: `Draft: project belum ditutup. Data per ${fmtDate(asOf)}.`, ink: true }] : []),
    { t: 'kpi', items: kp },
    { t: 'h', text: 'Rencana vs aktual per item' },
    {
      t: 'table',
      head: ['Kode', 'Produk', 'Area', 'Qty', 'Satuan', 'Bobot', 'Rencana Mulai', 'Rencana Selesai', 'Aktual Mulai', 'Aktual Selesai', 'Selisih (hari)', 'Progres'],
      fmt: ['text', 'text', 'text', 'dec2', 'text', 'pct', 'text', 'text', 'text', 'text', 'int', 'pct'],
      rows: items
    },
    { t: 'h', text: 'Progres per job' },
    jobMatrix(p, D, asOf, masterJobs),
    { t: 'h', text: 'Ringkasan per produk' },
    { t: 'table', head: ['Produk', 'Item', 'Total Qty', 'Bobot', 'Progres'], fmt: ['text', 'int', 'dec2', 'pct', 'pct'], rows: prod },
    { t: 'h', text: 'Rekap bulanan' },
    { t: 'table', head: ['Bulan', 'Progres', 'Kumulatif', ...(inn ? ['Hari-orang', 'Man-hours', 'Biaya'] : [])], fmt: ['text', 'pct', 'pct', ...(inn ? ['int', 'dec1', 'rp'] : [])], rows: months }
  ];

  if (inn) {
    blocks.push(
      { t: 'h', text: 'Biaya vs budget' },
      { t: 'table', head: ['Kategori', 'Total'], fmt: ['text', 'rp'], rows: [...cr, ['Budget instalasi', num(p.reg?.budget)], ['Sisa budget', num(p.reg?.budget) - o.cost]], tot: [cr.length - 1] },
      { t: 'h', text: 'Rencana vs aktual manpower' },
      mpPlanVsActual(p, D, asOf, masterLevels),
      { t: 'h', text: 'Manpower yang terlibat' },
      { t: 'table', head: ['Nama', 'Source', 'Level', 'Pertama', 'Terakhir', 'Hari Kerja', 'Jam Kerja'], fmt: ['text', 'text', 'text', 'text', 'text', 'int', 'dec1'], rows: peopleRows(p, o), empty: 'Tidak ada kehadiran tercatat.' }
    );
  }

  blocks.push(
    { t: 'h', text: 'Catatan kendala selama project' },
    { t: 'table', head: ['Tanggal', 'Kendala'], fmt: ['text', 'text'], rows: o.issues.map((x) => [fmtDate(x.date), x.text]), empty: 'Tidak ada kendala tercatat.' },
    chartBlock(p, D, { title: 'Kurva S – Rencana vs Aktual (keseluruhan)' }),
    signBlock(p, [
      { role: 'Dibuat oleh (Leader)', name: p.reg?.leader },
      { role: 'Disetujui (Project Manager)', name: '' },
      { role: 'Diterima (Customer)', name: '' }
    ])
  );
  M.sheets.push({ name: 'Laporan Akhir', blocks });
  return M;
}

export function costCompareBlocks(p, D, upTo, masterLevels) {
  const cc = costCompare(p, D, upTo, masterLevels);
  const over = cc.sisaBudget < 0;
  const st = (r) =>
    r.plan <= 0 && r.act > 0
      ? 'Tidak direncanakan'
      : r.diff < 0
        ? 'Kelebihan ' + fmtRp(-r.diff)
        : r.act > 0
          ? 'Sisa ' + fmtRp(r.diff)
          : 'Belum terpakai';
  const rows = cc.rows.filter((r) => r.plan > 0 || r.act > 0).map((r) => [r.k, r.plan, r.act, r.diff, r.used, st(r)]);
  rows.push([
    'TOTAL',
    cc.plan,
    cc.act,
    cc.sisaPlan,
    cc.plan > 0 ? cc.act / cc.plan : null,
    cc.sisaPlan < 0 ? 'Kelebihan ' + fmtRp(-cc.sisaPlan) : 'Sisa ' + fmtRp(cc.sisaPlan)
  ]);
  const kp = [
    { l: 'Budget instalasi', v: fmtRp(cc.budget) },
    { l: 'Rencana biaya', v: fmtRp(cc.plan), s: cc.budget ? fmtPct(cc.plan / cc.budget) + ' dari budget' : '' },
    { l: 'Aktual s.d. ' + fmtDate(upTo), v: fmtRp(cc.act), s: cc.budget ? fmtPct(cc.act / cc.budget) + ' budget terpakai' : '', tone: over ? 'bad' : '' },
    { l: over ? 'Kelebihan budget' : 'Sisa budget', v: fmtRp(Math.abs(cc.sisaBudget)), tone: over ? 'bad' : 'ok', s: over ? 'aktual melebihi budget' : 'budget − aktual' },
    { l: cc.sisaPlan < 0 ? 'Melebihi rencana' : 'Sisa rencana biaya', v: fmtRp(Math.abs(cc.sisaPlan)), tone: cc.sisaPlan < 0 ? 'bad' : '' },
    { l: 'Progres aktual', v: fmtPct(cc.prog), s: cc.budget ? 'vs biaya terpakai ' + fmtPct(cc.act / cc.budget) : '' },
    { l: 'Proyeksi biaya akhir', v: cc.eac == null ? '-' : fmtRp(cc.eac), s: 'aktual ÷ progres', tone: cc.eac != null && cc.budget && cc.eac > cc.budget ? 'bad' : '' },
    { l: 'Proyeksi sisa / kelebihan', v: cc.eac == null || !cc.budget ? '-' : (cc.budget - cc.eac < 0 ? '−' : '') + fmtRp(Math.abs(cc.budget - cc.eac)), tone: cc.eac != null && cc.budget && cc.eac > cc.budget ? 'bad' : 'ok' }
  ];
  return [
    { t: 'kpi', items: kp },
    { t: 'h', text: 'Rencana vs aktual per kategori' },
    { t: 'table', head: ['Kategori', 'Rencana', 'Aktual', 'Selisih (Rencana − Aktual)', '% Terpakai', 'Status'], fmt: ['text', 'rp', 'rp', 'rp', 'pct', 'text'], rows, tot: [rows.length - 1] },
    { t: 'h', text: 'Posisi budget' },
    {
      t: 'table',
      head: ['Uraian', 'Nilai'],
      fmt: ['text', 'rp'],
      rows: [
        ['Budget instalasi', cc.budget],
        ['Rencana biaya', cc.plan],
        ['Cadangan budget (budget − rencana)', cc.reserve],
        ['Biaya aktual', cc.act],
        [over ? 'KELEBIHAN BUDGET (aktual − budget)' : 'SISA BUDGET (budget − aktual)', Math.abs(cc.sisaBudget)]
      ],
      tot: [4]
    }
  ];
}

export function costCompareModel(p, D, upTo, master = {}) {
  const masterLevels = master?.levels || [];
  upTo = upTo || asOfDate(p);
  const M = baseModel(p, 'Laporan Biaya Rencana vs Aktual', 'Laporan-Biaya', upTo, 'internal');
  const wk = [];
  const dd = Object.keys(D || {}).sort();
  if (dd.length) {
    let ws = weekStart(minD(dd[0], p.reg?.estStart));
    const pl = costCompare(p, D, upTo, masterLevels).plan;
    let cum = 0;
    while (ws <= upTo) {
      const we = minD(addDays(ws, 6), upTo);
      const a = costActualOf(p, D, we, masterLevels);
      const tot = Object.values(a).reduce((s, v) => s + v, 0);
      const pc = planAt(planLines(p), we) * pl;
      wk.push([`Minggu ke-${weekNo(p, ws)}`, fmtRange(ws, we), tot - cum, pc, tot, pc - tot]);
      cum = tot;
      ws = addDays(ws, 7);
    }
  }
  M.sheets.push({
    name: 'Biaya Rencana vs Aktual',
    blocks: [
      titleBlock(p, 'Posisi Data', fmtDate(upTo), 'internal'),
      ...costCompareBlocks(p, D, upTo, masterLevels),
      { t: 'h', text: 'Rekap mingguan' },
      { t: 'table', head: ['Minggu', 'Periode', 'Biaya Minggu Ini', 'Rencana Kumulatif', 'Aktual Kumulatif', 'Selisih'], fmt: ['text', 'text', 'rp', 'rp', 'rp', 'rp'], rows: wk, empty: 'Belum ada biaya.' },
      signBlock(p, [
        { role: 'Dibuat oleh (Leader)', name: p.reg?.leader },
        { role: 'Diperiksa (Project Manager)', name: '' },
        { role: 'Diketahui (General Manager)', name: '' }
      ])
    ]
  });
  return M;
}

export function registerModel(list) {
  const rows = list.map((p) => {
    const pl = (p.lines || []).length ? planAt(planLines(p), asOfDate(p)) : 0;
    return [
      p.no,
      p.reg?.customer,
      p.reg?.location,
      p.reg?.leader,
      p.reg?.sales,
      fmtDate(p.reg?.estStart),
      fmtDate(plannedFinish(p)),
      p.reg?.estDays,
      num(p.reg?.budget),
      STATUS[p.status] || p.status,
      pl,
      num((p.summary || {}).actual),
      num((p.summary || {}).cost)
    ];
  });
  return {
    title: 'Register Project Instalasi',
    subtitle: `${list.length} project · per ${fmtDate(todayStr())}`,
    orientation: 'landscape',
    file: 'Register-Project_' + todayStr(),
    sheets: [
      {
        name: 'Register Project',
        blocks: [
          {
            t: 'table',
            head: ['No Project', 'Customer', 'Lokasi', 'Leader', 'Sales', 'Estimasi Mulai', 'Estimasi Selesai', 'Hari', 'Budget', 'Status', 'Rencana', 'Aktual', 'Biaya'],
            fmt: ['text', 'text', 'text', 'text', 'text', 'text', 'text', 'int', 'rp', 'text', 'pct', 'pct', 'rp'],
            rows
          }
        ]
      }
    ]
  };
}

export function masterModel(m) {
  const tj = (m?.jobs || []).reduce((s, j) => s + num(j.bobot), 0);
  return {
    title: 'Master Data Installation Project',
    subtitle: `Daftar produk, detail pekerjaan default & level manpower · per ${fmtDate(todayStr())}`,
    orientation: 'portrait',
    file: 'Master-Data_' + todayStr(),
    sheets: [
      { name: 'Produk', raw: true, blocks: [{ t: 'table', head: ['No', 'Kode', 'Produk'], fmt: ['int', 'text', 'text'], rows: (m?.products || []).map((x, i) => [i + 1, x.code, x.name]) }] },
      { name: 'Detail Pekerjaan', raw: true, blocks: [{ t: 'table', head: ['No', 'Job', 'Bobot (%)'], fmt: ['int', 'text', 'dec2'], rows: [...(m?.jobs || []).map((j, i) => [i + 1, j.name, +(num(j.bobot) * 100).toFixed(2)]), ['TOTAL', '', +(tj * 100).toFixed(2)]], tot: [(m?.jobs || []).length] }] },
      { name: 'Level Manpower', raw: true, blocks: [{ t: 'table', head: ['Source', 'Manpower Level', 'Rate per 8 hours', 'Overtime / hour'], fmt: ['text', 'text', 'rp', 'rp'], rows: (m?.levels || []).map((v) => [v.source, v.level, num(v.rate), num(v.ot)]) }] },
      { name: 'Kode Biaya', raw: true, blocks: [{ t: 'table', head: ['Kategori', 'Kode'], rows: KATEGORI.map((k) => [k, (m?.codes || {})[k] || '']) }] }
    ]
  };
}

export function dataWorkbook(p, D, master = {}) {
  const masterJobs = master?.jobs || [];
  const dd = Object.keys(D || {}).sort();
  const nm = (id) => (mpById(p, id) || {}).name || '';
  const att = [], prog = [], cost = [], note = [], lvd = [];

  dd.forEach((k) => {
    const d = D[k];
    (d.teams || []).forEach((t) => {
      if (!(t.members || []).length && !(t.lines || []).length) return;
      att.push([k, teamLabel(p, t), t.members.map(nm).filter(Boolean).join('; '), (t.lines || []).map((id) => (lineById(p, id) || {}).code).filter(Boolean).join('; '), num(t.hours)]);
    });
    const hs = presentHSE(p, d);
    const ids = new Set([
      ...Object.keys(d.lv || {}).filter((m) => {
        const mp = mpById(p, m);
        return mp && d.lv[m] && d.lv[m] !== mp.level;
      }),
      ...hs
    ]);
    ids.forEach((m) => {
      const mp = mpById(p, m);
      if (mp) lvd.push([k, mp.name, levelOn(p, d, m), hs.includes(m) ? hseLabel(p, d, m) : '']);
    });
    (p.lines || []).forEach((l) => {
      const jt = jobsToday(D, l, k, masterJobs);
      jobNorm(l, masterJobs).forEach((j) => {
        const v = num(jt.today[j.id]);
        if (v > 0) prog.push([k, l.code, l.product, l.area, j.name, +(v * 100).toFixed(4)]);
      });
    });
    (d.costs || []).forEach((c) => cost.push([c.no || '', k, c.kategori, c.desc, num(c.qty), num(c.price), num(c.qty) * num(c.price)]));
    if (d.cuaca || d.catatan || d.kendala || d.besok || d.rev) note.push([k, d.cuaca, d.catatan, d.kendala, d.besok, num(d.rev)]);
  });

  const T = (head, rows, fmt) => ({ t: 'table', head, rows, fmt });
  const jobs = [];
  (p.lines || []).forEach((l) => (l.jobs || []).forEach((j) => jobs.push([l.code, j.name, +(num(j.bobot) * 100).toFixed(4)])));

  return {
    title: 'Data Project ' + p.no,
    file: `Data-Project_${slug(p.no)}`,
    sheets: [
      {
        name: 'Project',
        raw: true,
        blocks: [
          T(['Field', 'Nilai'], [
            ['No Project', p.no],
            ['Sales', p.reg?.sales],
            ['Customer Name', p.reg?.customer],
            ['Location', p.reg?.location],
            ['Leader Project', p.reg?.leader],
            ['Budget Installation', num(p.reg?.budget)],
            ['Estimasi Mulai', p.reg?.estStart],
            ['Estimasi Hari', p.reg?.estDays],
            ['Status', STATUS[p.status] || p.status],
            ['Catatan', p.reg?.note]
          ])
        ]
      },
      { name: 'Plan', raw: true, blocks: [T(['Kode', 'Product', 'Area', 'Qty', 'Satuan', 'Bobot (%)', 'Mulai', 'Lama (hari)', 'Selesai'], (p.lines || []).map((l) => [l.code, l.product, l.area, num(l.qty), l.satuan, +(num(l.bobot) * 100).toFixed(4), l.start, l.days, lineEnd(l)]), ['text', 'text', 'text', 'dec2', 'text', 'dec2', 'text', 'int', 'text'])] },
      { name: 'Detail Pekerjaan', raw: true, blocks: [T(['Kode', 'Job', 'Bobot (%)'], jobs, ['text', 'text', 'dec2'])] },
      { name: 'Rencana Biaya', raw: true, blocks: [T(['Kategori', 'Rencana (Rp)'], ['Lembur', ...KATEGORI].map((k) => [k, num((p.costPlan || {})[k])]), ['text', 'rp'])] },
      { name: 'Rencana Manpower', raw: true, blocks: [T(['Source', 'Level', 'Jumlah', 'Hari'], (p.mpPlan || []).map((r) => [r.source, r.level, num(r.qty), num(r.days)]), ['text', 'text', 'int', 'int'])] },
      { name: 'Manpower', raw: true, blocks: [T(['Nama', 'Source', 'Level'], (p.manpower || []).map((m) => [m.name, m.source, m.level]))] },
      { name: 'Team', raw: true, blocks: [T(['Team', 'Anggota'], (p.teams || []).map((t) => [t.name, (t.members || []).map(nm).filter(Boolean).join('; ')]))] },
      { name: 'Kehadiran', raw: true, blocks: [T(['Tanggal', 'Team', 'Anggota', 'Kode Item', 'Jam Kerja'], att, ['text', 'text', 'text', 'text', 'dec1'])] },
      { name: 'Level Harian', raw: true, blocks: [T(['Tanggal', 'Nama', 'Level', 'Tanggung Jawab HSE'], lvd)] },
      { name: 'Progress', raw: true, blocks: [T(['Tanggal', 'Kode', 'Product', 'Area', 'Job', 'Progres Hari Ini (%)'], prog, ['text', 'text', 'text', 'text', 'text', 'dec2'])] },
      { name: 'Biaya', raw: true, blocks: [T(['No', 'Tanggal', 'Kategori', 'Deskripsi', 'Qty', 'Harga Satuan', 'Total'], cost, ['text', 'text', 'text', 'text', 'dec2', 'rp', 'rp'])] },
      { name: 'Catatan', raw: true, blocks: [T(['Tanggal', 'Cuaca', 'Catatan', 'Kendala', 'Rencana Besok', 'Revisi'], note, ['text', 'text', 'text', 'text', 'text', 'int'])] }
    ]
  };
}

/* ================= Export to XLSX & PDF ================= */
export function exportModelToXlsx(model) {
  const wb = XLSX.utils.book_new();
  (model.sheets || []).forEach((sh) => {
    const aoa = [];
    if (!sh.raw) {
      aoa.push([model.title]);
      if (model.subtitle) aoa.push([model.subtitle]);
      aoa.push([]);
    }
    (sh.blocks || []).forEach((b) => {
      if (b.t === 'h') aoa.push([b.text]);
      else if (b.t === 'p') aoa.push([b.text]);
      else if (b.t === 'kv') {
        (b.rows || []).forEach(([k, v]) => aoa.push([k, cellText(v, b.fmt)]));
        aoa.push([]);
      } else if (b.t === 'kpi') {
        aoa.push((b.items || []).map((it) => it.l));
        aoa.push((b.items || []).map((it) => it.v));
        aoa.push([]);
      } else if (b.t === 'table') {
        aoa.push(b.head);
        const F = b.fmt || [];
        (b.rows || []).forEach((row) => {
          aoa.push(
            row.map((v, i) => {
              const f = F[i];
              if (typeof v === 'number' && isNumFmt(f)) {
                return f === 'pct' ? +(v * 100).toFixed(2) : v;
              }
              return v == null ? '' : v;
            })
          );
        });
        aoa.push([]);
      } else if (b.t === 'chart') {
        if (b.title) aoa.push([b.title]);
        aoa.push(['Tanggal', ...(b.series || []).map((s) => s.name)]);
        (b.dates || []).forEach((d, idx) => {
          aoa.push([fmtDate(d), ...(b.series || []).map((s) => (s.points[idx] == null ? '' : +(s.points[idx] * 100).toFixed(2)))]);
        });
        aoa.push([]);
      }
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const name = String(sh.name || 'Sheet').replace(/[[\]:*?/\\]/g, '-').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, `${model.file || 'export'}.xlsx`);
}

export function exportModelToPdf(model) {
  const doc = new jsPDF({ orientation: model.orientation === 'landscape' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  let y = 14;
  doc.setFontSize(14);
  doc.setTextColor(22, 74, 110);
  doc.text(String(model.title || 'Laporan'), 14, y);
  y += 6;
  if (model.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 110);
    doc.text(String(model.subtitle), 14, y);
    y += 6;
  }

  (model.sheets || []).forEach((sh) => {
    (sh.blocks || []).forEach((b) => {
      if (y > doc.internal.pageSize.getHeight() - 25) {
        doc.addPage();
        y = 14;
      }
      if (b.t === 'h') {
        doc.setFontSize(11);
        doc.setTextColor(22, 74, 110);
        doc.text(String(b.text), 14, y);
        y += 5;
      } else if (b.t === 'p') {
        doc.setFontSize(8.5);
        doc.setTextColor(60, 70, 80);
        const lines = doc.splitTextToSize(String(b.text), doc.internal.pageSize.getWidth() - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4 + 2;
      } else if (b.t === 'kv') {
        autoTable(doc, {
          startY: y,
          body: (b.rows || []).map(([k, v]) => [k, cellText(v, b.fmt)]),
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 1.5 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
          margin: { left: 14, right: 14 }
        });
        y = doc.lastAutoTable.finalY + 5;
      } else if (b.t === 'kpi') {
        autoTable(doc, {
          startY: y,
          head: [(b.items || []).map((i) => i.l)],
          body: [(b.items || []).map((i) => i.v)],
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [22, 74, 110] },
          margin: { left: 14, right: 14 }
        });
        y = doc.lastAutoTable.finalY + 5;
      } else if (b.t === 'table') {
        const F = b.fmt || [];
        autoTable(doc, {
          startY: y,
          head: [b.head],
          body: (b.rows || []).length ? b.rows.map((r) => r.map((v, i) => cellText(v, F[i]))) : [[b.empty || 'Tidak ada data.']],
          theme: 'striped',
          styles: { fontSize: 7.5, cellPadding: 1.5 },
          headStyles: { fillColor: [22, 74, 110] },
          margin: { left: 14, right: 14 }
        });
        y = doc.lastAutoTable.finalY + 6;
      }
    });
  });

  doc.save(`${model.file || 'laporan'}.pdf`);
}

/* ================= Import Parser ================= */
const normH = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
function parseDateCell(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (isDate(s.slice(0, 10))) return s.slice(0, 10);
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}
function findSheet(sheets, names) {
  return sheets.find((s) => names.some((n) => normH(s.name) === normH(n)));
}
function tableOf(sheet, want) {
  if (!sheet) return null;
  const rows = sheet.rows || [];
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const hr = (rows[r] || []).map(normH);
    const idx = {};
    let hit = 0;
    for (const k in want) {
      const i = hr.findIndex((h) => want[k].some((a) => h === a || h.startsWith(a)));
      idx[k] = i;
      if (i >= 0) hit++;
    }
    if (hit >= Math.min(2, Object.keys(want).length)) {
      return rows
        .slice(r + 1)
        .filter((rw) => rw && rw.some((v) => v !== '' && v != null))
        .map((rw) => {
          const o = {};
          for (const k in idx) o[k] = idx[k] >= 0 ? rw[idx[k]] : '';
          return o;
        });
    }
  }
  return null;
}
const pctCol = (vals) => (vals.map(num).some((v) => v > 1) ? 100 : 1);
const splitNames = (s) => String(s || '').split(/[;,]/).map((x) => x.trim()).filter(Boolean);

export async function readXlsxFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })
  }));
}

export function parseDataWorkbook(sheets, p) {
  const res = { warn: [], sec: {} };
  const pl = tableOf(findSheet(sheets, ['Plan']), { code: ['kode', 'code'], product: ['product', 'produk'], area: ['area'], qty: ['qty', 'jumlah'], satuan: ['satuan', 'unit'], bobot: ['bobot', 'weight'], start: ['mulai', 'start'], days: ['lama', 'durasi', 'hari'] });
  if (pl) {
    const sumB = pl.reduce((s, r) => s + num(r.bobot), 0);
    const dv = sumB > 1.5 ? 100 : pctCol(pl.map((r) => r.bobot));
    const lines = [];
    pl.forEach((r) => {
      if (!r.product && !r.area) return;
      lines.push({
        code: String(r.code || '').trim(),
        product: String(r.product || '').trim(),
        area: String(r.area || '').trim(),
        qty: num(r.qty),
        satuan: String(r.satuan || 'unit'),
        bobot: num(r.bobot) / dv,
        start: parseDateCell(r.start) || p.reg?.estStart || todayStr(),
        days: Math.max(1, Math.round(num(r.days) || 1))
      });
    });
    const t = sumBobot(lines);
    if (lines.length && !bobotOk(t)) res.warn.push(`Total bobot plan di file ${fmtPct(t)} (seharusnya 100%).`);
    res.sec.plan = { label: 'Plan (produk, area, qty, bobot, jadwal)', count: lines.length, data: lines };
  }

  const mp = tableOf(findSheet(sheets, ['Manpower']), { name: ['nama', 'name'], source: ['source', 'sumber'], level: ['level', 'posisi'] });
  if (mp) {
    const list = mp.filter((r) => String(r.name || '').trim()).map((r) => ({
      name: String(r.name).trim(),
      source: /^ext/i.test(String(r.source)) ? 'External' : 'Internal',
      level: String(r.level || 'Helper').trim()
    }));
    res.sec.mp = { label: 'Manpower', count: list.length, data: list };
  }

  const days = {};
  const day = (d) => days[d] || (days[d] = {});
  const pr = tableOf(findSheet(sheets, ['Progress', 'Progres']), { date: ['tanggal', 'date'], code: ['kode', 'code'], job: ['job', 'pekerjaan'], pct: ['progreshariini', 'progres', 'progress', 'persen'] });
  if (pr) {
    const dv = pctCol(pr.map((r) => r.pct));
    let n = 0;
    pr.forEach((r) => {
      const d = parseDateCell(r.date);
      if (!d) return;
      (day(d).prog = day(d).prog || []).push({ code: String(r.code || '').trim(), job: String(r.job || '').trim(), pct: r.pct === '' ? null : num(r.pct) / dv });
      n++;
    });
    res.sec.prog = { label: 'Progres harian (per job)', count: n };
  }

  const co = tableOf(findSheet(sheets, ['Biaya', 'Cost']), { no: ['no'], date: ['tanggal', 'date'], kat: ['kategori', 'category'], desc: ['deskripsi', 'keterangan'], qty: ['qty', 'jumlah'], price: ['hargasatuan', 'harga', 'price'], total: ['total'] });
  if (co) {
    let n = 0;
    co.forEach((r) => {
      const d = parseDateCell(r.date);
      if (!d) return;
      const q = r.qty === '' ? 1 : num(r.qty);
      let pr_ = num(r.price);
      if (!pr_ && num(r.total)) pr_ = num(r.total) / (q || 1);
      (day(d).costs = day(d).costs || []).push({ no: String(r.no || '').trim(), kategori: KATEGORI.find((k) => normH(k) === normH(r.kat)) || 'Lain-lain', desc: String(r.desc || ''), qty: q, price: pr_ });
      n++;
    });
    res.sec.cost = { label: 'Biaya', count: n };
  }

  const nt = tableOf(findSheet(sheets, ['Catatan']), { date: ['tanggal'], cuaca: ['cuaca'], catatan: ['catatan'], kendala: ['kendala'], besok: ['rencana', 'besok'] });
  if (nt) {
    let n = 0;
    nt.forEach((r) => {
      const d = parseDateCell(r.date);
      if (!d) return;
      day(d).note = { cuaca: String(r.cuaca || ''), catatan: String(r.catatan || ''), kendala: String(r.kendala || ''), besok: String(r.besok || '') };
      n++;
    });
    res.sec.note = { label: 'Catatan harian', count: n };
  }

  res.days = days;
  if (!Object.keys(res.sec).length) res.warn.push('Tidak ditemukan sheet yang dikenali. Gunakan file hasil "Ekspor data project" sebagai template.');
  return res;
}

export function applyImport(p, D, res, on, master = {}) {
  const nextP = clone(p);
  const nextD = clone(D);
  const updatedDays = new Set();

  if (on.plan && res.sec.plan) {
    const old = {};
    (nextP.lines || []).forEach((l) => { old[l.code] = l; });
    nextP.lines = res.sec.plan.data.map((r, i) => {
      const code = r.code || 'L' + String(i + 1).padStart(2, '0');
      const ex = old[code];
      return { id: ex ? ex.id : rid('l'), jobs: ex ? ex.jobs : clone(master.jobs || []), ...r, code };
    });
  }
  if (on.mp && res.sec.mp) {
    const old = {};
    (nextP.manpower || []).forEach((m) => { old[m.name.toLowerCase()] = m; });
    nextP.manpower = res.sec.mp.data.map((r) => ({ id: (old[r.name.toLowerCase()] || {}).id || rid('m'), ...r }));
  }

  const lineByCode = (c) => (nextP.lines || []).find((l) => l.code === c);
  Object.keys(res.days || {}).sort().forEach((date) => {
    const src = res.days[date];
    const d = nextD[date] || { date, teams: [], prog: {}, jp: {}, lv: {}, hse: {}, costs: [], cuaca: '', catatan: '', kendala: '', besok: '', rev: 0, revs: [] };
    let touched = false;
    if (on.prog && src.prog) {
      d.prog = {};
      d.jp = {};
      src.prog.forEach((r) => {
        const l = lineByCode(r.code);
        if (!l) return;
        if (r.job) {
          const j = jobNorm(l, master.jobs).find((x) => x.name.toLowerCase() === r.job.toLowerCase());
          if (j) (d.jp[l.id] = d.jp[l.id] || {})[j.id] = num(d.jp[l.id][j.id]) + num(r.pct);
        } else if (r.pct > 0) {
          d.prog[l.id] = (d.prog[l.id] || 0) + r.pct;
        }
      });
      Object.keys(d.jp).forEach((lid) => {
        d.prog[lid] = progFromJobs(lineById(nextP, lid), d.jp[lid], master.jobs);
      });
      touched = true;
    }
    if (on.cost && src.costs) {
      d.costs = src.costs.map((c) => ({
        id: rid('c'),
        ...c,
        no: c.no || nextCostNo(nextP, nextD, c.kategori, null, master.codes)
      }));
      touched = true;
    }
    if (on.note && src.note) {
      Object.assign(d, src.note);
      touched = true;
    }
    if (touched) {
      nextD[date] = d;
      updatedDays.add(date);
    }
  });

  return { nextP, nextD, updatedDays: [...updatedDays] };
}
