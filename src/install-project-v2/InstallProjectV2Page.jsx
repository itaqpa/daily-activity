import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layouts/TopBar';
import ProjectView from './components/ProjectView';
import ProjectDetailView from './components/ProjectDetailView';
import MasterDataView from './components/MasterDataView';
import './aqpa-cyber.css';

export default function InstallProjectV2Page() {
  const { user, hasPermission } = useAuth();
  const perms = {
    canView: hasPermission('install_project_view'),
    canCreate: hasPermission('install_project_create'),
    canEdit: hasPermission('install_project_edit'),
    canDelete: hasPermission('install_project_delete'),
    canExport: hasPermission('install_project_export') || hasPermission('laporan_project_export'),
    canProgress: hasPermission('install_project_progress'),
    canDailyCreate: hasPermission('daily_progress_create') || hasPermission('install_project_edit'),
    canDailyEdit: hasPermission('daily_progress_edit') || hasPermission('install_project_edit'),
    canDailyDelete: hasPermission('daily_progress_delete') || hasPermission('install_project_delete'),
  };
  const actorName = user?.nama || user?.name || user?.username || user?.email || 'User';
  const saveTimersRef = useRef({});
  const [activeMenu, setActiveMenu] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(() => {
    try {
      return localStorage.getItem('install_v2_active_id') || '';
    } catch {
      return '';
    }
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [master, setMaster] = useState(null);
  const [daysByProj, setDaysByProj] = useState({});
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('install_v2_theme');
      return saved ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('install_v2_theme', dark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [dark]);

  const handleSelectProject = useCallback((id) => {
    setActiveId(id);
    try {
      localStorage.setItem('install_v2_active_id', id || '');
    } catch {
      // ignore
    }
  }, []);

  const fetchProjects = useCallback(async (preferId) => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/install-project-v2/projects');
      if (res.ok) {
        const list = await res.json();
        setProjects(list);
        if (preferId) {
          handleSelectProject(preferId);
        } else if (list.length > 0) {
          setActiveId((prev) => {
            const exists = list.some((p) => p.id === prev);
            const next = exists ? prev : list[0].id;
            try {
              localStorage.setItem('install_v2_active_id', next);
            } catch {
              // ignore
            }
            return next;
          });
        } else {
          handleSelectProject('');
        }
      }
    } catch (err) {
      console.error('Fetch install_v2 projects error:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [handleSelectProject]);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/install-project-v2/projects/${encodeURIComponent(activeId)}/days`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setDaysByProj((prev) => ({ ...prev, [activeId]: d })))
      .catch(() => {});
  }, [activeId]);

  const handleSaveDay = useCallback((pid, date, dayObj) => {
    setDaysByProj((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [date]: dayObj }
    }));
    const key = `${pid}:${date}`;
    if (saveTimersRef.current[key]) {
      clearTimeout(saveTimersRef.current[key]);
    }
    saveTimersRef.current[key] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(pid)}/days/${encodeURIComponent(date)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dayObj, actor_name: actorName })
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('Gagal menyimpan data harian:', res.status, errText);
        }
      } catch (err) {
        console.error('Error menyimpan data harian:', err);
      }
    }, 1500);
    return true;
  }, [actorName]);

  useEffect(() => {
    fetchProjects();
    fetch('/api/install-project-v2/master')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => { if (m) setMaster(m); })
      .catch(() => {});
  }, [fetchProjects]);

  const activeProject = projects.find((p) => p.id === activeId) || null;

  return (
    <div
      className={`aqpa-v2 min-h-screen flex flex-col relative transition-colors duration-300 ${
        dark ? '' : 'aqpa-light'
      }`}
    >
      {/* Shared App TopBar (Module Switcher, Dark Mode Toggle, Profile & Role Switcher) */}
      <TopBar
        currentModule="Installation Project"
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        showOnMobile
        paddingClass="px-3 sm:px-12"
      />

      {/* Main Content (Pure HTML concept: no sidebar, full-width) */}
      <main className="aqpa-main flex-1">
        {!perms.canView ? (
          <div className={`rounded-xl border p-8 text-center ${dark ? 'bg-[#0d1520] border-[#1e3a5a] text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
            <p className="font-mono text-sm font-bold text-rose-400">Akses Ditolak</p>
            <p className="text-xs mt-1">Anda tidak memiliki izin untuk melihat modul Installation Project.</p>
          </div>
        ) : activeMenu === 'projects' || (!activeProject && activeMenu !== 'master') ? (
          <ProjectView
            dark={dark}
            projects={projects}
            activeId={activeId}
            loading={loadingProjects}
            perms={perms}
            onSelectProject={handleSelectProject}
            onOpenDetail={(id) => {
              handleSelectProject(id);
              const target = projects.find((x) => x.id === id);
              setActiveMenu(target?.status === 'registered' ? 'plan' : 'ringkasan');
            }}
            onNavigate={(menu) => setActiveMenu(menu)}
            onRefresh={fetchProjects}
          />
        ) : activeMenu === 'master' && perms.canEdit ? (
          <div className="space-y-4">
            <div
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                dark ? 'bg-[#0d1520] border-[#1e3a5a]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveMenu('projects')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border cursor-pointer ${
                  dark ? 'border-[#1e3a5a] text-slate-300 hover:border-cyan-400 hover:text-cyan-300' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Daftar Project</span>
              </button>
              <span className={dark ? 'text-[#1e3a5a]' : 'text-slate-300'}>|</span>
              <span className={`font-mono text-xs font-bold tracking-wider uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                MASTER DATA
              </span>
            </div>
            <MasterDataView
              dark={dark}
              master={master}
              onUpdateMaster={setMaster}
            />
          </div>
        ) : (
          <ProjectDetailView
            dark={dark}
            project={activeProject}
            master={master}
            days={daysByProj[activeProject.id] || {}}
            activeTab={activeMenu}
            perms={perms}
            onTabChange={setActiveMenu}
            onBack={() => setActiveMenu('projects')}
            onUpdateProject={(updated) => {
              setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            }}
            onSaveDay={handleSaveDay}
          />
        )}
      </main>
    </div>
  );
}
