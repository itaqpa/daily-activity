import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';
import { apiUrl } from '../../api';
import MainLayout from '../../components/layouts/MainLayout';
import FormCostProject from '../components/CostProject/FormCostProject';

export default function StandaloneAddCost() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingProjectDetail, setIsLoadingProjectDetail] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(apiUrl('/install-projects'));
        if (res.ok) {
          const data = await res.json();
          // Filter out closed projects
          const activeProjects = data.filter(p => p.status?.toLowerCase() !== 'close' && p.status?.toLowerCase() !== 'closed' && p.status?.toLowerCase() !== 'done');
          
          setProjects(activeProjects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setProject(null);
      return;
    }
    const fetchProjectDetail = async () => {
      setIsLoadingProjectDetail(true);
      try {
        const res = await fetch(apiUrl(`/install-projects/${selectedProjectId}`));
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error('Error fetching project detail:', err);
      } finally {
        setIsLoadingProjectDetail(false);
      }
    };
    fetchProjectDetail();
  }, [selectedProjectId]);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Tambah Pengeluaran Proyek</h1>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Project</label>
          {isLoadingProjects ? (
             <div className="flex items-center gap-2 text-gray-500">
               <Loader2 className="w-4 h-4 animate-spin" /> Memuat project...
             </div>
          ) : (
            <div className="w-full md:w-1/2">
              <Select
                options={projects.map(p => ({
                  value: p.id,
                  label: `${p.no_project} - ${p.nama || p.nama_project}`
                }))}
                value={projects.filter(p => p.id === selectedProjectId).map(p => ({
                  value: p.id,
                  label: `${p.no_project} - ${p.nama || p.nama_project}`
                }))[0]}
                onChange={(option) => setSelectedProjectId(option ? option.value : "")}
                placeholder="-- Ketik untuk mencari Project --"
                isClearable
                isSearchable
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderRadius: '0.75rem',
                    borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                    padding: '2px',
                    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                    '&:hover': {
                      borderColor: '#9ca3af'
                    }
                  })
                }}
              />
            </div>
          )}
        </div>

        {selectedProjectId && (
          isLoadingProjectDetail ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            project && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <FormCostProject 
                  project={project} 
                  onClose={() => navigate('/data-pengeluaran')} 
                  onSuccess={() => navigate('/data-pengeluaran')}
                  inline={true}
                />
              </div>
            )
          )
        )}
      </div>
    </MainLayout>
  );
}
