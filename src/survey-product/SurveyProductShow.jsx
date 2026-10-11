import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  PackageOpen,
  Box,
  Calendar,
  MapPin,
  Building2,
  User,
  Phone,
  Users,
  Clock,
  AlertCircle,
  Eye,
  Printer,
  Check,
  Copy,
  ChevronRight,
  ChevronDown,
  Layers,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ShieldCheck,
  Tag,
  Info,
  ListChecks,
  CheckSquare,
  Edit,
  X
} from 'lucide-react';
import MainLayout from '../components/layouts/MainLayout';
import { apiUrl } from '../api';
import { PRODUCT_LIST } from './components/StepData';
import DynamicProductForm from './components/modals/DynamicProductForm';
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

const valueOrDash = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return '-';
  return value;
};

const getPersonName = (person) => {
  if (!person) return '-';
  if (typeof person === 'string') return person;
  return person.name || person.label || person.username || person.email || '-';
};

const getStatusBadge = (status) => {
  const norm = (status || '').toLowerCase();
  if (['closed', 'completed', 'complited', 'selesai'].includes(norm)) {
    return {
      label: status || 'Closed',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
    };
  }
  if (['lapangan', 'on progress', 'progress'].includes(norm)) {
    return {
      label: status || 'On Progress',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Clock className="w-3.5 h-3.5 text-blue-600" />
    };
  }
  if (['persiapan', 'preparation'].includes(norm)) {
    return {
      label: status || 'Persiapan',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
    };
  }
  if (['batal', 'cancelled'].includes(norm)) {
    return {
      label: status || 'Batal',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
    };
  }
  return {
    label: status || 'Draft',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
  };
};

const countPhotos = (products) =>
  products.reduce((total, product) => {
    const formData = product.formData || {};
    return (
      total +
      Object.values(formData).reduce((sum, value) => {
        if (Array.isArray(value) && value.some((item) => item?.data || item?.url || item instanceof File)) {
          return sum + value.length;
        }
        return sum;
      }, 0)
    );
  }, 0);

const InfoTile = ({ label, value, icon: Icon, extraClass = '' }) => (
  <div className={`p-3 sm:p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 transition-all ${extraClass}`}>
    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 break-words">{valueOrDash(value)}</div>
  </div>
);

const CheckBoxCell = () => (
  <td className="px-3 py-3 text-center">
    <span className="inline-flex h-4 w-4 rounded border border-slate-300 bg-white"></span>
  </td>
);

const getDefaultReportScale = () =>
  typeof window !== 'undefined' && window.innerWidth >= 768 ? 1.05 : 0.45;

