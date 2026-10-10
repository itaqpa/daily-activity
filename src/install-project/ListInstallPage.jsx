import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Eye, MoreVertical, ChevronLeft, ChevronRight, Loader2, Play, CheckCircle } from 'lucide-react';
import { apiUrl } from '../api';
import MainLayout from '../components/layouts/MainLayout';
import WizardModal from './components/WizardModal';
import { useAuth } from '../context/AuthContext';

export default function ListInstallPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const { user, hasPermission } = useAuth();
  
  // Handle clicking outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.action-dropdown-container')) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Projects from API
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(apiUrl('/install-projects'));
      if (res.ok) {
        let data = await res.json();
        
        // Filter projects: Super Admin (1) & Admin (27) sees all, others only see their own projects
        if (user && user.jabatan_id !== 1 && user.jabatan_id !== 27) {
          data = data.filter(p => p.leader === user.name);
        }
        
        setProjects(data);
      } else {
        console.error("Gagal mengambil data project");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user?.id, user?.jabatan_id]);

  // Helper untuk hitung target selesai dari tgl_mulai dan durasi
  const calculateTargetSelesai = (tgl, durasi) => {
    if (!tgl || !durasi) return '-';
    const start = new Date(tgl);
    start.setDate(start.getDate() + (parseInt(durasi) - 1));
    return start.toISOString().split('T')[0];
  };

  // Mapping data API ke format UI
  const mappedData = projects.map(p => ({
    id: p.id,
    no_project: p.no_project || '-',
    nama_project: p.nama || '-',
    customer: p.customer || '-',
    lokasi: p.lokasi || '-',
    leader: p.leader || '-',
    mulai: p.tgl_mulai ? new Date(p.tgl_mulai).toISOString().split('T')[0] : '-',
    target_selesai: calculateTargetSelesai(p.tgl_mulai, p.durasi_hari),
    catatan: p.catatan || '-',
    status: p.status === 'registered' ? 'Registered' : (p.status === 'running' ? 'Running' : (p.status || 'draft'))
  }));

  // Filtering
  const filteredData = mappedData.filter(item => 
    item.nama_project.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.no_project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalItems = filteredData.length;
  const totalPages = itemsPerPage === "All" ? 1 : Math.ceil(totalItems / itemsPerPage);
  
  const indexOfLastItem = itemsPerPage === "All" ? totalItems : currentPage * itemsPerPage;
  const indexOfFirstItem = itemsPerPage === "All" ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setActiveDropdown(null);
    }
  };

  const handleWizardSuccess = () => {
    fetchProjects();
  };

  const handleView = (id) => {
    navigate(`/installation-project/${id}`);
  };

  const handleEdit = (id) => {
    setEditId(id);
    setIsWizardOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus project ini?")) {
      try {
        const res = await fetch(apiUrl(`/install-projects/${id}`), { method: 'DELETE' });
        if (res.ok) {
          fetchProjects();
        } else {
          alert("Gagal menghapus project");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const actionText = status === 'running' ? 'memulai' : 'menutup (close)';
    if (window.confirm(`Apakah Anda yakin ingin ${actionText} project ini?`)) {
      try {
        const res = await fetch(apiUrl(`/install-projects/${id}/status`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        });
        
        if (res.ok) {
          fetchProjects();
        } else {
          alert(`Gagal ${actionText} project`);
        }
      } catch (err) {
        console.error(err);
        alert(`Terjadi kesalahan saat ${actionText} project`);
      }
    }
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Installation Project</h1>
          <p className="text-gray-500 text-sm mt-1">Daftar semua project instalasi beserta status dan detail pelaksanaannya.</p>
        </div>

        {/* Toolbar: Search (Left) & Add Button (Right) */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari project..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
                className="w-full pl-11 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            
            {/* Show Entries Dropdown */}
            <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setItemsPerPage(val === "All" ? "All" : Number(val));
                  setCurrentPage(1);
                }}
                className="bg-gray-50/50 border border-gray-200 text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={90}>90</option>
                <option value={120}>120</option>
                <option value="All">All</option>
              </select>
            </div>
          </div>

          {hasPermission('install_project_create') && (
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Add Installation
            </button>
          )}
          
        </div>

        {/* Table / Card Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[500px] relative pb-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="font-medium">Memuat data project...</p>
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto min-h-[350px] pb-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 font-bold text-center">No</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">No Project</th>
                      <th className="px-4 py-4 font-bold min-w-[200px]">Nama Project</th>
                      <th className="px-4 py-4 font-bold min-w-[150px]">Customer</th>
                      <th className="px-4 py-4 font-bold min-w-[120px]">Lokasi</th>
                      <th className="px-4 py-4 font-bold min-w-[120px]">Leader</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">Mulai</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">Target Selesai</th>
                      <th className="px-4 py-4 font-bold min-w-[200px]">Catatan</th>
                      <th className="px-4 py-4 font-bold text-center">Status</th>
                      <th className="px-4 py-4 font-bold text-center sticky right-0 bg-gray-50 border-l border-gray-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 relative">
                    {currentItems.map((row, index) => (
                      <tr key={row.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5 text-center text-gray-500">{indexOfFirstItem + index + 1}</td>
                        <td 
                          onClick={() => handleView(row.id)}
                          className="px-4 py-3.5 font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {row.no_project}
                        </td>
                        <td 
                          onClick={() => handleView(row.id)}
                          className="px-4 py-3.5 font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                        >
                          {row.nama_project}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">{row.customer}</td>
                        <td className="px-4 py-3.5 text-gray-600">{row.lokasi}</td>
                        <td className="px-4 py-3.5 text-gray-600">{row.leader}</td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.mulai}</td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.target_selesai}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-sm">
                          <div className="line-clamp-2" title={row.catatan}>{row.catatan}</div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap capitalize ${
                            row.status.toLowerCase() === 'registered' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            row.status.toLowerCase() === 'running' || row.status.toLowerCase() === 'in progress' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            row.status.toLowerCase() === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 relative text-center sticky right-0 bg-white border-l border-gray-100 group-hover:bg-blue-50/30 action-dropdown-container ${activeDropdown === row.id ? 'z-50' : 'z-10'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === row.id ? null : row.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${activeDropdown === row.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {/* Dropdown Menu - Desktop */}
                          {activeDropdown === row.id && (
                            <div 
                              className={`absolute right-12 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-gray-200 py-2 z-[9999] ${index >= 3 && index >= currentItems.length - 3 ? 'bottom-10' : 'top-10'}`}
                            >
                              {hasPermission('install_project_view') && (
                                <button 
                                  onClick={() => { setActiveDropdown(null); handleView(row.id); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left font-medium"
                                >
                                  <Eye className="w-[18px] h-[18px]" /> Lihat Detail
                                </button>
                              )}
                              {hasPermission('install_project_edit') && (
                                <button 
                                  onClick={() => { if(row.status.toLowerCase() !== 'running') { setActiveDropdown(null); handleEdit(row.id); } }}
                                  disabled={row.status.toLowerCase() === 'running'}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left font-medium transition-colors ${row.status.toLowerCase() === 'running' ? 'text-gray-400 cursor-not-allowed bg-gray-50/50' : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'}`}
                                >
                                  <Edit className="w-[18px] h-[18px]" /> Edit
                                </button>
                              )}
                              {hasPermission('install_project_progress') && row.status.toLowerCase() === 'registered' && (
                                <button 
                                  onClick={() => { setActiveDropdown(null); handleUpdateStatus(row.id, 'running'); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left font-medium"
                                >
                                  <Play className="w-[18px] h-[18px]" /> Mulai Project
                                </button>
                              )}
                              {hasPermission('install_project_progress') && row.status.toLowerCase() === 'running' && (
                                <button 
                                  onClick={() => { setActiveDropdown(null); handleUpdateStatus(row.id, 'closed'); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left font-medium"
                                >
                                  <CheckCircle className="w-[18px] h-[18px]" /> Close Project
                                </button>
                              )}
                              {hasPermission('install_project_delete') && (
                                <>
                                  <div className="h-px bg-gray-100 my-1"></div>
                                  <button 
                                    onClick={() => { setActiveDropdown(null); handleDelete(row.id); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                                  >
                                    <Trash2 className="w-[18px] h-[18px]" /> Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Jika data kosong (Search filter) */}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan="11" className="px-4 py-12 text-center text-gray-500">
                          Tidak ada data project yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Cards */}
              <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50 border-t border-gray-100">
                {currentItems.map((row) => (
                  <div key={row.id} className={`p-4 flex flex-col gap-3 relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all ${activeDropdown === row.id ? 'z-50' : 'z-10'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div 
                          onClick={() => handleView(row.id)}
                          className="font-bold text-blue-600 hover:underline cursor-pointer text-base"
                        >
                          {row.no_project}
                        </div>
                        <div 
                          onClick={() => handleView(row.id)}
                          className="font-semibold text-gray-900 mt-0.5 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {row.nama_project}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 action-dropdown-container">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap capitalize ${
                          row.status.toLowerCase() === 'registered' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          row.status.toLowerCase() === 'running' || row.status.toLowerCase() === 'in progress' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          row.status.toLowerCase() === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {row.status}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === row.id ? null : row.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${activeDropdown === row.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu - Mobile */}
                        {activeDropdown === row.id && (
                          <div 
                            className="absolute right-4 top-12 w-40 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-gray-200 py-2 z-[9999]"
                          >
                            {hasPermission('install_project_view') && (
                              <button 
                                onClick={() => { setActiveDropdown(null); handleView(row.id); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left font-medium"
                              >
                                <Eye className="w-[18px] h-[18px]" /> Lihat Detail
                              </button>
                            )}
                            {hasPermission('install_project_edit') && (
                              <button 
                                onClick={() => { if(row.status.toLowerCase() !== 'running') { setActiveDropdown(null); handleEdit(row.id); } }}
                                disabled={row.status.toLowerCase() === 'running'}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left font-medium transition-colors ${row.status.toLowerCase() === 'running' ? 'text-gray-400 cursor-not-allowed bg-gray-50/50' : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'}`}
                              >
                                <Edit className="w-[18px] h-[18px]" /> Edit
                              </button>
                            )}
                            {hasPermission('install_project_progress') && row.status.toLowerCase() === 'registered' && (
                              <button 
                                onClick={() => { setActiveDropdown(null); handleUpdateStatus(row.id, 'running'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left font-medium"
                              >
                                <Play className="w-[18px] h-[18px]" /> Mulai Project
                              </button>
                            )}
                            {hasPermission('install_project_progress') && row.status.toLowerCase() === 'running' && (
                              <button 
                                onClick={() => { setActiveDropdown(null); handleUpdateStatus(row.id, 'closed'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left font-medium"
                              >
                                <CheckCircle className="w-[18px] h-[18px]" /> Close Project
                              </button>
                            )}
                            {hasPermission('install_project_delete') && (
                              <>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button 
                                  onClick={() => { setActiveDropdown(null); handleDelete(row.id); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                                >
                                  <Trash2 className="w-[18px] h-[18px]" /> Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-1">
                      <div>
                        <span className="text-gray-500 text-xs block mb-0.5">Customer</span>
                        <span className="text-gray-700 font-medium">{row.customer}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block mb-0.5">Leader</span>
                        <span className="text-gray-700">{row.leader}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block mb-0.5">Mulai</span>
                        <span className="text-gray-700">{row.mulai}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block mb-0.5">Target Selesai</span>
                        <span className="text-gray-700">{row.target_selesai}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 text-xs block mb-0.5">Lokasi</span>
                        <span className="text-gray-700">{row.lokasi}</span>
                      </div>
                    </div>

                    {row.catatan && row.catatan !== '-' && (
                      <div className="mt-1 bg-amber-50/50 p-3 rounded-lg text-sm border border-amber-100">
                        <span className="font-semibold text-amber-800 text-xs block mb-1">Catatan:</span>
                        <p className="text-amber-900 line-clamp-3">{row.catatan}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Jika data kosong (Search filter) */}
                {currentItems.length === 0 && (
                  <div className="px-4 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                    Tidak ada data project yang ditemukan.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && !isLoading && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold text-gray-700">{indexOfFirstItem + 1}</span> hingga <span className="font-semibold text-gray-700">{Math.min(indexOfLastItem, totalItems)}</span> dari <span className="font-semibold text-gray-700">{totalItems}</span> data
            </div>
            
            {itemsPerPage !== "All" && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, idx) => {
                    // Logic untuk membatasi jumlah tombol pagination yang tampil agar tidak terlalu panjang
                    if (
                      totalPages > 5 &&
                      idx > 0 &&
                      idx < totalPages - 1 &&
                      Math.abs(idx + 1 - currentPage) > 1
                    ) {
                      if (idx + 1 === currentPage - 2 || idx + 1 === currentPage + 2) {
                        return <span key={idx} className="px-1 text-gray-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePageChange(idx + 1)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === idx + 1 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <WizardModal 
        isOpen={isWizardOpen} 
        onClose={() => {
          setIsWizardOpen(false);
          setEditId(null);
        }}
        onSuccess={handleWizardSuccess}
        editId={editId}
      />
    </MainLayout>
  );
}
