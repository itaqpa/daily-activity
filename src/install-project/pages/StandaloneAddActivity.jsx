import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';
import { apiUrl } from '../../api';
import MainLayout from '../../components/layouts/MainLayout';
import FormDailyInput from '../components/DailyProgress/FormDailyInput';
import { useAuth } from '../../context/AuthContext';
import { offlineEngine } from '../../offline/offlineEngine';

export default function StandaloneAddActivity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingProjectDetail, setIsLoadingProjectDetail] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        let activeProjects = [];
        try {
          const res = await fetch(apiUrl('/install-projects'));
          if (res.ok) {
            let data = await res.json();
            // Filter out closed projects
            activeProjects = data.filter(p => p.status?.toLowerCase() !== 'close' && p.status?.toLowerCase() !== 'closed' && p.status?.toLowerCase() !== 'done');
            await offlineEngine.cacheReference(`install_projects_active_${user?.id || 0}`, 'dinas_luar', activeProjects, user?.id);
          }
        } catch (netErr) {
          console.warn('Network error fetching projects, falling back to cache:', netErr);
          const cached = await offlineEngine.getReference(`install_projects_active_${user?.id || 0}`, user?.id);
          if (cached && Array.isArray(cached)) {
            activeProjects = cached;
          }
        }
          
        // Hanya Super Admin yang melihat semua project
        const isSuperAdmin = 
          Number(user?.jabatan_id) === 1 || 
          user?.role?.toLowerCase() === 'superadmin' ||
          user?.jabatan?.toLowerCase() === 'super admin' ||
          user?.jabatan_name?.toLowerCase() === 'super admin' ||
          user?.additional_roles_data?.some(r => Number(r.id) === 1);

        // Selain Super Admin, hanya tampilkan project yang dipimpinnya sendiri
        if (user && !isSuperAdmin) {
          const uId = Number(user.id);
          const uName = (user.name || '').trim().toLowerCase();
          const uUsername = (user.username || '').trim().toLowerCase();
          activeProjects = activeProjects.filter(p => {
            if (Number(p.created_by) === uId) return true;
            // Check leaders array (JSONB)
            if (Array.isArray(p.leaders) && p.leaders.length > 0) {
              const matched = p.leaders.some(l => {
                const lId = Number(l?.value || l?.id);
                const lName = (l?.label || l?.name || '').trim().toLowerCase();
                return (lId && lId === uId) || (lName && (lName === uName || lName === uUsername));
              });
              if (matched) return true;
            }
            // Check leader string (comma-separated or single)
            if (p.leader) {
              const leaderNames = String(p.leader).split(',').map(s => s.trim().toLowerCase());
              if (leaderNames.includes(uName) || (uUsername && leaderNames.includes(uUsername))) {
                return true;
              }
            }
            return false;
          });
        }
        
        setProjects(activeProjects);
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
        try {
          const res = await fetch(apiUrl(`/install-projects/${selectedProjectId}`));
          if (res.ok) {
            const data = await res.json();
            setProject(data);
            await offlineEngine.cacheReference(`project_detail_${selectedProjectId}`, 'dinas_luar', data, user?.id);
          }
        } catch (netErr) {
          console.warn('Network error fetching project detail, checking cache:', netErr);
          const cached = await offlineEngine.getReference(`project_detail_${selectedProjectId}`, user?.id);
          if (cached) {
            setProject(cached);
          }
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">Tambah Aktivitas Proyek</h1>
        
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
            project && <FormDailyInput onBack={() => navigate('/installation-project')} project={project} />
          )
        )}
      </div>
    </MainLayout>
  );
}
