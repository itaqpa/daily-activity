import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Truck, 
  Calendar, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  User,
  ArrowLeft,
  Search,
  MapPin,
  ShieldCheck,
  LogOut,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DriverTaskCard from './components/DriverTaskCard';
import ModalProofDelivery from './components/ModalProofDelivery';
import ModalLaporkanKendala from './components/ModalLaporkanKendala';
import DriverBottomNav from './components/DriverBottomNav';
import DriverHomeSection from './components/DriverHomeSection';
import DateFilterCard from './components/DateFilterCard';
import DriverReportSection from './components/DriverReportSection';
import { logisticApi } from '../services/logisticApi';
import { useAuth } from '../../context/AuthContext';

export default function DriverAppPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeNav, setActiveNav] = useState('home'); // 'home' | 'tasks' | 'add' | 'reports' | 'profile'
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [filterType, setFilterType] = useState('all');  // 'all' | 'delivery' | 'pickup'
  const [filterPeriod, setFilterPeriod] = useState('daily'); // 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);
  const [selectedTaskForIssue, setSelectedTaskForIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [driverProfile, setDriverProfile] = useState(null);

  // Ambil data user dari cache/session
  const currentUser = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : { name: 'ABDUL KARIM', role: 'Driver' };
    } catch {
      return { name: 'ABDUL KARIM', role: 'Driver' };
    }
  }, []);

  // Data State Tasks dari Database PostgreSQL
  const [tasks, setTasks] = useState([]);

  // Fetch Driver Profile
  const fetchProfile = useCallback(async () => {
    try {
      let p;
      try {
        p = await logisticApi.getDriverProfile({ user_name: currentUser.name });
      } catch {
        // Fallback default jika nama user (misal: Super Admin) bukan sopir terdaftar
        p = await logisticApi.getDriverProfile();
      }
      setDriverProfile(p);
      return p;
    } catch (err) {
      console.warn('Gagal memuat profil driver:', err);
      return null;
    }
  }, [currentUser.name]);

  // Fetch Tasks dari Server Database
  const fetchTasks = useCallback(async (driverId) => {
    setIsLoading(true);
    try {
      const params = { period: 'all' };
      if (driverId) params.driver_id = driverId;
      const data = await logisticApi.getDriverTasks(params);
      setTasks(data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar tugas dari server:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchProfile().then(p => {
      if (isMounted) {
        fetchTasks(p?.id);
      }
    });
    return () => { isMounted = false; };
  }, [fetchProfile, fetchTasks]);

  // Update Status Perjalanan Riil ke Backend
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await logisticApi.updateTaskStatus(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: newStatus };
        }
        return t;
      }));
    } catch (err) {
      console.error('Gagal update status:', err);
      alert('Gagal memperbarui status ke server: ' + err.message);
    }
  };

  // Submit Bukti Serah Terima (POD) Riil ke Backend
  const handleSubmitProof = async (proofData) => {
    try {
      await logisticApi.updateTaskStatus(proofData.task_id, {
        status: 'delivered',
        completed_odometer: proofData.completed_odometer,
        receiver_name: proofData.receiver_name,
        receiver_phone: proofData.receiver_phone,
        proof_attachment_id: null
      });

      setTasks(prev => prev.map(t => {
        if (t.id === proofData.task_id) {
          return { 
            ...t, 
            status: 'delivered',
            completed_odometer: proofData.completed_odometer,
            completed_at: new Date().toISOString()
          };
        }
        return t;
      }));
      alert('Bukti serah terima berhasil disimpan di database server!');
    } catch (err) {
      console.error('Error simpan POD:', err);
      alert('Gagal menyimpan POD: ' + err.message);
    }
  };

  // Submit Laporan Kendala Riil ke Backend
  const handleSubmitIssue = async (issueData) => {
    try {
      await logisticApi.updateTaskStatus(issueData.task_id, {
        status: 'failed',
        failure_reason: issueData.issue_note
      });

      setTasks(prev => prev.map(t => {
        if (t.id === issueData.task_id) {
          return { ...t, status: 'failed', failure_reason: issueData.issue_note };
        }
        return t;
      }));
      alert('Laporan kendala berhasil disimpan dan diteruskan ke SPV.');
    } catch (err) {
      console.error('Error laporkan kendala:', err);
      alert('Gagal melaporkan kendala: ' + err.message);
    }
  };

  // Filter Tasks berdasarkan Tab, Tipe Kirim/Jemput, dan Filter Tanggal
  const filteredTasks = tasks.filter(t => {
    // 1. Filter Tab (Tugas Aktif vs Riwayat Selesai)
    if (activeTab === 'today') {
      if (t.status === 'delivered') return false; // tugas selesai masuk riwayat
    } else {
      if (t.status !== 'delivered' && t.status !== 'failed') return false;
    }

    // 2. Filter Tipe (Semua vs Delivery vs Pickup)
    if (filterType !== 'all' && t.task_type !== filterType) return false;

    // 3. Filter Tanggal Penugasan (Harian, Mingguan, Bulanan, Tahunan)
    if (filterPeriod !== 'all' && t.dispatch_date) {
      const taskDateStr = typeof t.dispatch_date === 'string' ? t.dispatch_date.slice(0, 10) : new Date(t.dispatch_date).toISOString().slice(0, 10);
      const taskDate = new Date(taskDateStr);
      const selDate = new Date(selectedDate);

      if (filterPeriod === 'daily') {
        if (taskDateStr !== selectedDate) return false;
      } else if (filterPeriod === 'weekly') {
        const day = selDate.getDay() || 7;
        const startOfWeek = new Date(selDate);
        startOfWeek.setDate(selDate.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        if (taskDate < startOfWeek || taskDate > endOfWeek) return false;
      } else if (filterPeriod === 'monthly') {
        if (
          taskDate.getFullYear() !== selDate.getFullYear() || 
          taskDate.getMonth() !== selDate.getMonth()
        ) {
          return false;
        }
      } else if (filterPeriod === 'yearly') {
        if (taskDate.getFullYear() !== selDate.getFullYear()) {
          return false;
        }
      }
    }

    return true;
  });

  const activeCount = tasks.filter(t => t.status !== 'delivered' && t.status !== 'failed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-16">
      {/* Top Mobile Bar - Tema Terang */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/portal')}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <h1 className="text-sm font-bold text-slate-900 tracking-wide">AQPA DRIVER APP</h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                {driverProfile?.name || currentUser.name} ({driverProfile?.driver_code || 'DRV-001'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTasks(driverProfile?.id)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {activeCount} Aktif
            </span>
          </div>
        </div>
      </header>

      {/* Daftar Tugas Driver / Main View */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 flex-1 space-y-4 pb-20">
        {activeNav === 'home' && (
          <DriverHomeSection
            currentUser={currentUser}
            driverProfile={driverProfile}
            tasks={tasks}
            onNavigateTasks={() => setActiveNav('tasks')}
            onOpenTaskDetail={(t) => setSelectedTaskForProof(t)}
            onRefreshTasks={() => fetchTasks(driverProfile?.id)}
          />
        )}

        {activeNav === 'reports' && (
          <DriverReportSection 
            currentUser={currentUser} 
            driverProfile={driverProfile}
          />
        )}

        {activeNav === 'profile' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                {(driverProfile?.name || currentUser.name)?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{driverProfile?.name || currentUser.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {driverProfile?.driver_code || 'DRV-001'} • {driverProfile?.division || 'Divisi Driver'}
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {driverProfile?.license_type || 'SIM B1 Umum'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Armada Bawaan</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {driverProfile?.assigned_vehicle_name || 'GRANDMAX PUTIH'} ({driverProfile?.assigned_vehicle_plate || 'B 1442 KYI'})
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                  Rasio BBM: {driverProfile?.fuel_ratio_km_per_liter || '12'} KM / Liter
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button 
                onClick={() => navigate('/portal')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Portal Modul</span>
              </button>

              <button 
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin keluar dari akun ini (Logout)?')) {
                    if (typeof logout === 'function') {
                      logout();
                    } else {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                    }
                    navigate('/login', { replace: true });
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout (Keluar Akun)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Daftar Tugas Driver */}
        {activeNav === 'tasks' && (
          <>
            {/* Filter Tanggal Penugasan Card */}
            <DateFilterCard
              filterPeriod={filterPeriod}
              setFilterPeriod={setFilterPeriod}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              totalTasksCount={filteredTasks.length}
            />

            {/* Tab Navigasi & Filter Jenis Pengiriman */}
            <div className="flex flex-col gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'today'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tugas Aktif ({activeCount})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'history'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Riwayat Selesai
                </button>
              </div>

              {/* Filter Tipe: Semua | Pengiriman | Penjemputan */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterType === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Jenis
                </button>
                <button
                  onClick={() => setFilterType('delivery')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterType === 'delivery'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Delivery (Kirim)
                </button>
                <button
                  onClick={() => setFilterType('pickup')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterType === 'pickup'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pickup (Jemput)
                </button>
              </div>
            </div>

            {/* List Tugas Driver */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Memuat tugas dari database...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <DriverTaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={handleUpdateStatus}
                    onReportIssue={(t) => setSelectedTaskForIssue(t)}
                    onCompleteTask={(t) => setSelectedTaskForProof(t)}
                  />
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Tidak Ada Tugas</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {filterPeriod === 'all' 
                      ? 'Belum ada jadwal penugasan dari SPV Logistik.' 
                      : `Tidak ada tugas pada filter ${filterPeriod} untuk tanggal ${selectedDate}.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal Proof of Delivery / Serah Terima */}
      <ModalProofDelivery
        isOpen={!!selectedTaskForProof}
        onClose={() => setSelectedTaskForProof(null)}
        task={selectedTaskForProof}
        onSubmit={handleSubmitProof}
      />

      {/* Modal Laporkan Kendala Lapangan */}
      <ModalLaporkanKendala
        isOpen={!!selectedTaskForIssue}
        onClose={() => setSelectedTaskForIssue(null)}
        task={selectedTaskForIssue}
        onSubmit={handleSubmitIssue}
      />

      {/* Bottom Navigation Bar */}
      <DriverBottomNav
        activeNav={activeNav}
        onNavChange={(nav) => setActiveNav(nav)}
        activeTasksCount={activeCount}
      />
    </div>
  );
}
