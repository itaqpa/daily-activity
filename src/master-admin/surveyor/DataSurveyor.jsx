import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Plus, MoreVertical, ChevronLeft, ChevronRight, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import MainLayout from '../../components/layouts/MainLayout';
import { apiUrl } from '../../api';

export default function DataSurveyor() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(15);
  const [page, setPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [divisis, setDivisis] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    divisi_id: '',
    jabatan_id: '',
    is_active: true
  });

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const response = await fetch(apiUrl('users'));
        const result = await response.json().catch(() => ([]));
        if (!response.ok) {
          throw new Error(result.error || 'Gagal mengambil data user');
        }
        // Filter out non-active if necessary or keep all. Since this is master data, show all users.
        setData(Array.isArray(result) ? result : []);
      } catch (error) {
        setErrorMessage(error.message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchOptions = async () => {
      try {
        const [divRes, jabRes] = await Promise.all([
          fetch(apiUrl('divisis')),
          fetch(apiUrl('jabatans'))
        ]);
        if (divRes.ok) setDivisis(await divRes.json());
        if (jabRes.ok) setJabatans(await jabRes.json());
      } catch (err) {
        console.error('Failed to fetch options', err);
      }
    };

    fetchUsers();
    fetchOptions();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredData = data.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nama_divisi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nama_jabatan || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = limit === 'all' 
    ? filteredData 
    : filteredData.slice((page - 1) * limit, page * limit);

  const totalPages = limit === 'all' ? 1 : Math.ceil(filteredData.length / limit);

  const exportCSV = () => {
    const headers = ['ID', 'Nama', 'Username', 'Email', 'Divisi', 'Jabatan', 'Status'];
    const rows = filteredData.map(item => [
      item.id,
      item.name || '-',
      item.username || '-',
      item.email || '-',
      item.nama_divisi || '-',
      item.nama_jabatan || '-',
      item.is_active ? 'Aktif' : 'Tidak Aktif'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_surveyor.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        divisi_id: formData.divisi_id ? parseInt(formData.divisi_id) : null,
        jabatan_id: formData.jabatan_id ? parseInt(formData.jabatan_id) : null,
      };

      const url = editingUser ? apiUrl(`users/${editingUser.id}`) : apiUrl('users');
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (editingUser ? 'Gagal mengubah user' : 'Gagal membuat user'));
      
      // Update local state
      if (editingUser) {
        setData(prev => prev.map(u => u.id === editingUser.id ? result : u));
        alert('User berhasil diubah!');
      } else {
        setData(prev => [...prev, result]);
        alert('User berhasil dibuat!');
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        divisi_id: '',
        jabatan_id: '',
        is_active: true
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '', // Kosongkan password saat edit
      divisi_id: user.divisi_id || '',
      jabatan_id: user.jabatan_id || '',
      is_active: user.is_active
    });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
      const response = await fetch(apiUrl(`users/${id}`), {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal menghapus user');
      }
      
      setData(prev => prev.filter(u => u.id !== id));
      setOpenDropdownId(null);
      alert('User berhasil dihapus!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <MainLayout currentModule="Survey Product">
      <div className="w-full">
        {/* Header section (with padding) */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Data Surveyor</h1>
              <p className="text-sm text-gray-500 mt-1">Kelola data master surveyor & user</p>
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button 
                onClick={exportCSV}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 sm:flex-none font-medium text-sm"
              >
                <Download size={18} className="mr-2" />
                Export
              </button>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setFormData({
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    divisi_id: '',
                    jabatan_id: '',
                    is_active: true
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-none font-medium text-sm"
              >
                <Plus size={18} className="mr-2" />
                Create
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Tampilkan</span>
              <select 
                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <option value="all">Semua</option>
              </select>
              <span>data</span>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari user..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
          </div>
        </div>

        {/* Content Area (Full width, no padding for table) */}
        <div className="bg-white border-t border-gray-200">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Memuat data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500 bg-gray-50">
              <p className="text-lg font-medium text-gray-700">Data tidak ditemukan</p>
              <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW (Cards) */}
              <div className="md:hidden block divide-y divide-gray-100">
                {paginatedData.map((item) => (
                  <div key={item.id} className="p-4 bg-white hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-gray-900 text-base">{item.name || '-'}</div>
                        <div className="text-sm text-gray-500">@{item.username || '-'}</div>
                      </div>
                      <div className="relative inline-block text-left" ref={openDropdownId === item.id ? dropdownRef : null}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === item.id ? null : item.id);
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors focus:outline-none"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openDropdownId === item.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 overflow-hidden">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button 
                                onClick={() => handleEditClick(item)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center"
                              >
                                <Edit size={14} className="mr-2 text-blue-600" /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(item.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={14} className="mr-2" /> Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">ID:</span>
                        <span className="font-medium text-gray-700">{item.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-700 truncate max-w-[200px]">{item.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Divisi:</span>
                        <span className="text-gray-700">{item.nama_divisi || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Jabatan:</span>
                        <span className="text-gray-700">{item.nama_jabatan || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* WEB VIEW (Table) */}
              <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm border-b border-gray-200">
                      <th className="px-6 py-3 font-semibold w-16">ID</th>
                      <th className="px-6 py-3 font-semibold">Nama / Username</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Divisi / Jabatan</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm text-gray-800 bg-white">
                    {paginatedData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-500">{item.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{item.name || '-'}</div>
                          <div className="text-xs text-gray-500">{item.username || '-'}</div>
                        </td>
                        <td className="px-6 py-4">{item.email || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{item.nama_divisi || '-'}</div>
                          <div className="text-xs text-gray-500">{item.nama_jabatan || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block text-left" ref={openDropdownId === item.id ? dropdownRef : null}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === item.id ? null : item.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors focus:outline-none"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {openDropdownId === item.id && (
                              <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 overflow-hidden">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                  <button 
                                    onClick={() => handleEditClick(item)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center"
                                  >
                                    <Edit size={14} className="mr-2 text-blue-600" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 size={14} className="mr-2" /> Hapus
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!isLoading && limit !== 'all' && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> hingga{' '}
                <span className="font-semibold text-gray-900">{Math.min(page * limit, filteredData.length)}</span> dari{' '}
                <span className="font-semibold text-gray-900">{filteredData.length}</span> data
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      page === i + 1 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingUser ? 'Edit Surveyor / User' : 'Tambah Surveyor / User'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <form id="createUserForm" onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input 
                    type="text" 
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Masukkan username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Masukkan alamat email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" 
                      placeholder={editingUser ? "Biarkan kosong jika tidak diubah" : "Masukkan password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Divisi</label>
                    <select
                      name="divisi_id"
                      value={formData.divisi_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Divisi --</option>
                      {divisis.map(d => (
                        <option key={d.id} value={d.id}>{d.nama_divisi}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                    <select
                      name="jabatan_id"
                      value={formData.jabatan_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Jabatan --</option>
                      {jabatans.map(j => (
                        <option key={j.id} value={j.id}>{j.nama_jabatan}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    User Aktif (Bisa Login)
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="createUserForm"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
