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
        setPersiapanData(prev => ({
          ...prev,
          state: {
            ...prev.state,
            ...(result.persiapan?.state || {})
          }
        }));
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

  const handlePrev = () => {
    if (currentStep > 1) {
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
        return <StepLapangan data={lapanganData} onChange={setLapanganData} />;
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
                <h1 className="text-xl font-bold text-gray-900">{editId ? 'Edit Survey Product' : 'Buat Survey Product'}</h1>
                <p className="text-sm text-gray-500">Lengkapi data survey langkah demi langkah</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/survey-product')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Progress Bar / Steps */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white px-4 py-5 shadow-sm sm:px-8">
          <div className="relative grid grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-gray-200"></div>
            <div
              className="absolute left-[12.5%] top-5 h-1 rounded-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 75}%` }}
            ></div>

            {STEPS.map((step) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
              <div key={step.id} className="relative z-10 flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-all duration-300 ${
                    isDone
                      ? 'border-blue-600 bg-blue-600 text-white shadow-blue-100'
                      : isActive
                      ? 'border-blue-600 bg-white text-blue-700 ring-4 ring-blue-50'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span
                  className={`mt-3 max-w-full truncate text-xs font-semibold ${
                    isDone || isActive ? 'text-blue-700' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
                {isActive && (
                  <span className="mt-1 h-1 w-6 rounded-full bg-blue-600"></span>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {isLoadingDraft ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
              Memuat data survey product...
            </div>
          ) : renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center border-t border-gray-200 pt-6">
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
