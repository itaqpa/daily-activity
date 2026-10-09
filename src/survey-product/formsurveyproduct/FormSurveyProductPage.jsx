import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Download, FileText } from 'lucide-react';
import { apiUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { exportToPDF, generatePreviewHTML } from '../utils/pdfExport';

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

  const visibleSteps = editId 
    ? (isReadonlyClosed ? ALL_STEPS : (checkOnProgress(lapanganData) ? ALL_STEPS.slice(0, 4) : ALL_STEPS.slice(0, 3)))
    : ALL_STEPS.slice(0, 2);

  const resolveStepFromParam = (stepParam) => {
    if (stepParam === 'data') return 1;
    if (stepParam === 'persiapan' || stepParam === 'preparation') return 2;
    if (stepParam === 'lapangan' || stepParam === 'field') return 3;
    if (stepParam === 'summary' || stepParam === 'resume') return 4;
    if (stepParam === 'laporan' || stepParam === 'report') return 5;
    const stepNumber = Number(stepParam);
    return Number.isInteger(stepNumber) ? stepNumber : null;
  };

  const checkDataComplete = (data, silent = false) => {
    const checks = {
      nama_client: !!data.nama_client,
      leader_surveyor: !!(data.leader_surveyor && data.leader_surveyor.length > 0),
      anggota_surveyor: !!(data.anggota_surveyor && data.anggota_surveyor.length > 0),
      plant_area: !!data.plant_area,
      nama_marketing: !!data.nama_marketing,
      selectedProducts: !!(data.selectedProducts && data.selectedProducts.length > 0),
      schedules: !!(data.schedules && data.schedules.length > 0 && data.schedules.some(s => s.hari || s.tanggal || s.rencana_area || s.target_item))
    };
    const isComplete = Object.values(checks).every(Boolean);
    if (!isComplete && !silent) {
       alert('Belum Open karena data belum lengkap:\n' + JSON.stringify(checks, null, 2));
    }
    return isComplete;
  };

  useEffect(() => {
    const fetchDraft = async () => {
      if (!editId) {
        setIsLoadingDraft(false);
        return;
      }

      setIsLoadingDraft(true);
      try {
        const response = await fetch(apiUrl(`survey-engine/product-drafts/${editId}`));
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Gagal mengambil data survey product');
        }

        setSurveyDraftId(result.survey_id);
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
      
      const isDataComplete = checkDataComplete(stepData, forceStatus !== 'Submit');
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

      const finalStatus = calculatedStatus;

      const response = await fetch(apiUrl('survey-engine/product-drafts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: surveyIdOverride,
          status: (forceStatus && forceStatus !== 'Submit') ? forceStatus : finalStatus,
          data: stepData,
          selected_products: selectedProducts,
          schedules: stepData.schedules || []
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan draft survey product');
      }

      setSurveyDraftId(result.survey_id);
      setStepData(prev => ({
        ...prev,
        no_survey: result.no_survey || prev.no_survey,
        status: result.status || 'Draft'
      }));
      return result.survey_id;
    } catch (error) {
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

      const response = await fetch(apiUrl(`survey-engine/product-drafts/${targetSurveyId}/persiapan`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Draft',
          items
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan draft persiapan');
      }
      setSurveyDraftId(targetSurveyId);
      return targetSurveyId;
    } catch (error) {
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
      const response = await fetch(apiUrl('survey-engine/submit-lapangan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: targetSurveyId,
          status: 'Draft',
          schedules: lapanganData.actualSchedules || [],
          products: lapanganData.productProgress || []
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan draft lapangan');
      }

      setSurveyDraftId(result.survey_id || targetSurveyId);
      return true;
    } catch (error) {
      if (!silent) alert(error.message);
      return false;
    } finally {
      if (!silent) setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < visibleSteps.length) {
      if (isReadonlyClosed) {
        setCurrentStep((prev) => prev + 1);
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
        if (editId && checkDataComplete(stepData, true)) {
          // Silent evaluation: if complete, try to set to Open automatically when progressing to Step 3
          await saveStepDataDraft('Submit');
        }
      }
      if (currentStep === 3) {
        if (hasAccessForStep(3)) {
          const saved = await saveLapanganDraft();
          if (!saved) return;
        }
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = async () => {
    if (currentStep > 1) {
      if (isReadonlyClosed) {
        setCurrentStep((prev) => prev - 1);
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
      setCurrentStep((prev) => prev - 1);
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
        return <StepData data={stepData} onChange={setStepData} readOnly={!hasAccessForStep(1)} />;
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/survey-product')}
                className="mr-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Survey Product</h1>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/survey-product')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Progress Bar / Steps */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white px-4 py-8 shadow-sm sm:px-12 sm:py-10">
          <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
            {/* Connecting Line Background */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gray-100 rounded-full"></div>
            {/* Connecting Line Active */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-blue-600 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (visibleSteps.length - 1)) * 100}%` }}
            ></div>

            {visibleSteps.map((step) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold transition-all duration-300 ring-[8px] ring-white
                      ${isDone
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isActive
                          ? 'bg-blue-50 text-blue-700 border-[2px] border-blue-600 shadow-sm'
                          : 'bg-white text-gray-400 border-[2px] border-gray-200'
                      }
                    `}
                  >
                    {isDone ? <Check className="w-6 h-6 stroke-[3]" /> : step.id}
                  </div>
                  <span
                    className={`absolute -bottom-8 whitespace-nowrap text-sm font-medium transition-colors duration-300
                      ${isActive ? 'text-blue-700 font-semibold' : isDone ? 'text-gray-800' : 'text-gray-400'}
                    `}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-4"></div>
        </div>

        {/* Step Content */}
        <div className="mb-24">
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

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors ${currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            Kembali
          </button>

          {currentStep < visibleSteps.length ? (
            <button
              onClick={handleNext}
              disabled={isSavingDraft || isLoadingDraft}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center transition-colors shadow-sm"
            >
              {isReadonlyClosed ? 'Selanjutnya' : (isSavingDraft ? 'Menyimpan Draft...' : 'Selanjutnya')}
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
                  Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Survey berhasil disimpan!' });
                  navigate('/survey-product');
                } else if (editId && currentStep === 3 && hasLapPerm) {
                  await saveLapanganDraft();
                  await saveStepDataDraft('Submit');
                  Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Survey berhasil disimpan!' });
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
              className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm ${
                (!editId && !hasPersiapanPerm) || (editId && currentStep === 3 && !hasLapPerm) || (editId && currentStep === 4 && (!hasSummaryPerm || !canSaveFinal)) ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={editId && currentStep === 4 && !canSaveFinal ? "Hanya Leader Surveyor yang dapat menyimpan data" : ""}
            >
              {isSavingDraft ? 'Menyimpan...' : 'Simpan Survey'}
              <Check className="w-4 h-4 ml-1" />
            </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
