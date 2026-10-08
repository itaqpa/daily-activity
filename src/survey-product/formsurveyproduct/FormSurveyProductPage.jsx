import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';

import StepData from '../components/StepData';
import StepPersiapan from '../components/StepPersiapan';
import StepLapangan from '../components/StepLapangan';
import StepSummary from '../components/StepSummary';

const STEPS = [
  { id: 1, title: 'Data' },
  { id: 2, title: 'Persiapan' },
  { id: 3, title: 'Lapangan' },
  { id: 4, title: 'Summary' }
];

export default function FormSurveyProductPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
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
        return <StepData />;
      case 2:
        return <StepPersiapan />;
      case 3:
        return <StepLapangan />;
      case 4:
        return <StepSummary />;
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
                <h1 className="text-xl font-bold text-gray-900">Buat Survey Product</h1>
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
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>

            {STEPS.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 ${
                    currentStep > step.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : currentStep === step.id
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
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
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center transition-colors shadow-sm"
            >
              Selanjutnya
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
