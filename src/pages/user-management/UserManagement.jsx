import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Edit2, Trash2, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { apiUrl } from '../../api';

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
      jabatan_id: user.jabatan_id || ''
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
  };

  const openAddModal = () => {
    setFormData({ id: null, name: '', username: '', email: '', password: '', is_active: true, divisi_id: '', jabatan_id: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-1">Kelola data akun pengguna, role, dan status aktif.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="p-4 font-semibold text-sm">Nama</th>
                <th className="p-4 font-semibold text-sm">Username</th>
                <th className="p-4 font-semibold text-sm">Divisi & Jabatan</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-800 font-medium">{u.name}</td>
                  <td className="p-4 text-sm text-gray-600">{u.username}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {u.nama_divisi ? `${u.nama_divisi} - ${u.nama_jabatan}` : '-'}
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
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Belum ada data user. (Pastikan backend API berjalan)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Edit User' : 'Tambah User Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password {isEditing && <span className="text-xs text-gray-400 font-normal">(Kosongkan jika tidak ingin mengubah)</span>}
                </label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!isEditing} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Divisi</label>
                  <select
                    name="divisi_id"
                    value={formData.divisi_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Divisi</option>
                    {divisis.map(d => (
                      <option key={d.id} value={d.id}>{d.nama_divisi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jabatan</label>
                  <select
                    name="jabatan_id"
                    value={formData.jabatan_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Jabatan</option>
                    {jabatans.map(j => (
                      <option key={j.id} value={j.id}>{j.nama_jabatan}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
                  User Aktif (Bisa login)
                </label>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
