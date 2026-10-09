import React from 'react';
import { PRODUCT_LIST } from './StepData';
import { exportToPDF } from '../utils/pdfExport';

const formatDate = (value) => {
  if (!value) return '-';
  return value;
};

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const countPhotos = (products) => products.reduce((total, product) => {
  const formData = product.formData || {};
  return total + Object.values(formData).reduce((sum, value) => {
    if (Array.isArray(value) && value.some(item => item?.data || item?.url || item instanceof File)) {
      return sum + value.length;
    }
    return sum;
  }, 0);
}, 0);

const getProduct = (code) => PRODUCT_LIST.find(product => product.code === code) || { code, name: code };

const productCodesFromText = (text = '') => PRODUCT_LIST
  .filter(product => new RegExp(`\\b${product.code}\\b`, 'i').test(text))
  .map(product => product.code);

export default function StepSummary({ stepData = {}, lapanganData = {} }) {
  const plannedCodes = stepData.selectedProducts || [];
  const plannedSchedules = stepData.schedules || [];
  const actualSchedules = lapanganData.actualSchedules || [];
  const actualProducts = lapanganData.productProgress || [];
  const actualCodes = [...new Set(actualProducts.map(product => product.code).filter(Boolean))];
  const summaryCodes = PRODUCT_LIST
    .map(product => product.code)
    .filter(code => plannedCodes.includes(code) || actualCodes.includes(code));

  const averageCompleteness = actualProducts.length
    ? Math.round(actualProducts.reduce((sum, product) => sum + Number(product.percent || 0), 0) / actualProducts.length)
    : 0;
  const incompleteItems = actualProducts.filter(product => Number(product.percent || 0) < 100).length;
  const photoCount = countPhotos(actualProducts);
  const maxScheduleRows = Math.max(plannedSchedules.length, actualSchedules.length, 1);

  const metricCards = [
    { label: 'Customer', value: stepData.nama_client || '-' },
    { label: 'Tanggal rencana', value: formatDate(stepData.tanggal_mulai) },
    { label: 'Produk / Item aktual', value: `${actualCodes.length} jenis / ${actualProducts.length} item` },
    { label: 'Foto', value: String(photoCount) },
    { label: 'Rata-rata kelengkapan', value: `${averageCompleteness}%` },
    { label: 'Item belum 100%', value: String(incompleteItems) }
  ];

  return (
    <div className="space-y-4 text-slate-950">
      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-950">Summary Survey</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToPDF(stepData, lapanganData)}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Export Laporan PDF
            </button>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              CLOSED
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-x-16 gap-y-4 sm:grid-cols-2">
          {metricCards.map((metric) => (
            <div key={metric.label}>
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <p className="text-base font-bold text-slate-950 break-words">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Perbandingan Rencana vs Aktual</h3>
        <p className="mt-2 text-sm text-slate-500">Scope rencana dibandingkan dengan produk yang benar-benar disurvey.</p>

        {summaryCodes.length ? (
          <div className="mt-6 divide-y divide-sky-200">
            {summaryCodes.map((code) => {
              const product = getProduct(code);
              const actualCount = actualProducts.filter(item => item.code === code).length;
              const isPlanned = plannedCodes.includes(code);
              return (
                <div key={code} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-base text-slate-950">
                      <span className="font-bold">{code}</span>
                      <span className="text-slate-400"> - </span>
                      {product.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-950">{isPlanned ? 'Direncanakan' : 'Tidak direncanakan'}</p>
                    <p className="text-xs text-slate-500">Aktual: {actualCount} item</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-sky-200 bg-white/40 p-6 text-center text-slate-500">
            Belum ada produk rencana atau aktual.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Perbandingan Jadwal Rencana vs Aktual</h3>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-sky-200 text-xs text-slate-500">
              <tr>
                <th className="px-2 py-3 font-bold">Hari</th>
                <th className="px-2 py-3 font-bold">Rencana</th>
                <th className="px-2 py-3 font-bold">Aktual</th>
                <th className="px-2 py-3 font-bold">Target</th>
                <th className="px-2 py-3 font-bold">Aktual</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxScheduleRows }).map((_, index) => {
                const planned = plannedSchedules[index] || {};
                const actual = actualSchedules[index] || {};
                const plannedText = planned.rencana_area || '-';
                const actualText = actual.kegiatan || '-';
                const detectedCodes = [
                  ...productCodesFromText(plannedText),
                  ...productCodesFromText(actualText)
                ];
                const actualItemCount = actualProducts.filter(product => {
                  const sameDay = String(product.hari_ke || '') === String(actual.hari_ke || planned.hari || index + 1);
                  return sameDay || detectedCodes.includes(product.code);
                }).length;

                return (
                  <tr key={`${planned.id || 'r'}-${actual.id || 'a'}-${index}`} className="border-b border-sky-200 last:border-0">
                    <td className="px-2 py-4 align-top font-bold text-slate-950">{planned.hari || actual.hari_ke || index + 1}</td>
                    <td className="px-2 py-4 align-top">
                      <p className="font-bold text-slate-950">{formatDate(planned.tanggal)}</p>
                      <p className="mt-1 text-slate-500">{plannedText}</p>
                    </td>
                    <td className="px-2 py-4 align-top">
                      <p className="font-bold text-slate-950">{formatDate(actual.tanggal)}</p>
                      <p className="mt-1 text-slate-500">{actualText}</p>
                    </td>
                    <td className="px-2 py-4 align-top text-slate-950">{hasValue(planned.target_item) ? planned.target_item : '-'}</td>
                    <td className="px-2 py-4 align-top text-slate-950">{actualItemCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-950">Catatan Kegiatan Umum</h3>
        <div className="flex min-h-24 items-center justify-center">
          <p className="text-sm text-slate-500">Belum ada catatan umum.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-950">Outstanding Umum</h3>
        <div className="flex min-h-24 items-center justify-center">
          <p className="text-sm text-slate-500">Tidak ada outstanding umum.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-950">Ringkasan & Rekomendasi</h3>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-sky-200 bg-white/30 px-3 py-3 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder="Ringkasan hasil survey, kondisi umum, rekomendasi awal, dan catatan untuk laporan."
        />
      </section>
    </div>
  );
}
