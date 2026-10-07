import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../../components/layouts/MainLayout';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Download, 
  Briefcase, 
  DollarSign, 
  Layers, 
  RotateCw, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  HardHat,
  BadgePercent
} from 'lucide-react';
import { apiUrl } from '../../../api';
import Papa from 'papaparse';

export default function DataManpower() {
  const [manpowerList, setManpowerList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [positionsList, setPositionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosisi, setSelectedPosisi] = useState('ALL');
  const [selectedLingkup, setSelectedLingkup] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    posisi: 'Helper',
    rate_per_jam: '',
    project_id: ''
  });
  const [formError, setFormError] = useState('');

  // Fetch Manpower Data
  const fetchManpower = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(apiUrl('/manpower'));
      if (res.ok) {
        const data = await res.json();
        setManpowerList(data);
      } else {
        console.error('Gagal memuat data manpower');
      }
    } catch (err) {
      console.error('Error fetching manpower:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Projects (for project dropdown)
  const fetchProjects = async () => {
    try {
      const res = await fetch(apiUrl('/install-projects'));
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Fetch Positions
  const fetchPositions = async () => {
    try {
      const res = await fetch(apiUrl('/manpower/positions'));
      if (res.ok) {
        const data = await res.json();
        setPositionsList(data);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  };

  useEffect(() => {
    fetchManpower();
    fetchProjects();
    fetchPositions();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return manpowerList.filter((item) => {
      const matchSearch =
        item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.posisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.project_nama && item.project_nama.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPosisi = selectedPosisi === 'ALL' || item.posisi === selectedPosisi;

      const matchLingkup =
        selectedLingkup === 'ALL'
          ? true
          : selectedLingkup === 'PUBLIC'
          ? !item.project_id
          : Boolean(item.project_id);

      return matchSearch && matchPosisi && matchLingkup;
    });
  }, [manpowerList, searchTerm, selectedPosisi, selectedLingkup]);

  // Statistics
  const stats = useMemo(() => {
    const total = manpowerList.length;
    const publicCount = manpowerList.filter((m) => !m.project_id).length;
    const projectCount = total - publicCount;
    const avgRate =
      total > 0
        ? Math.round(manpowerList.reduce((acc, cur) => acc + parseFloat(cur.rate_per_jam || 0), 0) / total)
        : 0;
    return { total, publicCount, projectCount, avgRate };
  }, [manpowerList]);

  // Format Currency
  const formatRupiah = (val) => {
    return Math.round(parseFloat(val || 0)).toLocaleString('id-ID');
  };

  // Position Badge Styling
  const getPositionBadge = (posisi) => {
    const p = (posisi || '').toLowerCase();
    if (p.includes('welder')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (p.includes('teknisi')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (p.includes('helper')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (p.includes('foreman') || p.includes('lead')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (p.includes('supervisor')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      posisi: 'Helper',
      rate_per_jam: '35000',
      project_id: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama || '',
      posisi: item.posisi || 'Helper',
      rate_per_jam: String(Math.round(parseFloat(item.rate_per_jam || 0))),
      project_id: item.project_id ? String(item.project_id) : ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFormError('Nama manpower wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      const payload = {
        nama: formData.nama.trim(),
        posisi: formData.posisi.trim(),
        rate_per_jam: parseFloat(formData.rate_per_jam) || 0,
        project_id: formData.project_id ? parseInt(formData.project_id) : null
      };

      const url = editingId ? apiUrl(`/manpower/${editingId}`) : apiUrl('/manpower');
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan data');
      }

      setIsModalOpen(false);
      fetchManpower();
      fetchPositions();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Manpower
  const handleDelete = async (id) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(apiUrl(`/manpower/${id}`), { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchManpower();
      } else {
        alert('Gagal menghapus manpower');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (manpowerList.length === 0) {
      alert('Tidak ada data manpower untuk diekspor');
      return;
    }

    const csvData = manpowerList.map((m, idx) => ({
      No: idx + 1,
      'Nama Manpower': m.nama,
      Posisi: m.posisi,
      'Rate Per Jam (Rp)': Math.round(parseFloat(m.rate_per_jam || 0)),
      Lingkup: m.project_id ? `Khusus (${m.project_nama || 'Project #' + m.project_id})` : 'Public (Semua Project)'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_manpower_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 1. Header & Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                  Data Manpower
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                  Master data tenaga kerja lapangan, keahlian posisi, dan rate upah per jam
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs md:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 shadow-2xs"
              title="Download Data CSV"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchManpower}
              className="p-2 text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-2xs"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Manpower</span>
            </button>
          </div>
        </div>

        {/* 2. Mini KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs">
            <p className="text-xs text-gray-500 font-medium">Total Manpower</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{stats.total}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Tenaga kerja terdaftar</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs">
            <p className="text-xs text-gray-500 font-medium">Public (Semua Project)</p>
            <p className="text-2xl font-bold tracking-tight text-blue-600 mt-1">{stats.publicCount}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Bisa dipakai lintas project</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs">
            <p className="text-xs text-gray-500 font-medium">Khusus Project</p>
            <p className="text-2xl font-bold tracking-tight text-purple-600 mt-1">{stats.projectCount}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Ditugaskan khusus</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs">
            <p className="text-xs text-gray-500 font-medium">Rata-rata Rate / Jam</p>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">
              Rp {formatRupiah(stats.avgRate)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Standar biaya per jam</p>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, posisi, atau project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs md:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Filter Posisi */}
            <select
              value={selectedPosisi}
              onChange={(e) => setSelectedPosisi(e.target.value)}
              className="px-3 py-2 text-xs md:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-medium"
            >
              <option value="ALL">Semua Posisi</option>
              {positionsList.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            {/* Filter Lingkup */}
            <select
              value={selectedLingkup}
              onChange={(e) => setSelectedLingkup(e.target.value)}
              className="px-3 py-2 text-xs md:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-medium"
            >
              <option value="ALL">Semua Lingkup</option>
              <option value="PUBLIC">Public (Semua Project)</option>
              <option value="KHUSUS">Khusus Project</option>
            </select>
          </div>
        </div>

        {/* 4. Table Manpower */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium">Memuat data manpower...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700">Tidak ada manpower ditemukan</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {searchTerm || selectedPosisi !== 'ALL' || selectedLingkup !== 'ALL'
                    ? 'Coba ubah kata kunci pencarian atau filter yang aktif'
                    : 'Belum ada data tenaga kerja. Klik tombol "Tambah Manpower" untuk mulai menambahkan.'}
                </p>
              </div>
              {(!searchTerm && selectedPosisi === 'ALL' && selectedLingkup === 'ALL') && (
                <button
                  onClick={handleOpenAdd}
                  className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Manpower Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Manpower</th>
                    <th className="py-3.5 px-4">Posisi / Keahlian</th>
                    <th className="py-3.5 px-4 text-right">Rate / Jam</th>
                    <th className="py-3.5 px-4">Lingkup Penugasan</th>
                    <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-gray-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs uppercase shadow-2xs shrink-0">
                            {item.nama ? item.nama.charAt(0) : 'M'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.nama}
                            </span>
                            <span className="block text-[11px] text-gray-400 font-mono">
                              ID: #{item.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg border ${getPositionBadge(
                            item.posisi
                          )}`}
                        >
                          {item.posisi || 'Helper'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-900">
                        Rp {formatRupiah(item.rate_per_jam)}
                        <span className="text-gray-400 text-xs font-normal ml-1">/jam</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.project_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              Khusus Project
                            </span>
                            <span className="text-xs text-gray-600 font-medium truncate max-w-[160px]" title={item.project_nama}>
                              {item.project_nama || `#${item.project_id}`}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Public (Semua Project)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Manpower"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Manpower"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Modal Tambah / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {editingId ? 'Edit Data Manpower' : 'Tambah Manpower Baru'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nama Manpower */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nama Manpower <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Posisi & Keahlian */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Posisi / Keahlian
                    </label>
                    <select
                      value={formData.posisi}
                      onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-800"
                    >
                      {positionsList.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                      <option value="Other">Lainnya...</option>
                    </select>
                  </div>

                  {/* Rate Per Jam */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Rate / Jam (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="35000"
                        value={formData.rate_per_jam}
                        onChange={(e) => setFormData({ ...formData, rate_per_jam: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {formData.posisi === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Ketik Nama Posisi Baru
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Scaffolder"
                      onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Lingkup Project */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Lingkup Penugasan
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-gray-800"
                  >
                    <option value="">Public (Tersedia untuk semua project)</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        Khusus Project: {p.no_project ? `[${p.no_project}] ` : ''}
                        {p.nama || p.customer}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    *Pilih <b>Public</b> agar manpower ini otomatis dapat dipilih pada semua project instalasi.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs md:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Simpan Perubahan' : 'Tambah Manpower'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Modal Konfirmasi Hapus */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-base">Hapus Manpower?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Data manpower ini akan dihapus dari master data. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 text-xs md:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
