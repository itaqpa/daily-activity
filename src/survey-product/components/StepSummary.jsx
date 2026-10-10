import React, { useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { PRODUCT_LIST } from './StepData';
import { exportToPDF, generatePreviewHTML } from '../utils/pdfExport';

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

export default function StepSummary({ stepData = {}, lapanganData = {}, onChange, readOnly = false }) {
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);

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

  const catatanUmum = stepData.catatanUmum || [];
  const outstandingUmum = stepData.outstandingUmum || [];

  const handleAddCatatan = () => {
    if (readOnly) return;
    onChange && onChange(prev => ({
      ...prev,
      catatanUmum: [...(prev.catatanUmum || []), '']
    }));
  };

  const handleUpdateCatatan = (index, value) => {
    if (readOnly) return;
    onChange && onChange(prev => {
      const newCatatan = [...(prev.catatanUmum || [])];
      newCatatan[index] = value;
      return { ...prev, catatanUmum: newCatatan };
    });
  };

  const handleRemoveCatatan = (index) => {
    if (readOnly) return;
    onChange && onChange(prev => {
      const newCatatan = [...(prev.catatanUmum || [])];
      newCatatan.splice(index, 1);
      return { ...prev, catatanUmum: newCatatan };
    });
  };

  const handleAddOutstanding = () => {
    if (readOnly) return;
    onChange && onChange(prev => ({
      ...prev,
      outstandingUmum: [...(prev.outstandingUmum || []), '']
    }));
  };

  const handleUpdateOutstanding = (index, value) => {
    if (readOnly) return;
    onChange && onChange(prev => {
      const newOut = [...(prev.outstandingUmum || [])];
      newOut[index] = value;
      return { ...prev, outstandingUmum: newOut };
    });
  };

  const handleRemoveOutstanding = (index) => {
    if (readOnly) return;
    onChange && onChange(prev => {
      const newOut = [...(prev.outstandingUmum || [])];
      newOut.splice(index, 1);
      return { ...prev, outstandingUmum: newOut };
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 text-slate-950">
      {readOnly && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">Read-Only</span>
            <span className="font-semibold text-emerald-900">Survey sudah selesai.</span>
            <span className="text-emerald-700">Summary dan rekomendasi hanya dapat dilihat.</span>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Summary Survey</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Hitung skala agar A4 pas dengan LEBAR layar, sisanya bisa di-scroll ke bawah
                const screenWidth = window.innerWidth;
                const scaleW = (screenWidth - 32) / 794; // 32 = padding container
                const initialScale = Math.max(0.1, Math.min(scaleW, 1));
                
                setPreviewScale(initialScale);
                setPreviewHtml(generatePreviewHTML(stepData, lapanganData, null, initialScale));
              }}
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 md:py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Preview Laporan Akhir
            </button>
            <span className={`inline-flex justify-center items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide border ${
              (stepData.status || 'OPEN').toUpperCase() === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              (stepData.status || 'OPEN').toUpperCase() === 'ON PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}>
              {stepData.status || 'OPEN'}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {metricCards.map((metric) => (
            <div key={metric.label} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">{metric.label}</p>
              <p className="text-sm md:text-base font-bold text-slate-900 break-words">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold text-slate-900">Perbandingan Rencana vs Aktual</h3>
        <p className="mt-1 md:mt-2 text-sm text-slate-500">Scope rencana dibandingkan dengan produk yang benar-benar disurvey.</p>

        {summaryCodes.length ? (
          <div className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {summaryCodes.map((code) => {
              const product = getProduct(code);
              const actualCount = actualProducts.filter(item => item.code === code).length;
              const isPlanned = plannedCodes.includes(code);
              return (
                <div key={code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm md:text-base text-slate-900">
                      <span className="font-bold">{code}</span>
                      <span className="text-slate-400 mx-1">-</span>
                      {product.name}
                    </p>
                  </div>
                  <div className="sm:text-right flex sm:block items-center justify-between bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                    <p className={`text-sm font-bold ${isPlanned ? 'text-blue-600' : 'text-orange-600'}`}>{isPlanned ? 'Direncanakan' : 'Tidak direncanakan'}</p>
                    <p className="text-xs text-slate-500 sm:mt-1">Aktual: <span className="font-bold text-slate-700">{actualCount} item</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-slate-500">
            Belum ada produk rencana atau aktual.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold text-slate-900">Perbandingan Jadwal</h3>
        
        {/* Mobile View: Cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:hidden">
          {Array.from({ length: maxScheduleRows }).map((_, index) => {
            const planned = plannedSchedules[index] || {};
            const actual = actualSchedules[index] || {};
            const plannedText = planned.rencana_area || '-';
            let actualText = actual.kegiatan;
            
            const detectedCodes = [
              ...productCodesFromText(plannedText),
              ...productCodesFromText(actualText || '')
            ];
            
            const productsOfThisDay = actualProducts.filter(product => {
              const sameDay = String(product.hari_ke || '') === String(actual.hari_ke || planned.hari || index + 1);
              return sameDay || detectedCodes.includes(product.code);
            });
            
            if (!actualText && productsOfThisDay.length > 0) {
              const surveyedCodes = [...new Set(productsOfThisDay.map(p => p.code))];
              actualText = `Survey produk: ${surveyedCodes.join(', ')}`;
            }
            actualText = actualText || '-';

            return (
              <div key={`mob-${planned.id || 'r'}-${actual.id || 'a'}-${index}`} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="border-b border-gray-200 pb-2 mb-3">
                  <span className="font-bold text-slate-900">Hari ke-{planned.hari || actual.hari_ke || index + 1}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {/* Header Row */}
                  <div className="font-bold text-slate-900 border-b border-gray-200 pb-1">Rencana</div>
                  <div className="font-bold text-slate-900 border-b border-gray-200 pb-1">Aktual</div>
                  
                  {/* Tanggal Row */}
                  <div className="text-xs font-semibold text-slate-500 bg-white p-2 rounded-lg border border-gray-100">
                    {formatDate(planned.tanggal)}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 bg-white p-2 rounded-lg border border-gray-100">
                    {formatDate(actual.tanggal || (actual.id ? (planned.tanggal || new Date().toISOString().split('T')[0]) : ''))}
                  </div>
                  
                  {/* Kegiatan Row */}
                  <div className="text-slate-700 whitespace-pre-wrap">{plannedText}</div>
                  <div className="text-slate-700 whitespace-pre-wrap">{actualText}</div>
                  
                  {/* Target vs Aktual Item Row */}
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-slate-500 block mb-1">Target Item</span>
                    <span className="font-bold text-slate-800">{hasValue(planned.target_item) ? planned.target_item : '-'}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-slate-500 block mb-1">Aktual Item</span>
                    <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100 text-xs font-bold">
                      {productsOfThisDay.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="mt-5 hidden md:block overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold border-b border-gray-200 rounded-tl-lg">Hari</th>
                  <th className="px-4 py-3 font-bold border-b border-gray-200">Rencana</th>
                  <th className="px-4 py-3 font-bold border-b border-gray-200">Aktual</th>
                  <th className="px-4 py-3 font-bold border-b border-gray-200">Target</th>
                  <th className="px-4 py-3 font-bold border-b border-gray-200 rounded-tr-lg">Total Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: maxScheduleRows }).map((_, index) => {
                  const planned = plannedSchedules[index] || {};
                  const actual = actualSchedules[index] || {};
                  const plannedText = planned.rencana_area || '-';
                  let actualText = actual.kegiatan;
                  
                  const detectedCodes = [
                    ...productCodesFromText(plannedText),
                    ...productCodesFromText(actualText || '')
                  ];
                  
                  const productsOfThisDay = actualProducts.filter(product => {
                    const sameDay = String(product.hari_ke || '') === String(actual.hari_ke || planned.hari || index + 1);
                    return sameDay || detectedCodes.includes(product.code);
                  });
                  
                  if (!actualText && productsOfThisDay.length > 0) {
                    const surveyedCodes = [...new Set(productsOfThisDay.map(p => p.code))];
                    actualText = `Survey produk: ${surveyedCodes.join(', ')}`;
                  }
                  actualText = actualText || '-';

                  return (
                    <tr key={`desk-${planned.id || 'r'}-${actual.id || 'a'}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 align-top font-bold text-slate-900 w-16">{planned.hari || actual.hari_ke || index + 1}</td>
                      <td className="px-4 py-4 align-top min-w-[200px]">
                        <p className="font-semibold text-slate-900 mb-1">{formatDate(planned.tanggal)}</p>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">{plannedText}</p>
                      </td>
                      <td className="px-4 py-4 align-top min-w-[200px]">
                        <p className="font-semibold text-slate-900 mb-1">{formatDate(actual.tanggal || (actual.id ? (planned.tanggal || new Date().toISOString().split('T')[0]) : ''))}</p>
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">{actualText}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-slate-700 font-medium">{hasValue(planned.target_item) ? planned.target_item : '-'}</td>
                      <td className="px-4 py-4 align-top text-slate-900 font-bold">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                          {productsOfThisDay.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold text-slate-900">Catatan Kegiatan Umum</h3>
          {!readOnly && (
            <button
              onClick={handleAddCatatan}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
            >
              <span className="text-lg leading-none">+</span> <span className="hidden sm:inline">Tambah</span>
            </button>
          )}
        </div>
        
        {catatanUmum.length === 0 ? (
          <div className="flex min-h-[100px] items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-sm text-slate-500">Belum ada catatan umum.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catatanUmum.map((catatan, index) => (
              <div key={index} className="flex gap-2 items-start relative group">
                <textarea
                  className={`flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 min-h-[80px] transition-all resize-y ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  placeholder={`Catatan #${index + 1}...`}
                  value={catatan}
                  disabled={readOnly}
                  onChange={(e) => handleUpdateCatatan(index, e.target.value)}
                />
                {!readOnly && (
                  <button
                    onClick={() => handleRemoveCatatan(index)}
                    className="absolute right-2 top-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Hapus Catatan"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold text-slate-900">Outstanding Umum</h3>
          {!readOnly && (
            <button
              onClick={handleAddOutstanding}
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors border border-orange-100"
            >
              <span className="text-lg leading-none">+</span> <span className="hidden sm:inline">Tambah</span>
            </button>
          )}
        </div>
        
        {outstandingUmum.length === 0 ? (
          <div className="flex min-h-[100px] items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-sm text-slate-500">Tidak ada outstanding umum.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outstandingUmum.map((out, index) => (
              <div key={index} className="flex gap-2 items-start relative group">
                <textarea
                  className={`flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 min-h-[80px] transition-all resize-y ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  placeholder={`Outstanding #${index + 1}...`}
                  value={out}
                  disabled={readOnly}
                  onChange={(e) => handleUpdateOutstanding(index, e.target.value)}
                />
                {!readOnly && (
                  <button
                    onClick={() => handleRemoveOutstanding(index)}
                    className="absolute right-2 top-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Hapus Outstanding"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Ringkasan & Rekomendasi</h3>
        <textarea
          className={`min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all resize-y ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 hover:bg-white'}`}
          placeholder="Tuliskan ringkasan hasil survey, kondisi umum di lapangan, rekomendasi awal, dan catatan untuk pelaporan..."
          value={stepData.ringkasan || ''}
          disabled={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            onChange && onChange(prev => ({ ...prev, ringkasan: e.target.value }));
          }}
        />
      </section>

      {previewHtml && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-8">
          <div className="bg-[#1f1f1f] md:rounded-2xl shadow-2xl w-full h-full md:max-w-5xl md:h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#2d2d2d] text-gray-200">
              <h3 className="font-bold text-gray-100 text-lg">Preview Laporan Akhir</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#3d3d3d] rounded-lg shadow-sm overflow-hidden mr-2">
                  <button onClick={() => {
                    const s = Math.max(previewScale - 0.1, 0.1);
                    setPreviewScale(s);
                    setPreviewHtml(generatePreviewHTML(stepData, lapanganData, null, s));
                  }} className="px-3 py-1.5 hover:bg-[#4d4d4d] font-bold text-gray-300">-</button>
                  <span className="px-3 py-1.5 text-sm font-semibold text-gray-200 min-w-[3.5rem] text-center">{Math.round((previewScale || 1) * 100)}%</span>
                  <button onClick={() => {
                    const s = Math.min(previewScale + 0.1, 3);
                    setPreviewScale(s);
                    setPreviewHtml(generatePreviewHTML(stepData, lapanganData, null, s));
                  }} className="px-3 py-1.5 hover:bg-[#4d4d4d] font-bold text-gray-300">+</button>
                </div>
                
                <button 
                  onClick={() => exportToPDF(stepData, lapanganData, null)} 
                  className="p-2 text-gray-400 hover:text-white bg-[#3d3d3d] rounded-lg shadow-sm hover:bg-blue-600 transition-colors mr-1"
                  title="Unduh Laporan"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Laporan Survey Akhir GTE',
                        text: 'Silakan lihat lampiran Laporan Survey Akhir ini.',
                        url: window.location.href
                      }).catch(err => {
                        console.log("Error sharing:", err);
                      });
                    } else {
                      alert('Fitur bagikan otomatis tidak didukung. Silakan gunakan fitur Unduh (Save as PDF) lalu bagikan filenya secara manual.');
                    }
                  }} 
                  className="p-2 text-gray-400 hover:text-white bg-[#3d3d3d] rounded-lg shadow-sm hover:bg-green-600 transition-colors mr-1"
                  title="Bagikan"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                <button onClick={() => setPreviewHtml(null)} className="p-2 text-gray-400 hover:text-white bg-[#3d3d3d] rounded-lg shadow-sm hover:bg-red-500 transition-colors ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full bg-white relative">
              <iframe 
                srcDoc={previewHtml} 
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