export default function SurveyProductShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'step1', 'step2', 'step3', 'step4', 'step5'
  const [copiedSurveyNo, setCopiedSurveyNo] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [checklistFilter, setChecklistFilter] = useState('all'); // 'all', 'ready', 'unready'
  const [reportPreviewScale, setReportPreviewScale] = useState(getDefaultReportScale);
  const [popupType, setPopupType] = useState(null); // null | 'checklist' | 'report'
  const [popupScale, setPopupScale] = useState(1);
  const popupIframeRef = useRef(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target)) {
        setMobileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    return items.map((item) => ({
      ...item,
      digunakan: Boolean(state[item.id]?.digunakan),
      qty: state[item.id]?.qty || 0
    }));
  }, [survey]);

  const selectedProducts = useMemo(() => {
    return (stepData.selectedProducts || []).map((code) => {
      return PRODUCT_LIST.find((p) => p.code === code) || { code, name: code, category: 'Lainnya' };
    });
  }, [stepData.selectedProducts]);

  const actualProducts = useMemo(() => {
    return lapanganData.productProgress || [];
  }, [lapanganData.productProgress]);

  const actualSchedules = useMemo(() => {
    return lapanganData.actualSchedules || [];
  }, [lapanganData.actualSchedules]);

  const plannedSchedules = useMemo(() => {
    return stepData.schedules || [];
  }, [stepData.schedules]);

  // Leaders & Members
  const leaderSurveyors = useMemo(() => {
    if (Array.isArray(stepData.leader_surveyor) && stepData.leader_surveyor.length > 0) {
      return stepData.leader_surveyor;
    }
    if (stepData.leader_surveyor_name || stepData.nama_surveyor) {
      return [{ id: stepData.leader_surveyor_id || 1, name: stepData.leader_surveyor_name || stepData.nama_surveyor }];
    }
    return [];
  }, [stepData]);

  const anggotaSurveyors = useMemo(() => {
    if (Array.isArray(stepData.anggota_surveyor) && stepData.anggota_surveyor.length > 0) {
      return stepData.anggota_surveyor;
    }
    return [];
  }, [stepData]);

  // Summary Metrics
  const uniqueActualCodes = useMemo(() => {
    return [...new Set(actualProducts.map((p) => p.code).filter(Boolean))];
  }, [actualProducts]);

  const avgCompleteness = useMemo(() => {
    if (!actualProducts.length) return 0;
    const sum = actualProducts.reduce((acc, p) => acc + Number(p.percent || 0), 0);
    return Math.round(sum / actualProducts.length);
  }, [actualProducts]);

  const incompleteCount = useMemo(() => {
    return actualProducts.filter((p) => Number(p.percent || 0) < 100).length;
  }, [actualProducts]);

  const completedCount = useMemo(() => {
    return actualProducts.filter((p) => Number(p.percent || 0) >= 100).length;
  }, [actualProducts]);

  const photoCount = useMemo(() => {
    return countPhotos(actualProducts);
  }, [actualProducts]);

  const readyPersiapanCount = useMemo(() => {
    return persiapanItems.filter((i) => i.digunakan).length;
  }, [persiapanItems]);

  const filteredPersiapanItems = useMemo(() => {
    if (checklistFilter === 'ready') return persiapanItems.filter((i) => i.digunakan);
    if (checklistFilter === 'unready') return persiapanItems.filter((i) => !i.digunakan);
    return persiapanItems;
  }, [persiapanItems, checklistFilter]);

  const reportHtml = useMemo(() => {
    if (!survey) return '';
    return generatePreviewHTML(stepData, lapanganData, null, reportPreviewScale);
  }, [survey, stepData, lapanganData, reportPreviewScale]);

  const handleCopySurveyNo = () => {
    if (!stepData.no_survey) return;
    navigator.clipboard.writeText(stepData.no_survey);
    setCopiedSurveyNo(true);
    setTimeout(() => setCopiedSurveyNo(false), 2000);
  };

  const getChecklistHtml = (scale = 1) => {
    const rows = persiapanItems
      .map(
        (item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td><strong>${item.label || ''}</strong></td>
        <td>${item.jenis || ''}</td>
        <td>${item.ket_tambahan || '-'}</td>
        <td style="text-align: center;">${item.digunakan ? '<span style="color: #059669; font-weight: bold;">Siap</span>' : '<span style="color: #6b7280;">Tidak</span>'}</td>
        <td style="text-align: center;">${item.qty || '-'}</td>
        <td class="check"></td>
        <td class="check"></td>
        <td class="check"></td>
      </tr>
    `
      )
      .join('');

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Checklist Persiapan ${stepData.no_survey || ''}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; margin: 24px; font-size: 11px; background: #fff; zoom: ${scale}; }
          .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          h1 { font-size: 18px; margin: 0 0 4px; font-weight: 800; color: #0f172a; }
          .sub { margin: 0; color: #475569; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: middle; }
          th { background: #f8fafc; text-align: left; font-weight: 700; color: #334155; }
          .check { width: 50px; height: 26px; }
          .footer { margin-top: 24px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
          @media print { body { margin: 10mm; zoom: 1 !important; } }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>CHECKLIST PERSIAPAN SURVEY PRODUCT</h1>
          <p class="sub">
            <strong>No. Survey:</strong> ${stepData.no_survey || '-'} &nbsp;|&nbsp;
            <strong>Client:</strong> ${stepData.nama_client || '-'} &nbsp;|&nbsp;
            <strong>Plant/Area:</strong> ${stepData.plant_area || '-'} &nbsp;|&nbsp;
            <strong>Tgl Mulai:</strong> ${formatDate(stepData.tanggal_mulai)}
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">No</th>
              <th>Nama Item / Peralatan</th>
              <th>Jenis</th>
              <th>Kategori / Detail</th>
              <th style="width: 55px; text-align: center;">Siap</th>
              <th style="width: 45px; text-align: center;">Qty</th>
              <th style="width: 60px; text-align: center;">Admin</th>
              <th style="width: 60px; text-align: center;">Logistic</th>
              <th style="width: 60px; text-align: center;">Surveyor</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <div>Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
          <div>Sistem Daily Activity - Survey Product</div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintPopup = () => {
    if (popupIframeRef.current?.contentWindow) {
      popupIframeRef.current.contentWindow.focus();
      popupIframeRef.current.contentWindow.print();
    }
  };

  const openChecklistPopup = () => {
    setPopupScale(1);
    setPopupType('checklist');
  };

  const openReportPopup = () => {
    setPopupScale(1);
    setPopupType('report');
  };

  if (isLoading) {
    return (
      <MainLayout currentModule="Survey Product">
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-slate-100 bg-white p-8 sm:p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-base font-bold text-slate-800">Memuat Detail Survey Product...</h3>
          <p className="text-sm text-slate-500 mt-1">Mengambil data Step 1 s/d Step 5 secara lengkap</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout currentModule="Survey Product">
        <div className="rounded-2xl border border-rose-100 bg-white p-6 sm:p-10 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Survey</h2>
          <p className="text-sm text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => navigate('/survey-product')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
          </button>
        </div>
      </MainLayout>
    );
  }

  const statusBadge = getStatusBadge(stepData.status);

  const TABS = [
    { id: 'all', label: 'Semua Step', icon: Layers, badge: null },
    { id: 'step1', label: 'Step 1: Data', icon: FileText, badge: `${selectedProducts.length}` },
    { id: 'step2', label: 'Step 2: Persiapan', icon: ClipboardCheck, badge: `${readyPersiapanCount}/${persiapanItems.length}` },
    { id: 'step3', label: 'Step 3: Lapangan', icon: PackageOpen, badge: `${actualProducts.length}` },
    { id: 'step4', label: 'Step 4: Summary', icon: BarChart3, badge: `${avgCompleteness}%` },
    { id: 'step5', label: 'Step 5: Laporan', icon: FileText, badge: 'PDF' }
  ];

  return (
    <MainLayout currentModule="Survey Product">
      <div className="space-y-4 sm:space-y-6 pb-20 px-1 sm:px-2 md:px-0 max-w-7xl mx-auto">
        {/* ============================================================ */}
        {/* TOP BAR / HEADER                                              */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                onClick={() => navigate('/survey-product')}
                title="Kembali ke Daftar Survey"
                className="mt-0.5 rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight break-all sm:break-normal">
                    {stepData.no_survey || `Survey #${id}`}
                  </h1>
                  <button
                    onClick={handleCopySurveyNo}
                    title="Salin No Survey"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    {copiedSurveyNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSurveyNo ? 'Disalin' : 'Salin'}</span>
                  </button>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-bold ${statusBadge.bg}`}
                  >
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-700 font-semibold truncate max-w-[200px] sm:max-w-none">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {stepData.nama_client || '-'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {stepData.plant_area || '-'}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {formatDate(stepData.tanggal_mulai)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Responsive Grid on Mobile) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 lg:pt-0 w-full lg:w-auto">
              <button
                onClick={openChecklistPopup}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cetak Checklist</span>
              </button>
              <button
                onClick={openReportPopup}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs md:text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Ekspor PDF</span>
              </button>
              <button
                onClick={() => navigate(`/survey-product/create?id=${id}`)}
                className="col-span-2 sm:col-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
              >
                <Edit className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Edit Survey</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 pt-3.5 sm:pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <Box className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Rencana</div>
                <div className="text-xs sm:text-base font-extrabold text-slate-900 truncate">{selectedProducts.length} Jenis</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Aktual</div>
                <div className="text-xs sm:text-base font-extrabold text-slate-900 truncate">{actualProducts.length} Item</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Checklist</div>
                <div className="text-xs sm:text-base font-extrabold text-slate-900 truncate">
                  {readyPersiapanCount}/{persiapanItems.length} Siap
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 sm:bg-transparent">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 font-bold">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Kelengkapan</div>
                <div className="text-xs sm:text-base font-extrabold text-slate-900 truncate">{avgCompleteness}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STEPPER / TAB NAVIGATION                                      */}
        {/* Mobile: Dropdown Selector | Desktop: Tab Pills                */}
        {/* ============================================================ */}

        {/* Mobile Dropdown View (sm:hidden) */}
        <div className="relative sm:hidden" ref={mobileDropdownRef}>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
            Navigasi Halaman / Step:
          </div>
          {(() => {
            const currentTabObj = TABS.find((t) => t.id === activeTab) || TABS[0];
            const CurrentTabIcon = currentTabObj.icon;
            return (
              <>
                <button
                  type="button"
                  onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-xs text-left text-xs sm:text-sm font-bold text-slate-800 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
                      <CurrentTabIcon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{currentTabObj.label}</span>
                    {currentTabObj.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                        {currentTabObj.badge}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      mobileDropdownOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Options */}
                {mobileDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-150">
                    {TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isSelected = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id);
                            setMobileDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="truncate">{tab.label}</span>
                            {tab.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                  isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Desktop Tab Pills (hidden sm:flex) */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* STEP 1: DATA                                                  */}
        {/* ============================================================ */}
        {(activeTab === 'all' || activeTab === 'step1') && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900">Step 1: Data Rencana Survey</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Informasi client, tim surveyor, jadwal, dan target produk</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                Step 1/5
              </span>
            </div>

            {/* Grid Informasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
              <InfoTile label="Customer / Perusahaan" value={stepData.nama_client} icon={Building2} />
              <InfoTile label="Plant / Area" value={stepData.plant_area} icon={MapPin} />
              <InfoTile label="Tanggal Mulai Survey" value={formatDate(stepData.tanggal_mulai)} icon={Calendar} />
              <InfoTile label="No Inquiry" value={stepData.no_inquiry} icon={Tag} />
              <InfoTile label="PIC Client" value={stepData.pic_client} icon={User} />
              <InfoTile label="Kontak PIC" value={stepData.kontak_pic} icon={Phone} />
              <InfoTile label="Marketing / Sales" value={stepData.nama_marketing} icon={User} />
              <div className="sm:col-span-2">
                <InfoTile label="Alamat Lengkap Lokasi" value={stepData.alamat_lokasi} icon={MapPin} />
              </div>
            </div>

            {/* Tim Surveyor Section */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Tim Pelaksana Survey</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mb-1">Leader Surveyor</div>
                  <div className="flex flex-wrap gap-1.5">
                    {leaderSurveyors.length ? (
                      leaderSurveyors.map((leader, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-bold text-blue-800"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {getPersonName(leader)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ditentukan</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mb-1">Anggota Surveyor</div>
                  <div className="flex flex-wrap gap-1.5">
                    {anggotaSurveyors.length ? (
                      anggotaSurveyors.map((member, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          {getPersonName(member)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Tidak ada anggota tambahan</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tujuan Survey */}
            {stepData.tujuan_survey && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Tujuan Pelaksanaan Survey</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{stepData.tujuan_survey}</p>
              </div>
            )}

            {/* Produk Terencana */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Target Produk Terencana ({selectedProducts.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {selectedProducts.length ? (
                  selectedProducts.map((p) => (
                    <div
                      key={p.code}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {p.code}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">{p.category || 'Product'}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{p.name || p.code}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-3 text-center text-xs text-slate-400 italic">
                    Belum ada produk yang direncanakan.
                  </div>
                )}
              </div>
            </div>

            {/* Jadwal Rencana Survey (Responsive: Desktop Table + Mobile Cards) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Jadwal Rencana Pelaksanaan ({plannedSchedules.length} Hari)
                </h3>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3 w-20 text-center">Hari</th>
                      <th className="px-4 py-3 w-40">Tanggal Rencana</th>
                      <th className="px-4 py-3">Rencana Area</th>
                      <th className="px-4 py-3">Target Item / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plannedSchedules.length ? (
                      plannedSchedules.map((sch, idx) => (
                        <tr key={sch.id || idx} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 text-center font-bold text-slate-700">Hari {sch.hari || idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{formatDate(sch.tanggal)}</td>
                          <td className="px-4 py-3 text-slate-700">{sch.rencana_area || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{sch.target_item || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-6 text-center text-xs text-slate-400 italic">
                          Belum ada jadwal rencana.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {plannedSchedules.length ? (
                  plannedSchedules.map((sch, idx) => (
                    <div key={sch.id || idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Hari {sch.hari || idx + 1}
                        </span>
                        <span className="text-slate-500 font-medium">{formatDate(sch.tanggal)}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 pt-1">
                        <span className="text-slate-400 font-normal">Area:</span> {sch.rencana_area || '-'}
                      </div>
                      <div className="text-xs text-slate-600">
                        <span className="text-slate-400 font-normal">Target:</span> {sch.target_item || '-'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 italic">Belum ada jadwal rencana.</div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 2: PERSIAPAN                                             */}
        {/* ============================================================ */}
        {(activeTab === 'all' || activeTab === 'step2') && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900">Step 2: Checklist APD & Alat</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Kesiapan perlengkapan, APD, dan perizinan lapangan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openChecklistPopup}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cetak Checklist</span>
                </button>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                  Step 2/5
                </span>
              </div>
            </div>

            {/* Kesiapan Metrics & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-700">
                <span>
                  Total: <strong className="text-slate-900">{persiapanItems.length}</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-700">
                  Siap: <strong>{readyPersiapanCount}</strong>
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  Belum: <strong>{persiapanItems.length - readyPersiapanCount}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 w-full sm:w-auto">
                <button
                  onClick={() => setChecklistFilter('all')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-colors ${
                    checklistFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua ({persiapanItems.length})
                </button>
                <button
                  onClick={() => setChecklistFilter('ready')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-colors ${
                    checklistFilter === 'ready' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Siap ({readyPersiapanCount})
                </button>
                <button
                  onClick={() => setChecklistFilter('unready')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-colors ${
                    checklistFilter === 'unready' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Belum ({persiapanItems.length - readyPersiapanCount})
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama Item / Dokumen</th>
                    <th className="px-4 py-3 w-40">Jenis / Kategori</th>
                    <th className="px-4 py-3 w-44">Keterangan</th>
                    <th className="px-4 py-3 w-28 text-center">Kesiapan</th>
                    <th className="px-4 py-3 w-20 text-center">Qty</th>
                    <th className="px-3 py-3 w-16 text-center text-[10px]">Admin</th>
                    <th className="px-3 py-3 w-16 text-center text-[10px]">Logistic</th>
                    <th className="px-3 py-3 w-16 text-center text-[10px]">Surveyor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPersiapanItems.length ? (
                    filteredPersiapanItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60 bg-white">
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.label}</td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.jenis || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.ket_tambahan || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {item.digunakan ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Siap
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                              <Circle className="h-3 w-3 text-slate-400" /> Belum
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{item.qty || 1}</td>
                        <CheckBoxCell />
                        <CheckBoxCell />
                        <CheckBoxCell />
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-xs text-slate-400 italic">
                        Tidak ada item checklist sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2.5">
              {filteredPersiapanItems.length ? (
                filteredPersiapanItems.map((item, idx) => (
                  <div key={item.id || idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {idx + 1}. {item.label}
                      </div>
                      {item.digunakan ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Siap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 shrink-0">
                          <Circle className="h-3 w-3 text-slate-400" /> Belum
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">{item.jenis}</span>
                      <span>•</span>
                      <span>Qty: <strong>{item.qty || 1}</strong></span>
                      {item.ket_tambahan && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">{item.ket_tambahan}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 italic">Tidak ada item checklist.</div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 3: LAPANGAN                                              */}
        {/* ============================================================ */}
        {(activeTab === 'all' || activeTab === 'step3') && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <PackageOpen className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900">Step 3: Pelaksanaan Lapangan</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Jadwal hari aktual dan progres pengisian spesifikasi tiap produk</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                Step 3/5
              </span>
            </div>

            {/* Jadwal Aktual Pelaksanaan (Desktop Table + Mobile Cards) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Jadwal Hari Aktual Pelaksanaan ({actualSchedules.length} Hari)
                </h3>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3 w-20 text-center">Hari Ke</th>
                      <th className="px-4 py-3 w-40">Tanggal Aktual</th>
                      <th className="px-4 py-3">Kegiatan / Area Dikerjakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actualSchedules.length ? (
                      actualSchedules.map((sch, idx) => (
                        <tr key={sch.id || idx} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 text-center font-bold text-slate-700">Hari {sch.hari_ke || idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{formatDate(sch.tanggal)}</td>
                          <td className="px-4 py-3 text-slate-700">{sch.kegiatan || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-6 text-center text-xs text-slate-400 italic">
                          Belum ada jadwal aktual dicatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {actualSchedules.length ? (
                  actualSchedules.map((sch, idx) => (
                    <div key={sch.id || idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          Hari {sch.hari_ke || idx + 1}
                        </span>
                        <span className="text-slate-500 font-medium">{formatDate(sch.tanggal)}</span>
                      </div>
                      <div className="text-xs text-slate-700 pt-1">
                        <span className="text-slate-400 font-normal">Kegiatan:</span> {sch.kegiatan || '-'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 italic">Belum ada jadwal aktual dicatat.</div>
                )}
              </div>
            </div>

            {/* Daftar Produk Progress Lapangan */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Daftar Produk Aktual Disurvey ({actualProducts.length} Item)
                </h3>
              </div>

              <div className="space-y-3">
                {actualProducts.length ? (
                  actualProducts.map((prod) => {
                    const percent = Number(prod.percent || 0);
                    const is100 = percent >= 100;
                    const answers = prod.formData || {};
                    const answersCount = Object.keys(answers).filter(
                      (k) => answers[k] !== undefined && answers[k] !== '' && answers[k] !== null
                    ).length;

                    return (
                      <div
                        key={prod.id}
                        className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100">
                              {prod.code || 'PRD'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                  {prod.displayId || `${prod.code}-${prod.id}`}
                                </span>
                                <span className="text-xs font-semibold text-slate-600 truncate">• {prod.name || prod.code}</span>
                                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Hari ke-{prod.hari_ke || 1}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  Lokasi: <strong className="text-slate-700">{prod.lokasi || '-'}</strong>
                                </span>
                                <span>•</span>
                                <span>{answersCount} atribut diisi</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar info for Desktop */}
                          <div className="hidden sm:block w-32 md:w-36 text-right shrink-0">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-[11px] font-semibold text-slate-500">Kelengkapan</span>
                              <span
                                className={`font-black ${
                                  is100 ? 'text-emerald-700' : percent >= 50 ? 'text-blue-700' : 'text-amber-700'
                                }`}
                              >
                                {percent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  is100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mobile Progress Bar */}
                        <div className="sm:hidden pt-1">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-[11px] font-semibold text-slate-500">Kelengkapan Form</span>
                            <span
                              className={`font-black ${
                                is100 ? 'text-emerald-700' : percent >= 50 ? 'text-blue-700' : 'text-amber-700'
                              }`}
                            >
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                is100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action: View Form Detail Button (Full width on mobile) */}
                        <div className="pt-1 border-t border-slate-100 flex sm:justify-end">
                          <button
                            onClick={() => setSelectedProductDetail(prod)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span>Lihat Detail Isian Form</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 italic text-xs">
                    Belum ada progress produk lapangan yang diinput.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 4: SUMMARY                                               */}
        {/* ============================================================ */}
        {(activeTab === 'all' || activeTab === 'step4') && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900">Step 4: Summary & Rekapitulasi</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Perbandingan target rencana vs aktual dan temuan umum</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
                Step 4/5
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
              <InfoTile label="Jenis Produk Aktual" value={`${uniqueActualCodes.length} Jenis`} icon={Box} />
              <InfoTile label="Total Item Disurvey" value={`${actualProducts.length} Item`} icon={PackageOpen} />
              <InfoTile label="Rata-rata Kelengkapan" value={`${avgCompleteness}%`} icon={BarChart3} />
              <InfoTile label="Item Belum 100%" value={`${incompleteCount} Item`} icon={AlertTriangle} />
            </div>

            {/* Rekapitulasi Rencana vs Aktual (Desktop Table + Mobile Cards) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Matriks Perbandingan Produk: Rencana vs Aktual
                </h3>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3">Kode Produk</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-center">Rencana</th>
                      <th className="px-4 py-3 text-center">Aktual</th>
                      <th className="px-4 py-3 text-center">Rata-rata Kelengkapan</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PRODUCT_LIST.filter(
                      (p) =>
                        (stepData.selectedProducts || []).includes(p.code) ||
                        actualProducts.some((ap) => ap.code === p.code)
                    ).map((p) => {
                      const isPlanned = (stepData.selectedProducts || []).includes(p.code);
                      const items = actualProducts.filter((ap) => ap.code === p.code);
                      const avgPct = items.length
                        ? Math.round(items.reduce((s, x) => s + Number(x.percent || 0), 0) / items.length)
                        : 0;

                      return (
                        <tr key={p.code} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-bold text-slate-900">{p.code}</td>
                          <td className="px-4 py-3 text-slate-700">{p.name}</td>
                          <td className="px-4 py-3 text-center">
                            {isPlanned ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                Direncanakan
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-800">
                            {items.length ? `${items.length} item` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-blue-700">
                            {items.length ? `${avgPct}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {items.length > 0 && avgPct >= 100 ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Lengkap
                              </span>
                            ) : items.length > 0 ? (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                In Progress
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">Belum Ada Item</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {PRODUCT_LIST.filter(
                  (p) =>
                    (stepData.selectedProducts || []).includes(p.code) ||
                    actualProducts.some((ap) => ap.code === p.code)
                ).map((p) => {
                  const isPlanned = (stepData.selectedProducts || []).includes(p.code);
                  const items = actualProducts.filter((ap) => ap.code === p.code);
                  const avgPct = items.length
                    ? Math.round(items.reduce((s, x) => s + Number(x.percent || 0), 0) / items.length)
                    : 0;

                  return (
                    <div key={p.code} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {p.code}
                        </span>
                        {items.length > 0 && avgPct >= 100 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Lengkap
                          </span>
                        ) : items.length > 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            In Progress
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">Belum Ada</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <span>Rencana: <strong>{isPlanned ? 'Ya' : 'Tidak'}</strong></span>
                        <span>Aktual: <strong>{items.length} item</strong></span>
                        <span>Rata-rata: <strong className="text-blue-700">{items.length ? `${avgPct}%` : '-'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catatan Umum & Outstanding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Catatan Umum Lapangan</span>
                </div>
                {Array.isArray(stepData.catatanUmum) && stepData.catatanUmum.filter(Boolean).length > 0 ? (
                  <ul className="list-disc list-inside text-xs sm:text-sm text-slate-700 space-y-1">
                    {stepData.catatanUmum.filter(Boolean).map((cat, i) => (
                      <li key={i}>{cat}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada catatan umum tambahan.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Outstanding & Open Items</span>
                </div>
                {Array.isArray(stepData.outstandingUmum) && stepData.outstandingUmum.filter(Boolean).length > 0 ? (
                  <ul className="list-disc list-inside text-xs sm:text-sm text-slate-700 space-y-1">
                    {stepData.outstandingUmum.filter(Boolean).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada open items / pending issues.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* STEP 5: LAPORAN                                               */}
        {/* ============================================================ */}
        {(activeTab === 'all' || activeTab === 'step5') && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900">Step 5: Dokumen Laporan Resmi</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">Pratinjau laporan terstandar PDF lengkap dengan logo & foto</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                  <button
                    onClick={() => setReportPreviewScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
                    title="Perkecil Preview"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-bold text-slate-600 text-[11px]">
                    {Math.round(reportPreviewScale * 100)}%
                  </span>
                  <button
                    onClick={() => setReportPreviewScale((s) => Math.min(1.5, Number((s + 0.1).toFixed(2))))}
                    title="Perbesar Preview"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={openReportPopup}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-3.5 py-2 text-xs md:text-sm font-bold text-white shadow-xs transition-colors hover:bg-orange-700"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Pratinjau & Cetak PDF</span>
                </button>
              </div>
            </div>

            {/* Container Iframe Laporan (Responsive Height on Mobile) */}
            <div className="relative h-[480px] sm:h-[640px] md:h-[780px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-inner">
              <iframe
                srcDoc={reportHtml}
                className="h-full w-full border-0 bg-white"
                title="Preview Laporan Survey Product"
              />
            </div>
          </section>
        )}

        {/* Modal Detail Isian Product Form (Read-only) */}
        {selectedProductDetail && (
          <DynamicProductForm
            product={selectedProductDetail}
            existingData={selectedProductDetail.formData || {}}
            schedules={actualSchedules}
            readOnly={true}
            onClose={() => setSelectedProductDetail(null)}
          />
        )}

        {/* Modal Popup Pratinjau Dokumen (Checklist / Laporan) - Mobile Optimized */}
        {popupType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[92vh] flex flex-col overflow-hidden border border-slate-200">
              {/* Modal Header */}
              <div className="p-3 sm:p-4 md:px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold shrink-0">
                    {popupType === 'checklist' ? (
                      <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    ) : (
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm md:text-base truncate">
                      {popupType === 'checklist' ? 'Checklist Persiapan' : 'Laporan Survey'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                      {stepData.no_survey || '-'} • {stepData.nama_client || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Zoom Controls */}
                  <div className="hidden md:inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                    <button
                      onClick={() => setPopupScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))))}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 font-bold text-slate-600 text-[11px] min-w-[36px] text-center">
                      {Math.round(popupScale * 100)}%
                    </span>
                    <button
                      onClick={() => setPopupScale((s) => Math.min(1.5, Number((s + 0.1).toFixed(2))))}
                      className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Print Button inside popup */}
                  <button
                    onClick={handlePrintPopup}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Cetak</span>
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={() => setPopupType(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors ml-0.5"
                    title="Tutup Pratinjau"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Embedded Document Viewer */}
              <div className="flex-1 bg-slate-100/70 p-1.5 sm:p-3 md:p-4 overflow-hidden relative">
                <iframe
                  ref={popupIframeRef}
                  srcDoc={
                    popupType === 'checklist'
                      ? getChecklistHtml(popupScale)
                      : generatePreviewHTML(stepData, lapanganData, null, popupScale)
                  }
                  className="w-full h-full bg-white rounded-lg sm:rounded-xl shadow-xs border border-slate-200"
                  title="Document Preview Modal"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
