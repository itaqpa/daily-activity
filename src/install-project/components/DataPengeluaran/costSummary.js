// Helper agregasi data aktual dari /api/report/all-costs untuk dashboard KPI
export const KATEGORI = ['Hotel', 'Akomodasi', 'Transportasi', 'Consumable'];

export const CATEGORY_COLORS = {
  Manpower: '#3b82f6',
  Hotel: '#22c55e',
  Akomodasi: '#f59e0b',
  Transportasi: '#a855f7',
  Consumable: '#ef4444',
};

export const formatRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const currentMonthRange = () => {
  const now = new Date();
  return {
    start: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const dayTotal = (d) => d.manpower + KATEGORI.reduce((s, k) => s + (d[k] || 0), 0);

const inRange = (t, start, end) => (!start || t >= start) && (!end || t <= end);

export function summarize(projects, start, end) {
  const s = { total: 0, manpower: 0, manHours: 0, orgHari: 0, budget: 0, byKat: {}, dailyTotals: {}, dailyMP: {}, dailyMH: {} };
  KATEGORI.forEach((k) => (s.byKat[k] = 0));

  projects.forEach((p) => {
    s.budget += Number(p.budget_biaya) || 0;
    (p.daily || []).forEach((d) => {
      if (!inRange(d.tanggal, start, end)) return;
      const tot = dayTotal(d);
      s.total += tot;
      s.manpower += d.manpower;
      s.manHours += d.manHours;
      s.orgHari += d.orgHari;
      KATEGORI.forEach((k) => (s.byKat[k] += d[k] || 0));
      s.dailyTotals[d.tanggal] = (s.dailyTotals[d.tanggal] || 0) + tot;
      s.dailyMP[d.tanggal] = (s.dailyMP[d.tanggal] || 0) + d.manpower;
      s.dailyMH[d.tanggal] = (s.dailyMH[d.tanggal] || 0) + d.manHours;
    });
  });
  s.nonManpower = KATEGORI.reduce((a, k) => a + s.byKat[k], 0);
  return s;
}

// Periode sebelumnya dengan panjang hari yang sama
export function previousRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const len = Math.round((e - s) / 86400000) + 1;
  const pe = new Date(s);
  pe.setDate(pe.getDate() - 1);
  const ps = new Date(pe);
  ps.setDate(ps.getDate() - (len - 1));
  return { start: toISO(ps), end: toISO(pe) };
}

export function monthlyTrend(projects, year) {
  const months = Array.from({ length: 12 }, () => ({ Manpower: 0, Hotel: 0, Akomodasi: 0, Transportasi: 0, Consumable: 0 }));
  projects.forEach((p) =>
    (p.daily || []).forEach((d) => {
      if (Number(d.tanggal.slice(0, 4)) !== year) return;
      const m = months[Number(d.tanggal.slice(5, 7)) - 1];
      m.Manpower += d.manpower;
      KATEGORI.forEach((k) => (m[k] += d[k] || 0));
    })
  );
  return months;
}

export const sortedValues = (obj) => Object.keys(obj).sort().map((k) => obj[k]);
