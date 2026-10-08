import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Edit3, 
  RotateCw, 
  Printer, 
  Share2, 
  AlertCircle, 
  Loader2, 
  Home, 
  Layers, 
  ArrowLeft
} from 'lucide-react';
import { apiUrl } from '../../api';
import MainLayout from '../../components/layouts/MainLayout';
import DetailInstall from './DetailInstall';
import WizardModal from './WizardModal';
import { useAuth } from '../../context/AuthContext';

export default function ShowInstallPage({ id: propId, onBack, embedded = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const projectId = propId || params.id;

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { hasPermission } = useAuth();

  // Fetch single project data
  const fetchProjectData = async () => {
    if (!projectId) {
      setError('ID Project tidak ditemukan');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(apiUrl(`/install-projects/${projectId}`));
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else if (res.status === 404) {
        setError('Project instalasi tidak ditemukan.');
      } else {
        setError('Terjadi kesalahan saat memuat data project.');
      }
    } catch (err) {
      console.error('Error fetching project detail:', err);
      setError('Koneksi ke server gagal. Pastikan backend aktif.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/installation-project');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWizardSuccess = () => {
    setIsWizardOpen(false);
    fetchProjectData();
  };

  const content = (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Kembali ke Daftar Project"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>

          <div className="h-6 w-px bg-gray-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Link to="/installation-project" className="hover:text-blue-600 transition-colors">
                Installation Project
              </Link>
              <span>/</span>
              <span className="text-gray-700 font-semibold font-mono truncate max-w-[200px]">
                {project ? project.no_project : `ID #${projectId}`}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[280px] sm:max-w-md">
              {project ? project.nama : 'Detail Project'}
            </h2>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasPermission('install_project_view') && (
            <button
              onClick={fetchProjectData}
              disabled={isLoading}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Muat Ulang Data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          )}

          {hasPermission('install_project_export') && (
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Cetak Halaman"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cetak</span>
            </button>
          )}

          {hasPermission('install_project_edit') && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shadow-blue-500/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <div className="space-y-1">
            <h3 className="font-bold text-gray-800 text-base">Memuat Detail Project...</h3>
            <p className="text-xs text-gray-500">Mengambil data KPI, Kurva S, daerah, unit, scope, dan user terkait.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-gray-900 text-base">Gagal Memuat Project</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">{error}</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={fetchProjectData}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Main Detail Content Component */}
      {!isLoading && !error && project && (
        <DetailInstall 
          project={project} 
          onEdit={() => setIsWizardOpen(true)} 
        />
      )}

      {/* Wizard Modal for Editing Project */}
      {isWizardOpen && (
        <WizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={handleWizardSuccess}
          editId={project?.id || projectId}
        />
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <MainLayout>
      {content}
    </MainLayout>
  );
}
