import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { Eye, Edit, Trash2, Plus, FileSpreadsheet, MapPin, Calendar, Box, PackageOpen, Key, Search, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import TokenAccessModal from './components/token-access/TokenAccessModal';
import TokenInputModal from './components/token-access/TokenInputModal';
import { apiUrl } from '../api';

export default function SurveyProductList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(15);
  const [page, setPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [tokenInputModalOpen, setTokenInputModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const dropdownRef = useRef(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isSuperAdmin = user?.jabatan_name?.toLowerCase().includes('super admin') || 
                       user?.role === 'Super Admin' || 
                       user?.jabatan?.toLowerCase().includes('super admin') || 
                       user?.role === 'admin' || 
                       user?.role === 'superadmin' || 
                       user?.jabatan?.toLowerCase().includes('admin');

  useEffect(() => {
    const fetchSurveyProducts = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await fetch(apiUrl('survey-engine/product-drafts'));
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || 'Gagal mengambil daftar survey product');
        }
        setData(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        setErrorMessage(error.message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPercentColor = (percent) => {
    if (percent >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percent >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusColor = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'selesai') return 'text-green-700 bg-green-50 border-green-200';
    if (normalized === 'lapangan') return 'text-blue-700 bg-blue-50 border-blue-200';
    if (normalized === 'persiapan') return 'text-purple-700 bg-purple-50 border-purple-200';
    if (normalized === 'batal') return 'text-red-700 bg-red-50 border-red-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const formatTanggal = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const filteredData = data.filter(item => 
    (item.no_survey || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = limit === 'all' 
    ? filteredData 
    : filteredData.slice((page - 1) * limit, page * limit);

  const handleEdit = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(null);
    navigate(`/survey-product/create?id=${item.id}`);
  };

  const handleOpenTokenModal = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(null);
    setSelectedSurvey(item);
    setTokenModalOpen(true);
  };

  const handleOpenTokenInputModal = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(null);
    setSelectedSurvey(item);
    setTokenInputModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data survey product ini?')) {
      return;
    }
    
    try {
      const response = await fetch(apiUrl(`survey-engine/product-drafts/${id}`), {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus data');
      
      // Update list
      setData(data.filter(item => item.id !== id));
      alert('Data berhasil dihapus');
    } catch (error) {
      alert(error.message);
    }
  };

  const ActionMenu = ({ item, isMobile }) => {
    if (!isSuperAdmin) {
      const isDraft = (item.status || '').toLowerCase() === 'draft';
      return (
        <div className={`absolute ${isMobile ? 'bottom-full mb-2 right-0' : 'top-full mt-1 right-0'} w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50`} ref={dropdownRef}>
          <button
            onMouseDown={(event) => handleOpenTokenInputModal(event, item)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit className="w-4 h-4 text-blue-500" /> {isDraft ? 'Mulai pengisian' : 'Lanjutkan pengisian'}
          </button>
        </div>
      );
    }

    return (
      <div className={`absolute ${isMobile ? 'bottom-full mb-2 right-0' : 'top-full mt-1 right-0'} w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50`} ref={dropdownRef}>
        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-500" /> Detail
        </button>
        <button
          onMouseDown={(event) => handleEdit(event, item)}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit className="w-4 h-4 text-yellow-500" /> Edit
        </button>
        <button
          onMouseDown={(event) => handleOpenTokenModal(event, item)}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Key className="w-4 h-4 text-purple-500" /> Token Access
        </button>
        <div className="border-t border-gray-100 my-1"></div>
        <button 
          onMouseDown={(event) => {
            event.preventDefault();
            handleDelete(item.id);
            setOpenDropdownId(null);
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Hapus
        </button>
      </div>
    );
  };

  return (
    <MainLayout currentModule="Survey Product">
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <PackageOpen className="w-7 h-7 text-blue-600" />
              Daftar Survey Product
            </h1>
            <p className="text-gray-500 text-sm mt-1">Kelola dan pantau data hasil survey product lapangan.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari no survey / lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {isSuperAdmin && (
                <button 
                  onClick={() => navigate('/survey-product/create')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Buat Survey</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-sm">
                  <th className="py-4 px-6 font-semibold text-gray-600">No. Survey</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Customer/Client</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Plant / Area *</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Marketing</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Leader Surveyor</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Tanggal</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Status</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Jumlah Item</th>
                  <th className="py-4 px-6 font-semibold text-gray-600">Jenis Product</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-center">Kelengkapan</th>
                  <th className="py-4 px-6 font-semibold text-gray-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && (
                  <tr>
                    <td colSpan="11" className="py-10 text-center text-gray-500">
                      Memuat data survey product...
                    </td>
                  </tr>
                )}
                {!isLoading && errorMessage && (
                  <tr>
                    <td colSpan="11" className="py-10 text-center text-red-500">
                      {errorMessage}
                    </td>
                  </tr>
                )}
                {!isLoading && !errorMessage && paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-800">{item.no_survey}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700 font-medium">{item.customer || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 font-medium">{item.lokasi || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{item.marketing || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{item.leader_surveyor || '-'}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatTanggal(item.tanggal)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                        {item.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-700">{item.jumlah_item}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-700">{item.jumlah_jenis_product}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getPercentColor(item.percent_kelengkapan)}`}>
                        {item.percent_kelengkapan}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center relative">
                      {isSuperAdmin ? (
                        <>
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdownId === item.id && <ActionMenu item={item} isMobile={false} />}
                        </>
                      ) : (
                        <button
                          onClick={(event) => handleOpenTokenInputModal(event, item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <Edit className="w-3.5 h-3.5" /> 
                          {['draft', 'open'].includes((item.status || '').toLowerCase()) ? 'Mulai pengisian' : 'Lanjutkan pengisian'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && !errorMessage && paginatedData.length === 0 && (
                  <tr>
                    <td colSpan="11" className="py-10 text-center text-gray-500">
                      Belum ada survey product tersimpan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Tampilkan:</span>
              <select 
                className="border border-gray-200 rounded-lg text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={90}>90</option>
                <option value={180}>180</option>
                <option value="all">All</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Menampilkan {filteredData.length === 0 ? 0 : (page - 1) * (limit === 'all' ? filteredData.length : limit) + 1} - {limit === 'all' ? filteredData.length : Math.min(page * limit, filteredData.length)} dari {filteredData.length}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={limit === 'all' || page * limit >= filteredData.length}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {isLoading && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center text-gray-500">
              Memuat data survey product...
            </div>
          )}
          {!isLoading && errorMessage && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 text-center text-red-500">
              {errorMessage}
            </div>
          )}
          {!isLoading && !errorMessage && paginatedData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-visible">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{item.no_survey}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatTanggal(item.tanggal)}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border mt-2 ${getStatusColor(item.status)}`}>
                    {item.status || 'Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-2 relative">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getPercentColor(item.percent_kelengkapan)}`}>
                    {item.percent_kelengkapan}%
                  </span>
                  {isSuperAdmin ? (
                    <>
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openDropdownId === item.id && <ActionMenu item={item} isMobile={true} />}
                    </>
                  ) : (
                    <button
                      onClick={(event) => handleOpenTokenInputModal(event, item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <Edit className="w-3.5 h-3.5" /> 
                      {['draft', 'open'].includes((item.status || '').toLowerCase()) ? 'Mulai' : 'Lanjutkan'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-24">Customer:</span>
                  <span className="text-sm font-medium text-gray-700">{item.customer || '-'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-24">Plant/Area:</span>
                  <span className="text-sm font-medium text-gray-700">{item.lokasi || '-'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-24">Marketing:</span>
                  <span className="text-sm font-medium text-gray-700">{item.marketing || '-'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 w-24">Surveyor:</span>
                  <span className="text-sm font-medium text-gray-700">{item.leader_surveyor || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                  <span className="text-xs text-gray-500 block mb-1">Jml Item</span>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-gray-800">{item.jumlah_item}</span>
                  </div>
                </div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                  <span className="text-xs text-gray-500 block mb-1">Jenis Product</span>
                  <div className="flex items-center gap-2">
                    <PackageOpen className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-gray-800">{item.jumlah_jenis_product}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!isLoading && !errorMessage && paginatedData.length === 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center text-gray-500">
              Belum ada survey product tersimpan
            </div>
          )}

          {/* Mobile Pagination */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mt-4 flex flex-col gap-3">
             <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tampilkan:</span>
              <select 
                className="border border-gray-200 rounded-lg text-sm px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={90}>90</option>
                <option value={180}>180</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
               <span className="text-xs text-gray-500">
                {filteredData.length === 0 ? 0 : (page - 1) * (limit === 'all' ? filteredData.length : limit) + 1} - {limit === 'all' ? filteredData.length : Math.min(page * limit, filteredData.length)} dari {filteredData.length}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={limit === 'all' || page * limit >= filteredData.length}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <TokenAccessModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        surveyId={selectedSurvey?.id}
        noSurvey={selectedSurvey?.no_survey}
      />

      <TokenInputModal
        isOpen={tokenInputModalOpen}
        onClose={() => setTokenInputModalOpen(false)}
        surveyId={selectedSurvey?.id}
        noSurvey={selectedSurvey?.no_survey}
        userId={user?.id}
      />
    </MainLayout>
  );
}
