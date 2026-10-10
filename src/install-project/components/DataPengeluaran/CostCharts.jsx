import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { CATEGORY_COLORS, formatRp, KATEGORI } from './costSummary';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const SERIES = ['Manpower', 'Hotel', 'Akomodasi', 'Transportasi', 'Consumable'];

const shortRp = (v) => {
  const f = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (v >= 1e9) return `Rp ${f(v / 1e9)} M`;
  if (v >= 1e6) return `Rp ${f(v / 1e6)} jt`;
  if (v >= 1e3) return `Rp ${f(v / 1e3)} rb`;
  return `Rp ${v}`;
};

const CARD = 'bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(16,24,40,0.06)] p-5';

export function TrendChart({ months, year }) {
  const data = {
    labels: BULAN,
    datasets: SERIES.map((k) => ({
      label: k,
      data: months.map((m) => m[k]),
      backgroundColor: CATEGORY_COLORS[k],
      stack: 'cost',
      borderRadius: 4,
      borderSkipped: false,
      maxBarThickness: 26,
    })),
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 6, boxHeight: 6, padding: 14, color: '#64748b', font: { size: 11 } } },
      tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8, callbacks: { label: (c) => ` ${c.dataset.label}: ${formatRp(c.raw)}` } },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { stacked: true, beginAtZero: true, border: { display: false }, ticks: { maxTicksLimit: 6, callback: shortRp, color: '#94a3b8', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
    },
  };
  return (
    <div className={`${CARD} lg:col-span-2`}>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-semibold text-gray-800">Trend Pengeluaran Proyek</h3>
        <span className="text-xs text-gray-400">Tahun {year}</span>
      </div>
      <div className="h-[330px]"><Bar data={data} options={options} /></div>
    </div>
  );
}

export function KomposisiChart({ summary }) {
  const values = { Manpower: summary.manpower, ...Object.fromEntries(KATEGORI.map((k) => [k, summary.byKat[k]])) };
  const total = summary.total;
  const data = {
    labels: SERIES,
    datasets: [{
      data: SERIES.map((k) => values[k]),
      backgroundColor: SERIES.map((k) => CATEGORY_COLORS[k]),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };
  const options = {
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8, callbacks: { label: (c) => ` ${c.label}: ${formatRp(c.raw)}` } } },
  };
  return (
    <div className={CARD}>
      <h3 className="font-semibold text-gray-800 mb-4">Komposisi Biaya</h3>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-40 h-40 shrink-0">
          {total > 0 ? <Doughnut data={data} options={options} /> : <div className="w-full h-full rounded-full border-[14px] border-gray-100" />}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-bold text-gray-900">{formatRp(total)}</span>
            <span className="text-xs text-gray-500">Total Cost</span>
          </div>
        </div>
        <div className="w-full space-y-2 text-sm">
          {SERIES.map((k) => (
            <div key={k} className={`flex items-center gap-2 ${values[k] ? '' : 'opacity-50'}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[k] }} />
              <span className="flex-1 text-gray-600">{k}</span>
              <span className="w-12 text-right text-xs text-gray-400">{(total > 0 ? (values[k] / total) * 100 : 0).toFixed(1).replace('.', ',')}%</span>
              <span className="w-28 text-right font-semibold text-gray-800">{formatRp(values[k])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
