import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, ClipboardCheck, CheckCircle2, Circle, PackageOpen } from 'lucide-react';
import MainLayout from '../components/layouts/MainLayout';
import { apiUrl } from '../api';
import { PRODUCT_LIST } from './components/StepData';
import { exportToPDF, generatePreviewHTML } from './utils/pdfExport';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

const valueOrDash = (value) => value || '-';

const Field = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
    <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</div>
    <div className="mt-1 text-sm font-semibold text-gray-800 whitespace-pre-wrap">{valueOrDash(value)}</div>
  </div>
);

const CheckBoxCell = () => (
  <td className="px-3 py-3 text-center">
    <span className="inline-flex h-5 w-5 rounded border-2 border-slate-300 bg-white"></span>
  </td>
);

const getDefaultReportScale = () => (
  typeof window !== 'undefined' && window.innerWidth >= 768 ? 1.15 : 0.4
);

export default function SurveyProductShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportPreviewScale, setReportPreviewScale] = useState(getDefaultReportScale);

  useEffect(() => {
    const handleResize = () => setReportPreviewScale(getDefaultReportScale());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSurvey = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl(`survey-engine/product-drafts/${id}`));
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Gagal mengambil detail survey product');
        setSurvey(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

  const stepData = survey?.data || {};
  const lapanganData = survey?.lapangan || {};
  const persiapanItems = useMemo(() => {
    const items = survey?.persiapan?.items || [];
    const state = survey?.persiapan?.state || {};
    return items.map(item => ({
      ...item,
      digunakan: Boolean(state[item.id]?.digunakan),
      qty: state[item.id]?.qty || 0
    }));
  }, [survey]);

  const selectedProducts = (stepData.selectedProducts || []).map(code => (
    PRODUCT_LIST.find(product => product.code === code) || { code, name: code }
  ));
  const actualProducts = lapanganData.productProgress || [];
  const reportHtml = survey ? generatePreviewHTML(stepData, lapanganData, null, reportPreviewScale) : '';

  const printChecklist = () => {
    const rows = persiapanItems.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.jenis || ''}</td>
        <td>${item.ket_tambahan || ''}</td>
        <td>${item.label || ''}</td>
        <td>${item.digunakan ? 'Ya' : 'Tidak'}</td>
        <td>${item.qty || ''}</td>
        <td class="check"></td>
        <td class="check"></td>
        <td class="check"></td>
      </tr>
    `).join('');

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Checklist Persiapan ${stepData.no_survey || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          p { margin: 0 0 16px; color: #4b5563; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #d1d5db; padding: 7px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
          .check { width: 54px; height: 24px; }
          @media print { body { margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>Checklist Persiapan Survey Product</h1>
        <p>${stepData.no_survey || '-'} | ${stepData.nama_client || '-'} | ${stepData.plant_area || '-'}</p>
        <table>
          <thead>
            <tr>
              <th>No</th><th>Jenis</th><th>Kategori</th><th>Item</th><th>Siap</th><th>Qty</th>
              <th>Admin</th><th>Logistic</th><th>Surveyor</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) {
      alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak PDF.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  if (isLoading) {
    return (
      <MainLayout currentModule="Survey Product">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">Memuat detail survey product...</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout currentModule="Survey Product">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-600">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentModule="Survey Product">
      <div className="space-y-6 pb-10">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/survey-product')}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">{stepData.no_survey || `Survey #${id}`}</h1>
                <p className="text-sm text-gray-500">{stepData.nama_client || '-'} | {stepData.plant_area || '-'}</p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {stepData.status || 'Draft'}
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Isian Step Data</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Client / Perusahaan" value={stepData.nama_client} />
            <Field label="Plant / Area" value={stepData.plant_area} />
            <Field label="Tanggal Mulai" value={formatDate(stepData.tanggal_mulai)} />
            <Field label="Alamat Lokasi" value={stepData.alamat_lokasi} />
            <Field label="Marketing / Sales" value={stepData.nama_marketing} />
            <Field label="No Inquiry" value={stepData.no_inquiry} />
            <Field label="PIC Client" value={stepData.pic_client} />
            <Field label="Kontak PIC" value={stepData.kontak_pic} />
            <Field label="Surveyor" value={stepData.nama_surveyor} />
            <div className="md:col-span-3">
              <Field label="Tujuan Survey" value={stepData.tujuan_survey} />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 text-sm font-bold text-gray-800">Produk Terencana</div>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.length ? selectedProducts.map(product => (
                <span key={product.code} className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  {product.code} - {product.name}
                </span>
              )) : <span className="text-sm text-gray-500">Belum ada produk.</span>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Persiapan Checklist</h2>
                <p className="text-sm text-gray-500">Kolom Admin, Logistic, dan Surveyor disediakan untuk tanda cek/paraf saat dicetak.</p>
              </div>
            </div>
            <button
              onClick={printChecklist}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Unduh / Export PDF Checklist
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Siap</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-3 py-3 text-center">Admin</th>
                  <th className="px-3 py-3 text-center">Logistic</th>
                  <th className="px-3 py-3 text-center">Surveyor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {persiapanItems.map(item => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.jenis}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.ket_tambahan || '-'}</td>
                    <td className="px-4 py-3">
                      {item.digunakan ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ya
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-bold text-gray-500">
                          <Circle className="h-3.5 w-3.5" /> Tidak
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{item.qty || '-'}</td>
                    <CheckBoxCell />
                    <CheckBoxCell />
                    <CheckBoxCell />
                  </tr>
                ))}
                {persiapanItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">Belum ada checklist persiapan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <PackageOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Summary</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Produk Aktual" value={`${new Set(actualProducts.map(p => p.code)).size} jenis`} />
            <Field label="Item Aktual" value={`${actualProducts.length} item`} />
            <Field label="Rata-rata Kelengkapan" value={actualProducts.length ? `${Math.round(actualProducts.reduce((sum, p) => sum + Number(p.percent || 0), 0) / actualProducts.length)}%` : '0%'} />
            <Field label="Hari Aktual" value={`${(lapanganData.actualSchedules || []).length} hari`} />
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Produk</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Hari</th><th className="px-4 py-3">Progress</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actualProducts.map(product => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-bold text-gray-900">{product.displayId || product.code}</td>
                    <td className="px-4 py-3 text-gray-700">{product.name || product.product_name || product.code}</td>
                    <td className="px-4 py-3 text-gray-600">{product.lokasi || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.hari_ke || '-'}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{product.percent || 0}%</td>
                  </tr>
                ))}
                {actualProducts.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">Belum ada data lapangan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">Laporan</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() => exportToPDF(stepData, lapanganData)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-700"
              >
                <Download className="h-4 w-4" /> Unduh / Export PDF Laporan
              </button>
            </div>
          </div>
          <div className="h-[720px] overflow-hidden rounded-xl border border-gray-200 bg-white">
            <iframe srcDoc={reportHtml} className="h-full w-full border-0" title="Preview Laporan Survey Product" />
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
