import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Download, FileText } from 'lucide-react';
import { apiUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { exportToPDF, generatePreviewHTML } from '../utils/pdfExport';
import MainLayout from '../../components/layouts/MainLayout';
import { offlineEngine } from '../../offline/offlineEngine';
import { offlineDb } from '../../offline/db';

import StepData, { createEmptyStepData, PRODUCT_LIST } from '../components/StepData';
import StepPersiapan, { createEmptyPersiapanData } from '../components/StepPersiapan';
import StepLapangan, { createEmptyLapanganData } from '../components/StepLapangan';
import StepSummary from '../components/StepSummary';

const ALL_STEPS = [
  { id: 1, title: 'Data' },
  { id: 2, title: 'Persiapan' },
  { id: 3, title: 'Lapangan' },
  { id: 4, title: 'Summary' },
  { id: 5, title: 'Laporan' }
];

export default function FormSurveyProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const initialStepParam = (searchParams.get('step') || '').toLowerCase();
  const { user, hasPermission } = useAuth();
  
  const isSuperAdmin = user?.jabatan_name === 'Super Admin' || user?.role === 'Super Admin' || user?.jabatan === 'Super Admin';
  const hasDataPerm = hasPermission('survey_product_fill_data') || user?.role === 'Admin' || isSuperAdmin;
  const hasPersiapanPerm = hasPermission('survey_product_fill_persiapan') || user?.role === 'Admin' || isSuperAdmin;
  const hasLapPerm = hasPermission('survey_product_fill_lapangan') || user?.role === 'Admin' || isSuperAdmin;
  const hasSummaryPerm = hasPermission('survey_product_fill_summary') || user?.role === 'Admin' || isSuperAdmin;
  
  

  const [currentStep, setCurrentStep] = useState(1);
  
  const [stepData, setStepData] = useState(createEmptyStepData());
  const [persiapanData, setPersiapanData] = useState(createEmptyPersiapanData());
  const [lapanganData, setLapanganData] = useState(createEmptyLapanganData());

  const isAdmin = user?.role === 'Admin' || isSuperAdmin;
  const statusStr = (stepData?.status || '').toLowerCase().trim();
  const isClosed = ['closed', 'completed', 'selesai', 'complited'].includes(statusStr);
  const isReadonlyClosed = isClosed; // Locked for everyone when closed or completed

  const hasAccessForStep = (step) => {
    if (isReadonlyClosed) return false;
    switch(step) {
      case 1: return hasDataPerm;
      case 2: return hasPersiapanPerm;
      case 3: return hasLapPerm;
      case 4: return hasSummaryPerm;
      default: return false;
    }
  };
  
  const isLeader = stepData?.leader_surveyor?.some?.(leader => String(leader.id) === String(user?.id)) || String(stepData?.leader_surveyor_id) === String(user?.id);
  const canSaveFinal = isAdmin || isLeader;
  const [surveyDraftId, setSurveyDraftId] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!editId);
  const getDefaultReportScale = () => (
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 1.15 : 0.4
  );
  const [reportPreviewScale, setReportPreviewScale] = useState(getDefaultReportScale);

  useEffect(() => {
    const handleResize = () => setReportPreviewScale(getDefaultReportScale());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkOnProgress = (lapData) => {
    const hasProductProgress = lapData?.productProgress?.length > 0;
    return Boolean(hasProductProgress);
  };

  const isLapanganStarted = editId && !isReadonlyClosed && checkOnProgress(lapanganData);
  const visibleSteps = editId 
    ? (isReadonlyClosed ? ALL_STEPS : (isLapanganStarted ? [ALL_STEPS[0], ALL_STEPS[2], ALL_STEPS[3]] : ALL_STEPS.slice(0, 3)))
    : ALL_STEPS.slice(0, 2);
  const currentStepIndex = visibleSteps.findIndex(step => step.id === currentStep);
  const isFirstVisibleStep = currentStepIndex <= 0;
  const isLastVisibleStep = currentStepIndex === visibleSteps.length - 1;
  const nextVisibleStep = visibleSteps[currentStepIndex + 1]?.id;
  const prevVisibleStep = visibleSteps[currentStepIndex - 1]?.id;

  useEffect(() => {
    if (visibleSteps.length > 0 && !visibleSteps.some(step => step.id === currentStep)) {
      setCurrentStep(visibleSteps[0].id);
    }
  }, [currentStep, visibleSteps]);

  const resolveStepFromParam = (stepParam) => {
    if (stepParam === 'data') return 1;
    if (stepParam === 'persiapan' || stepParam === 'preparation') return 2;
    if (stepParam === 'lapangan' || stepParam === 'field') return 3;
    if (stepParam === 'summary' || stepParam === 'resume') return 4;
    if (stepParam === 'laporan' || stepParam === 'report') return 5;
    const stepNumber = Number(stepParam);
    return Number.isInteger(stepNumber) ? stepNumber : null;
  };

  const checkDataComplete = (data) => {
    const checks = {
      nama_client: !!data.nama_client,
      leader_surveyor: !!(data.leader_surveyor && data.leader_surveyor.length > 0),
      anggota_surveyor: !!(data.anggota_surveyor && data.anggota_surveyor.length > 0),
      plant_area: !!data.plant_area,
      nama_marketing: !!data.nama_marketing,
      selectedProducts: !!(data.selectedProducts && data.selectedProducts.length > 0),
      schedules: !!(data.schedules && data.schedules.length > 0 && data.schedules.some(s => s.hari || s.tanggal || s.rencana_area || s.target_item))
    };
    return Object.values(checks).every(Boolean);
  };

  useEffect(() => {
    const fetchDraft = async () => {
      if (!editId) {
        setIsLoadingDraft(false);
        return;
      }

      setIsLoadingDraft(true);
      try {
        let result = null;
        try {
          const response = await fetch(apiUrl(`survey-engine/product-drafts/${editId}`));
          if (response && response.ok) {
            result = await response.json();
            // Simpan / update cache offline draft di IndexedDB
            await offlineDb.surveyDrafts.put({
              id: String(editId),
              serverId: editId,
              userId: Number(user?.id || 0),
              noSurvey: result.data?.no_survey,
              status: result.status || result.data?.status || 'Draft',
              data: result.data,
              persiapan: result.persiapan,
              lapangan: result.lapangan,
              syncStatus: 'synced',
              updatedAt: new Date().toISOString()
            });
          }
        } catch (netErr) {
          console.warn('Network error fetching survey draft:', netErr);
        }

        // Jika result belum didapat dari online fetch (server mati / offline / non-200),
        // cari di offlineDb.surveyDrafts baik berdasarkan id maupun serverId
        if (!result) {
          const cached = await offlineDb.surveyDrafts.get(String(editId)) ||
                         await offlineDb.surveyDrafts.where('serverId').equals(Number(editId) || editId).first();
          if (cached) {
            console.log('[Offline Form] Menemukan draft di IndexedDB:', cached);
            result = cached;
          }
        }

        // Fallback ketiga: cari di cached reference survey_products_list jika ada
        if (!result) {
          const list = await offlineEngine.getReference('survey_products_list');
          if (Array.isArray(list)) {
            const foundInList = list.find(item => String(item.id) === String(editId));
            if (foundInList) {
              console.log('[Offline Form] Menemukan data di cached survey_products_list:', foundInList);
              result = {
                id: foundInList.id,
                survey_id: foundInList.id,
                data: {
                  no_survey: foundInList.no_survey,
                  nama_client: foundInList.nama_client,
                  plant_area: foundInList.plant_area,
                  status: foundInList.status,
                  selectedProducts: (foundInList.selected_products || []).map(p => p.nama_produk || p.code || p),
                  schedules: foundInList.schedules || []
                },
                persiapan: null,
                lapangan: null
              };
            }
          }
        }

        if (!result) {
          throw new Error('Gagal mengambil data survey product. Data belum tersimpan di cache offline.');
        }

        setSurveyDraftId(result.survey_id || result.id);
        setStepData({
          ...createEmptyStepData(),
          ...(result.data || {})
        });
        setPersiapanData(prev => {
          // Merge fetched items with INITIAL_MASTER_PERSIAPAN
          const existingIds = new Set(prev.masterData.map(i => i.id));
          const newItems = (result.persiapan?.items || []).filter(item => !existingIds.has(item.id));

          return {
            ...prev,
            masterData: [...prev.masterData, ...newItems],
            state: {
              ...prev.state,
              ...(result.persiapan?.state || {})
            }
          };
        });
        setLapanganData({
          ...createEmptyLapanganData(),
          ...(result.lapangan || {})
        });
        const requestedStep = resolveStepFromParam(initialStepParam);
        if (requestedStep) {
          const status = (result.data?.status || '').toLowerCase().trim();
          const isFinal = ['closed', 'completed', 'complited', 'selesai', 'batal'].includes(status);
          const maxStep = isFinal ? ALL_STEPS.length : (checkOnProgress(result.lapangan || {}) ? 4 : 3);
          setCurrentStep(Math.min(Math.max(requestedStep, 1), maxStep));
        }
      } catch (error) {
        alert(error.message);
        navigate('/survey-product');
      } finally {
        setIsLoadingDraft(false);
      }
    };

    fetchDraft();
  }, [editId, navigate, initialStepParam]);

  const saveStepDataDraft = async (forceStatus = null, surveyIdOverride = surveyDraftId) => {
    if (isReadonlyClosed) return surveyIdOverride || false;
    setIsSavingDraft(true);
    try {
      const selectedProducts = (stepData.selectedProducts || []).map(code => {
        const product = PRODUCT_LIST.find(item => item.code === code);
        return product || { code, name: code };
      });
      
      const isDataComplete = checkDataComplete(stepData);
      const isOnProgress = checkOnProgress(lapanganData);
      
      let calculatedStatus = 'Draft';
      if (!editId) {
        calculatedStatus = isDataComplete ? 'Open' : 'Draft';
      } else {
        if (isOnProgress) {
           calculatedStatus = 'On Progress';
        } else if (isDataComplete) {
           calculatedStatus = 'Open';
        } else {
           calculatedStatus = 'Draft';
        }
      }

      const finalStatus = (forceStatus && forceStatus !== 'Submit') ? forceStatus : calculatedStatus;

      // Handle offline save
      if (!navigator.onLine) {
        const localSaved = await offlineEngine.saveSurveyDraft({
          surveyId: surveyIdOverride,
          status: finalStatus,
          data: {
            ...stepData,
            created_by: stepData.created_by || user?.name || user?.username || user?.id || ''
          },
          selectedProducts,
          schedules: (stepData.schedules || []).map((schedule, index) => ({
            ...schedule,
            hari: index + 1
          })),
          userId: user?.id
        });

        setSurveyDraftId(localSaved.id);
        setStepData(prev => ({
          ...prev,
          status: finalStatus
        }));
        return localSaved.id;
      }

      const response = await fetch(apiUrl('survey-engine/product-drafts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: surveyIdOverride,
          status: finalStatus,
          data: {
            ...stepData,
            created_by: stepData.created_by || user?.name || user?.username || user?.id || ''
          },
          selected_products: selectedProducts,
          schedules: (stepData.schedules || []).map((schedule, index) => ({
            ...schedule,
            hari: index + 1
          }))
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Gagal menyimpan draft survey product');
      }

      const result = await response.json();
      setSurveyDraftId(result.survey_id);
      setStepData(prev => ({
        ...prev,
        no_survey: result.no_survey || prev.no_survey,
        status: result.status || 'Draft'
      }));

      // Cache juga ke offlineDb
      await offlineDb.surveyDrafts.put({
        id: String(result.survey_id),
        serverId: result.survey_id,
        userId: Number(user?.id || 0),
        noSurvey: result.no_survey || stepData.no_survey,
        status: result.status || 'Draft',
        data: stepData,
        syncStatus: 'synced',
        updatedAt: new Date().toISOString()
      });

      return result.survey_id;
    } catch (error) {
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        const localSaved = await offlineEngine.saveSurveyDraft({
          surveyId: surveyIdOverride,
          status: 'Draft',
          data: stepData,
          selectedProducts: (stepData.selectedProducts || []).map(code => ({ code, name: code })),
          schedules: stepData.schedules || [],
          userId: user?.id
        });
        setSurveyDraftId(localSaved.id);
        return localSaved.id;
      }
      alert(error.message);
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const savePersiapanDraft = async () => {
    if (isReadonlyClosed) return surveyDraftId || false;
    let targetSurveyId = surveyDraftId;
    if (!surveyDraftId) {
      const savedStepDataId = await saveStepDataDraft();
      if (!savedStepDataId) return false;
      targetSurveyId = savedStepDataId;
    }

    setIsSavingDraft(true);
    try {
      const items = (persiapanData.masterData || []).map(item => ({
        master_persiapan_id: item.id,
        label: item.label,
        jenis: item.jenis,
        ket_tambahan: item.ket_tambahan,
        is_custom: item.id > 100000,
        digunakan: Boolean(persiapanData.state?.[item.id]?.digunakan),
        qty: Number(persiapanData.state?.[item.id]?.qty || 0)
      }));

      if (!navigator.onLine) {
        await offlineEngine.saveSurveyPersiapan({
          surveyId: targetSurveyId,
          items,
          userId: user?.id
        });
        setSurveyDraftId(targetSurveyId);
        return targetSurveyId;
      }

      const response = await fetch(apiUrl(`survey-engine/product-drafts/${targetSurveyId}/persiapan`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Draft',
          items
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Gagal menyimpan draft persiapan');
      }

      setSurveyDraftId(targetSurveyId);
      return targetSurveyId;
    } catch (error) {
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        const items = (persiapanData.masterData || []).map(item => ({
          master_persiapan_id: item.id,
          label: item.label,
          jenis: item.jenis,
          ket_tambahan: item.ket_tambahan,
          is_custom: item.id > 100000,
          digunakan: Boolean(persiapanData.state?.[item.id]?.digunakan),
          qty: Number(persiapanData.state?.[item.id]?.qty || 0)
        }));
        await offlineEngine.saveSurveyPersiapan({
          surveyId: targetSurveyId,
          items,
          userId: user?.id
        });
        setSurveyDraftId(targetSurveyId);
        return targetSurveyId;
      }
      alert(error.message);
      return false;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const saveLapanganDraft = async (silent = false) => {
    if (isReadonlyClosed) return surveyDraftId || false;
    let targetSurveyId = surveyDraftId;
    if (!surveyDraftId) {
      if (!silent) {
        const savedStepDataId = await saveStepDataDraft();
        if (!savedStepDataId) return false;
        targetSurveyId = savedStepDataId;
      } else {
        return false;
      }
    }

    if (!silent) setIsSavingDraft(true);
    try {
      const lapPayload = {
        survey_id: targetSurveyId,
        status: 'Draft',
        schedules: lapanganData.actualSchedules || [],
        products: lapanganData.productProgress || []
      };

      if (!navigator.onLine) {
        await offlineEngine.saveSurveyLapangan({
          surveyId: targetSurveyId,
          payload: lapPayload,
          userId: user?.id
        });
        setSurveyDraftId(targetSurveyId);
        return true;
      }

      const response = await fetch(apiUrl('survey-engine/submit-lapangan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lapPayload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Gagal menyimpan draft lapangan');
      }

      const result = await response.json();
      setSurveyDraftId(result.survey_id || targetSurveyId);
      return true;
    } catch (error) {
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        const lapPayload = {
          survey_id: targetSurveyId,
          status: 'Draft',
          schedules: lapanganData.actualSchedules || [],
          products: lapanganData.productProgress || []
        };
        await offlineEngine.saveSurveyLapangan({
          surveyId: targetSurveyId,
          payload: lapPayload,
          userId: user?.id
        });
        setSurveyDraftId(targetSurveyId);
        return true;
      }
      if (!silent) alert(error.message);
      return false;
    } finally {
      if (!silent) setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    if (!isLastVisibleStep && nextVisibleStep) {
      if (isReadonlyClosed) {
        setCurrentStep(nextVisibleStep);
        return;
      }
      if (currentStep === 1) {
        if (!stepData.nama_client) {
          alert('Data Client / Perusahaan wajib diisi terlebih dahulu sebelum melanjutkan!');
          return;
        }
        if (hasAccessForStep(1)) {
          const savedId = await saveStepDataDraft();
          if (!savedId) return;
        }
      }
      if (currentStep === 2) {
        if (hasAccessForStep(2)) {
          const saved = await savePersiapanDraft();
          if (!saved) return;
        }
        if (editId && checkDataComplete(stepData)) {
          // If complete, try to set to Open automatically when progressing to Step 3
          await saveStepDataDraft('Submit');
        }
      }
      if (currentStep === 3) {
        if (hasAccessForStep(3)) {
          const saved = await saveLapanganDraft();
          if (!saved) return;
        }
      }
      setCurrentStep(nextVisibleStep);
    }
  };

  const handlePrev = async () => {
    if (!isFirstVisibleStep && prevVisibleStep) {
      if (isReadonlyClosed) {
        setCurrentStep(prevVisibleStep);
        return;
      }
      if (currentStep === 1) {
        const savedId = await saveStepDataDraft();
        if (!savedId) return;
      }
      if (currentStep === 2) {
        const saved = await savePersiapanDraft();
        if (!saved) return;
      }
      if (currentStep === 3) {
        const saved = await saveLapanganDraft();
        if (!saved) return;
      }
      setCurrentStep(prevVisibleStep);
    }
  };

  const handleSaveDraftManual = async () => {
    if (isReadonlyClosed) return;
    if (currentStep === 1) {
      if (!stepData.nama_client) {
        Swal.fire({
          icon: 'warning',
          title: 'Perhatian',
          text: 'Nama Client / Perusahaan wajib diisi untuk menyimpan draft.'
        });
        return;
      }
      const savedId = await saveStepDataDraft();
      if (savedId) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Disimpan',
          text: checkDataComplete(stepData)
            ? 'Data survey berhasil disimpan (Status: Open).'
            : 'Data survey berhasil disimpan sebagai Draft.',
          timer: 1800,
          showConfirmButton: false
        });
      }
    } else if (currentStep === 2) {
      const saved = await savePersiapanDraft();
      if (saved) {
        Swal.fire({
          icon: 'success',
          title: 'Draft Tersimpan',
          text: 'Data persiapan berhasil disimpan.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } else if (currentStep === 3) {
      const saved = await saveLapanganDraft();
      if (saved) {
        Swal.fire({
          icon: 'success',
          title: 'Draft Tersimpan',
          text: 'Data lapangan berhasil disimpan.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    }
  };

  // Auto-save untuk StepLapangan (Step 3)
  useEffect(() => {
    if (currentStep === 3 && editId && hasAccessForStep(3)) {
      const timer = setTimeout(() => {
        saveLapanganDraft(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [lapanganData]);

  const renderStepContent = () => {
    if (currentStep === 5) {
      const reportHtml = generatePreviewHTML(stepData, lapanganData, null, reportPreviewScale);

      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Preview Laporan PDF</h2>
                  <p className="text-sm text-gray-500">Pratinjau laporan akhir berdasarkan data survey yang sudah tersimpan di form.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={() => exportToPDF(stepData, lapanganData)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-700"
                >
                  <Download className="h-4 w-4" />
                  Unduh / Export PDF
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm md:p-4">
            <div className="h-[760px] overflow-hidden rounded-xl border border-gray-200 bg-white">
              <iframe
                srcDoc={reportHtml}
                className="h-full w-full border-0"
                title="Preview Laporan Survey Product"
              />
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <StepData data={stepData} persiapanData={persiapanData} onChange={setStepData} readOnly={!hasAccessForStep(1)} />;
      case 2:
        return <StepPersiapan data={persiapanData} onChange={setPersiapanData} readOnly={!hasAccessForStep(2)} />;
      case 3:
        return <StepLapangan data={lapanganData} onChange={setLapanganData} stepData={stepData} readOnly={!hasAccessForStep(3)} />;
      case 4:
        return <StepSummary stepData={stepData} persiapanData={persiapanData} lapanganData={lapanganData} onChange={setStepData} readOnly={!hasAccessForStep(4)} />;
      default:
        return <StepData />;
    }
  };

  return (
    <MainLayout currentModule="Survey Product" hideMobileNav={true}>
      <div className="min-h-screen bg-gray-50/50 pb-28 sm:pb-24">
        {/* Header Bar */}
        <div className="bg-white border-b border-gray-200/80 sticky top-0 z-20 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 mb-4 sm:mb-6 shadow-xs backdrop-blur-md bg-white/95">
          <div className="flex items-center justify-between max-w-5xl mx-auto gap-2">
            <div className="flex items-center min-w-0">
              <button
                onClick={() => navigate('/survey-product')}
                className="mr-2 sm:mr-3 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
                title="Kembali ke Daftar Survey"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  {editId ? `Edit Survey (${stepData?.no_survey || 'Draft'})` : 'Input Survey Baru'}
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Lengkapi tahapan data, persiapan, lapangan, dan summary laporan</p>
                <span className="text-[11px] font-medium text-blue-600 sm:hidden">
                  Langkah {currentStepIndex + 1} dari {visibleSteps.length}: {visibleSteps[currentStepIndex]?.title}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => navigate('/survey-product')}
                className="px-2.5 sm:px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              >
                Daftar Survey
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Progress Bar / Steps (Mobile-Friendly Compact Stepper) */}
        <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl border border-gray-100 bg-white px-3 py-4 sm:px-12 sm:py-8 shadow-xs sm:shadow-sm">
          {/* Mobile Step Pills / Indicators */}
          <div className="flex sm:hidden items-center justify-between gap-1 overflow-x-auto no-scrollbar pb-1">
            {visibleSteps.map((step, idx) => {
              const isDone = currentStepIndex > idx;
              const isActive = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isReadonlyClosed || isDone || isActive) {
                      setCurrentStep(step.id);
                    }
                  }}
                  disabled={!isReadonlyClosed && !isDone && !isActive}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-xs font-semibold'
                      : isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-50 text-gray-400 border-gray-200 opacity-80'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isDone ? '✓' : step.id}
                  </span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Classic Stepper */}
          <div className="hidden sm:block">
            <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
              {/* Connecting Line Background */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gray-100 rounded-full"></div>
              {/* Connecting Line Active */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-blue-600 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${visibleSteps.length > 1 && currentStepIndex >= 0 ? (currentStepIndex / (visibleSteps.length - 1)) * 100 : 0}%` }}
              ></div>

              {visibleSteps.map((step) => {
                const stepIndex = visibleSteps.findIndex(item => item.id === step.id);
                const isDone = currentStepIndex > stepIndex;
                const isActive = currentStep === step.id;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isReadonlyClosed || isDone || isActive) {
                          setCurrentStep(step.id);
                        }
                      }}
                      className={`flex items-center justify-center w-11 h-11 rounded-full text-sm font-semibold transition-all duration-300 ring-[6px] ring-white
                        ${isDone
                          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer'
                          : isActive
                            ? 'bg-blue-50 text-blue-700 border-[2px] border-blue-600 shadow-sm'
                            : 'bg-white text-gray-400 border-[2px] border-gray-200 cursor-default'
                        }
                      `}
                    >
                      {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : step.id}
                    </button>
                    <span
                      className={`absolute -bottom-7 whitespace-nowrap text-xs font-medium transition-colors duration-300
                        ${isActive ? 'text-blue-700 font-bold' : isDone ? 'text-gray-800' : 'text-gray-400'}
                      `}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-2"></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {isLoadingDraft ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
              Memuat data survey product...
            </div>
          ) : (
            <div className={`${!hasAccessForStep(currentStep) && !isReadonlyClosed ? 'pointer-events-none opacity-80' : ''} relative`}>
              {!hasAccessForStep(currentStep) && currentStep !== 5 && !isReadonlyClosed && (
                <div className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-8 z-50">
                  <div className="px-4 py-2 rounded-lg shadow border font-medium text-sm bg-white border-red-200 text-red-600">
                    Anda tidak memiliki akses untuk mengubah bagian ini.
                  </div>
                </div>
              )}
              {renderStepContent()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Navigation Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-3 py-2.5 sm:px-6 sm:py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Tombol Kembali */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstVisibleStep}
            className={`px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center transition-colors shrink-0 ${
              isFirstVisibleStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-1.5" />
            <span>Kembali</span>
          </button>

          {/* Group Tombol Aksi Kanan */}
          <div className="flex items-center gap-2 grow sm:grow-0 justify-end">
            {!isReadonlyClosed && (
              <button
                type="button"
                onClick={handleSaveDraftManual}
                disabled={isSavingDraft || isLoadingDraft}
                className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center transition-colors shadow-2xs shrink-0"
              >
                {isSavingDraft ? 'Menyimpan...' : 'Simpan Draft'}
              </button>
            )}

            {!isLastVisibleStep ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSavingDraft || isLoadingDraft}
                className="px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center transition-all shadow-sm shrink-0"
              >
                <span>{isReadonlyClosed ? 'Lanjut' : (isSavingDraft ? 'Menyimpan...' : 'Lanjut')}</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              !isReadonlyClosed && (
                <button
                  onClick={async () => {
                  if (!editId && currentStep === 2 && hasPersiapanPerm) {
                    const savedSurveyId = await savePersiapanDraft();
                    if (!savedSurveyId) return;
                    await saveStepDataDraft('Submit', savedSurveyId);
                    const isComplete = checkDataComplete(stepData);
                    Swal.fire({
                      icon: 'success',
                      title: 'Berhasil Disimpan',
                      text: isComplete
                        ? 'Survey berhasil disimpan dan berstatus Open!'
                        : 'Survey berhasil disimpan sebagai Draft karena data belum lengkap.'
                    });
                    navigate('/survey-product');
                  } else if (editId && currentStep === 3 && hasLapPerm) {
                    await saveLapanganDraft();
                    await saveStepDataDraft('Submit');
                    const isComplete = checkDataComplete(stepData);
                    Swal.fire({
                      icon: 'success',
                      title: 'Berhasil Disimpan',
                      text: isComplete
                        ? 'Survey berhasil disimpan!'
                        : 'Survey berhasil disimpan sebagai Draft karena data belum lengkap.'
                    });
                    navigate('/survey-product');
                  } else if (editId && currentStep === 4 && hasSummaryPerm) {
                    if (!canSaveFinal) {
                      Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Hanya Leader Surveyor atau Admin yang dapat menyimpan (menyelesaikan) survey ini.' });
                      return;
                    }
                    
                    const result = await Swal.fire({
                      title: 'Apakah Anda Yakin Menyelesaikan Survey Ini?',
                      text: 'Jika ya, Anda dan anggota lainnya tidak dapat merubahnya kembali.',
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonColor: '#3085d6',
                      cancelButtonColor: '#d33',
                      confirmButtonText: 'Ya, Selesaikan!',
                      cancelButtonText: 'Batal'
                    });

                    if (result.isConfirmed) {
                      await saveStepDataDraft(isAdmin ? 'Closed' : 'Completed');
                      Swal.fire('Berhasil!', 'Survey berhasil diselesaikan!', 'success');
                      navigate('/survey-product');
                    }
                  }
                }}
                disabled={isSavingDraft || (!editId && !hasPersiapanPerm) || (editId && currentStep === 3 && !hasLapPerm) || (editId && currentStep === 4 && (!hasSummaryPerm || !canSaveFinal))}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-sm shrink-0 ${
                  (!editId && !hasPersiapanPerm) || (editId && currentStep === 3 && !hasLapPerm) || (editId && currentStep === 4 && (!hasSummaryPerm || !canSaveFinal)) ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                }`}
                title={editId && currentStep === 4 && !canSaveFinal ? "Hanya Leader Surveyor yang dapat menyimpan data" : ""}
              >
                <span>{isSavingDraft ? 'Menyimpan...' : 'Selesaikan'}</span>
                <Check className="w-4 h-4 ml-1" />
              </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
  );
}
