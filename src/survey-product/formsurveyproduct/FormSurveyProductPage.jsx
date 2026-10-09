import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { apiUrl } from '../../api';

import StepData, { createEmptyStepData, PRODUCT_LIST } from '../components/StepData';
import StepPersiapan, { createEmptyPersiapanData } from '../components/StepPersiapan';
import StepLapangan, { createEmptyLapanganData } from '../components/StepLapangan';
import StepSummary from '../components/StepSummary';

const STEPS = [
  { id: 1, title: 'Data' },
  { id: 2, title: 'Persiapan' },
  { id: 3, title: 'Lapangan' },
  { id: 4, title: 'Summary' }
];

export default function FormSurveyProductPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState(createEmptyStepData());
  const [persiapanData, setPersiapanData] = useState(createEmptyPersiapanData());
  const [lapanganData, setLapanganData] = useState(createEmptyLapanganData());
  const [surveyDraftId, setSurveyDraftId] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!editId);

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
      } catch (error) {
        alert(error.message);
        navigate('/survey-product');
      } finally {
        setIsLoadingDraft(false);
      }
    };

    fetchDraft();
  }, [editId, navigate]);

  const saveStepDataDraft = async () => {
    setIsSavingDraft(true);
    try {
      const selectedProducts = (stepData.selectedProducts || []).map(code => {
        const product = PRODUCT_LIST.find(item => item.code === code);
        return product || { code, name: code };
      });

      const response = await fetch(apiUrl('survey-engine/product-drafts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_id: surveyDraftId,
          status: 'Draft',
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
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const saveLapanganDraft = async () => {
    let targetSurveyId = surveyDraftId;
    if (!surveyDraftId) {
      const savedStepDataId = await saveStepDataDraft();
      if (!savedStepDataId) return false;
      targetSurveyId = savedStepDataId;
    }

    setIsSavingDraft(true);
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
      alert(error.message);
      return false;
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
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
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = async () => {
    if (currentStep > 1) {
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepData data={stepData} onChange={setStepData} />;
      case 2:
        return <StepPersiapan data={persiapanData} onChange={setPersiapanData} />;
      case 3:
        return <StepLapangan data={lapanganData} onChange={setLapanganData} stepData={stepData} />;
      case 4:
        return <StepSummary stepData={stepData} persiapanData={persiapanData} lapanganData={lapanganData} />;
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
                Profil
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
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>

            {STEPS.map((step) => {
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
          ) : renderStepContent()}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Kembali
          </button>
          
          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={isSavingDraft || isLoadingDraft}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center transition-colors shadow-sm"
            >
              {isSavingDraft ? 'Menyimpan Draft...' : 'Selanjutnya'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => {
                alert('Submit Survey Dummy!');
                navigate('/survey-product');
              }}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 flex items-center transition-colors shadow-sm"
            >
              Simpan Survey
              <Check className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
