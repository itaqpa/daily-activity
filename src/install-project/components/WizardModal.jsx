import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Save, Loader2 } from 'lucide-react';
import { apiUrl } from '../../api';
import Step1ProjectDetails from './AddInstallationWizard/Step1ProjectDetails';
import Step2AreaUnit from './AddInstallationWizard/Step2AreaUnit';
import Step3UnitScopes from './AddInstallationWizard/Step3UnitScopes';
import Step4Summary from './AddInstallationWizard/Step4Summary';

export default function WizardModal({ isOpen, onClose, onSuccess, editId }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);

  React.useEffect(() => {
    if (editId && isOpen) {
      const fetchProjectDetails = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(apiUrl(`/install-projects/${editId}`));
          if (response.ok) {
            const data = await response.json();
            setProjectData({
              id: data.id,
              no_project: data.no_project || '',
              nama: data.nama || '',
              customer: data.customer || '',
              lokasi: data.lokasi || '',
              leader: data.leader || '',
              tgl_mulai: data.tgl_mulai || '',
              durasi_hari: data.durasi_hari || '',
              nilai_kontrak: data.nilai_kontrak || '',
              budget_biaya: data.budget_biaya || '',
              catatan: data.catatan || '',
              areas: data.areas || [],
              work_groups: data.work_groups || []
            });
            console.log("Fetched and set projectData:", data);
          } else {
            console.error("Gagal mengambil data project untuk edit.");
          }
        } catch (error) {
          console.error("Error fetching project:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjectDetails();
    } else {
      setProjectData({});
      setIsLoading(false);
      setCurrentStep(1);
    }
  }, [editId, isOpen]);

  if (!isOpen) return null;

  const totalSteps = 4;

  const countValidScopes = (data) => {
    let count = 0;
    (data.areas || []).forEach(a => {
      (a.units || []).forEach(u => {
        (u.scopes || []).forEach(s => {
          if (s.nama_scope && s.nama_scope.trim()) {
            count++;
          }
        });
      });
    });
    return count;
  };

  const submitToApi = async (status) => {
    if (!projectData.no_project || !projectData.no_project.trim()) {
      alert("No Project wajib diisi (kembali ke Step 1).");
      return false;
    }
    if (!projectData.nama || !projectData.nama.trim()) {
      alert("Nama Project wajib diisi (kembali ke Step 1).");
      return false;
    }

    let targetStatus = status;
    const validScopes = countValidScopes(projectData);

    if (status === 'registered') {
      if (validScopes === 0) {
        alert("Minimal 1 data Scope of work harus terisi untuk dapat meregistrasikan project (status tidak draft). Silakan kembali ke Step 3 untuk mengisi scope, atau pilih 'Simpan Draft'.");
        return false;
      }
      targetStatus = 'registered';
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...projectData,
        status: targetStatus // 'draft' atau 'registered'
      };

      const method = projectData.id ? 'PUT' : 'POST';
      const url = projectData.id ? apiUrl(`/install-projects/${projectData.id}`) : apiUrl('/install-projects');

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat menyimpan data');
      }

      // Simpan ID project ke state agar next step selalu PUT (update)
      if (result.projectId) {
        setProjectData(prev => ({ ...prev, id: result.projectId, status: targetStatus }));
      }
      
      return true; // Sukses
    } catch (err) {
      alert("Error: " + err.message);
      return false; // Gagal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      // Auto-save sebagai draft setiap klik Next
      const isSaved = await submitToApi('draft');
      if (isSaved) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = async () => {
    const isSaved = await submitToApi('draft');
    if (isSaved) {
      alert("Project berhasil disimpan sebagai draft!");
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleRegister = async () => {
    const validScopes = countValidScopes(projectData);
    if (validScopes === 0) {
      alert("Minimal 1 data Scope of work harus terisi untuk dapat meregistrasikan project (status Registered, bukan Draft). Silakan isi Scope di Step 3 terlebih dahulu, atau klik 'Simpan Draft'.");
      return;
    }

    const isSaved = await submitToApi('registered');
    if (isSaved) {
      alert("Project Berhasil di-Registrasi (Status: Registered)!");
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  // Stepper UI
  const renderStepper = () => {
    const steps = [
      { id: 1, label: 'Buat Project' },
      { id: 2, label: 'Registrasi Area & Manpower' },
      { id: 3, label: 'Rencana Kerja' },
      { id: 4, label: 'Review & Save' }
    ];

    return (
      <div className="flex items-center justify-between w-full mb-8 relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
        
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-300" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                isCompleted ? 'border-blue-600 bg-blue-50 text-blue-600' : 
                'border-gray-200 bg-white text-gray-400'
              }`}>
                {isCompleted ? '✓' : step.id}
              </div>
              <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[1074px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {currentStep === 4 ? 'Review & Save' : (editId ? 'Edit Installation Project' : 'Add Installation Project')}
              </h2>
              {currentStep === 4 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Periksa kembali seluruh informasi sebelum menyimpan project.
                </p>
              )}
            </div>
            {projectData.id && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium border border-gray-200">
                Draft ID: {projectData.id}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/30">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {renderStepper()}

              <div className="min-h-[300px]">
                {currentStep === 1 && <Step1ProjectDetails data={projectData} updateData={setProjectData} />}
                {currentStep === 2 && <Step2AreaUnit data={projectData} updateData={setProjectData} />}
                {currentStep === 3 && <Step3UnitScopes data={projectData} updateData={setProjectData} />}
                {currentStep === 4 && <Step4Summary data={projectData} onEditStep={setCurrentStep} />}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
          {currentStep === 4 ? (
            <>
              <button 
                onClick={handlePrev}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm shadow-sm"
              >
                Kembali
              </button>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50/80 rounded-xl font-semibold transition-colors text-sm shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Simpan Draft
                </button>
                
                <button 
                  onClick={handleRegister}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Project
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-blue-600 font-medium transition-colors disabled:opacity-50 text-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Draft & Close
              </button>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrev}
                  disabled={currentStep === 1 || isSubmitting}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                
                <button 
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Menyimpan...' : 'Next Step'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
