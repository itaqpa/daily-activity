import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layouts/MainLayout';
import { Edit2, Trash2, UserPlus, CheckCircle, XCircle, Download, UploadCloud, X, FileText } from 'lucide-react';
import { apiUrl } from '../../../api';
import FormUserManagement from './components/FormUserManagement';
import Papa from 'papaparse';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [divisis, setDivisis] = useState([]);
  const [jabatans, setJabatans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    username: '',
    email: '',
    password: '',
    is_active: true,
    divisi_id: '',
    jabatan_id: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleExportCSV = () => {
    const csvData = users.map(u => {
      const primaryRole = u.nama_jabatan || '';
      const additionalRoles = (u.additional_roles || []).map(roleId => {
        const role = jabatans.find(j => j.id === roleId);
        return role ? role.nama_jabatan : '';
      }).filter(r => r).join(';');
      
      return {
        'Nama': u.name || '',
        'Username': u.username || '',
        'Email': u.email || '',
        'Divisi': u.nama_divisi || '',
        'Role Default': primaryRole,
        'Role Tambahan': additionalRoles,
        'Status': u.is_active ? 'Aktif' : 'Non-aktif'
      };
    });
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_user.csv';
    link.click();
  };

  const handleImportCSV = () => {
    setIsImportModalOpen(true);
  };

  const downloadFormatCSV = () => {
    const csvContent = 
`# CATATAN PENTING:
# 1. Baris yang berawalan # akan diabaikan oleh sistem.
# 2. Format mulai baris ke-4 ke bawah adalah contoh, silakan timpa dengan data asli Anda.
Nama Lengkap,Username,Email,Password,Status Aktif (1/0),ID Divisi (1:Sales, 4:Management, 9:Engineering),ID Jabatan (1:Super Admin, 2:Manager, 3:Spv, 4:Leader, 5:Staff, 27:Admin)
Yudo,yudo,yudo@example.com,password123,1,1,5`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "format_import_user.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(apiUrl('/users'));
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDivisis = async () => {
    try {
      const response = await fetch(apiUrl('/divisis'));
      if (response.ok) setDivisis(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchJabatans = async () => {
    try {
      const response = await fetch(apiUrl('/jabatans'));
      if (response.ok) setJabatans(await response.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchUsers();
    fetchDivisis();
    fetchJabatans();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? apiUrl(`/users/${formData.id}`)
      : apiUrl('/users');
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchUsers();
        setFormData({ id: null, name: '', username: '', email: '', password: '', is_active: true, divisi_id: '', jabatan_id: '' });
        setIsEditing(false);
      } else {
        alert('Gagal menyimpan data user.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      name: user.name,
      username: user.username || '',
      email: user.email,
      password: '', // Kosongkan password saat edit
      is_active: user.is_active !== undefined ? user.is_active : true,
      divisi_id: user.divisi_id || '',
      jabatan_id: user.jabatan_id || '',
      additional_roles: user.additional_roles || [],
      permissions: user.permissions || []
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus user ini?')) {
      try {
        const response = await fetch(apiUrl(`/users/${id}`), {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchUsers();
        } else {
          alert('Gagal menghapus user.');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(apiUrl(`/users/${id}/toggle-status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };  const openAddModal = () => {
    setFormData({ id: null, name: '', username: '', email: '', password: '', is_active: true, divisi_id: '', jabatan_id: '', additional_roles: [], permissions: [] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Kelola data akun pengguna, role, dan status aktif.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap flex-1 md:flex-none"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={handleImportCSV}
            className="flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap flex-1 md:flex-none"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap w-full md:w-auto mt-2 md:mt-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="p-4 font-semibold text-sm">No</th>
                <th className="p-4 font-semibold text-sm">Nama</th>
                <th className="p-4 font-semibold text-sm">Username</th>
                <th className="p-4 font-semibold text-sm">Divisi & Jabatan</th>
                <th className="p-4 font-semibold text-sm">Akses Role</th>
                <th className="p-4 font-semibold text-sm">Role Default</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u, index) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="p-4 text-sm text-gray-800 font-medium">{u.name}</td>
                  <td className="p-4 text-sm text-gray-600">{u.username}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {u.nama_divisi ? `${u.nama_divisi} - ${u.nama_jabatan}` : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Primary Role Badge */}
                      {u.nama_jabatan && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          u.nama_jabatan.toLowerCase().includes('admin') ? 'bg-red-50 text-red-700' :
                          u.nama_jabatan.toLowerCase().includes('spv') ? 'bg-purple-50 text-purple-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {u.nama_jabatan.toLowerCase() === 'super admin' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20v2H2v-2zm2-2l3-10 5 6 5-6 3 10H4z"/></svg>
                          )}
                          {u.nama_jabatan}
                        </span>
                      )}
                      {/* Additional Roles Badges */}
                      {u.additional_roles && u.additional_roles.map(roleId => {
                        const role = jabatans.find(j => j.id === roleId);
                        if (!role) return null;
                        return (
                          <span key={roleId} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium ${
                            role.nama_jabatan.toLowerCase().includes('admin') ? 'bg-red-50 text-red-700' :
                            role.nama_jabatan.toLowerCase().includes('spv') ? 'bg-purple-50 text-purple-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {role.nama_jabatan}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-800 font-medium">
                    {u.nama_jabatan || '-'}
                  </td>
                  <td className="p-4 text-sm">
                    <button 
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        u.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {u.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.is_active ? 'Aktif' : 'Non-aktif'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    Belum ada data user. (Pastikan backend API berjalan)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 tracking-tight">Import CSV</h3>
                  <p className="text-xs text-gray-500 font-medium">Unggah data user secara massal</p>
                </div>
              </div>
              <button
                onClick={() => { setIsImportModalOpen(false); setSelectedFile(null); }}
                className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-4 ring-white">1</div>
                  <div className="w-0.5 h-full bg-gray-100 mt-2"></div>
                </div>
                <div className="pb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-1">Unduh Format CSV</h4>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    Gunakan template ini untuk memastikan struktur kolom sesuai.
                  </p>
                  <button
                    type="button"
                    onClick={downloadFormatCSV}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-200 shadow-sm rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2 group"
                  >
                    <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    Template.csv
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white transition-colors ${selectedFile ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {selectedFile ? <CheckCircle size={14} /> : '2'}
                  </div>
                </div>
                <div className="w-full">
                  <h4 className="text-sm font-bold text-gray-700 mb-1">Upload File Data</h4>
                  <p className="text-xs text-gray-500 mb-3">Pilih file CSV yang sudah Anda isi.</p>

                  <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-300'}`}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {!selectedFile ? (
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 mb-1">
                          <FileText size={20} />
                        </div>
                        <span className="text-sm font-medium text-blue-600">Klik untuk browse file</span>
                        <span className="text-xs text-gray-400">atau drag & drop file .csv di sini</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500 mb-1">
                          <FileText size={20} />
                        </div>
                        <span className="text-sm font-bold text-green-700">{selectedFile.name}</span>
                        <span className="text-xs text-green-600 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <span className="text-xs text-gray-500 underline mt-1">Klik untuk mengganti file</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setSelectedFile(null); }}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={() => {
                  if (selectedFile) {
                    Papa.parse(selectedFile, {
                      header: true,
                      skipEmptyLines: true,
                      complete: async function(results) {
                        const data = results.data.filter(row => {
                          const firstKey = Object.keys(row)[0];
                          return !row[firstKey]?.toString().startsWith('#');
                        });
                        
                        let successCount = 0;
                        for (const row of data) {
                          try {
                            const payload = {
                              name: row['Nama Lengkap'] || '',
                              username: row['Username'] || '',
                              email: row['Email'] || '',
                              password: row['Password'] || 'password123',
                              divisi_id: row['ID Divisi (1:Sales, 4:Management, 9:Engineering)'] || null,
                              jabatan_id: row['ID Jabatan (1:Super Admin, 2:Manager, 3:Spv, 4:Leader, 5:Staff, 27:Admin)'] || null,
                              additional_roles: [],
                              is_active: row['Status Aktif (1/0)'] === '1' || row['Status Aktif (1/0)'] === 1
                            };
                            
                            await fetch(apiUrl('/users'), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            successCount++;
                          } catch (err) {
                            console.error('Error importing user', row, err);
                          }
                        }
                        alert(`Berhasil mengimport ${successCount} dari ${data.length} baris data user.`);
                        fetchUsers();
                        setIsImportModalOpen(false);
                        setSelectedFile(null);
                      }
                    });
                  }
                }}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2
                  ${selectedFile ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed opacity-70'}
                `}
              >
                <UploadCloud size={18} />
                Import Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <FormUserManagement
          isEditing={isEditing}
          formData={formData}
          divisis={divisis}
          jabatans={jabatans}
          onClose={() => setIsModalOpen(false)}
          onChange={(e) => {
            const { name, value, type, checked } = e.target;
            setFormData({
              ...formData,
              [name]: type === 'checkbox' ? checked : value
            });
          }}
          onSubmit={handleSubmit}
        />
      )}

    </MainLayout>
  );
}
