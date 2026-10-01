import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Plus, Edit2, Trash2, Search, X, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { apiUrl } from '../../api';

export default function DataCustomer() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.jabatan === 'Super Admin' || user.username === 'admin' || user.role === 'superadmin';

  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [sortConfig, setSortConfig] = useState(null);
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [formData, setFormData] = useState({
    id: null,
    no_akun: '',
    nama_customer: '',
    site_kota: [''],
    sales_ids: []
  });

  const fetchCustomers = async () => {
    try {
      const url = new URL(apiUrl('/customers'), window.location.origin);
      
      const isSPV = user.jabatan?.toLowerCase().includes('spv') || user.jabatan?.toLowerCase().includes('supervisor');
      
      // Jika bukan Super Admin dan bukan SPV, hanya tampilkan customer miliknya sendiri
      if (!isSuperAdmin && !isSPV) {
        url.searchParams.append('sales_id', user.id);
      }

      const response = await fetch(url);
      if (response.ok) {
        setCustomers(await response.json());
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSalesList = async () => {
    try {
      const response = await fetch(apiUrl('/sales'));
      if (response.ok) {
        setSalesList(await response.json());
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchSalesList();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      sales_ids: selectedOptions ? selectedOptions.map(option => option.value) : []
    }));
  };

  const handleSiteTextChange = (index, value) => {
    setFormData(prev => {
      const newSites = [...prev.site_kota];
      newSites[index] = value;
      return { ...prev, site_kota: newSites };
    });
  };

  const handleAddSite = () => {
    setFormData(prev => ({
      ...prev,
      site_kota: [...prev.site_kota, '']
    }));
  };

  const handleRemoveSite = (index) => {
    setFormData(prev => {
      const newSites = prev.site_kota.filter((_, i) => i !== index);
      return { ...prev, site_kota: newSites };
    });
  };

  const openAddModal = () => {
    setFormData({ id: null, no_akun: '', nama_customer: '', site_kota: [''], sales_ids: [] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setFormData({
      id: customer.id,
      no_akun: customer.no_akun || '',
      nama_customer: customer.nama_customer,
      site_kota: customer.site_kota && customer.site_kota.length > 0 ? customer.site_kota : [''],
      sales_ids: customer.assigned_sales ? customer.assigned_sales.map(s => s.id) : []
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus customer ini?')) {
      try {
        const response = await fetch(apiUrl(`/customers/${id}`), {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchCustomers();
        } else {
          alert('Gagal menghapus data.');
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? apiUrl(`/customers/${formData.id}`)
      : apiUrl('/customers');
      
    try {
      const payload = {
        ...formData,
        site_kota: formData.site_kota.filter(site => site.trim() !== '')
      };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        alert('Gagal menyimpan data customer.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (columnKey, value) => {
    setFilters(prev => ({ ...prev, [columnKey]: value }));
  };

  const uniqueOptions = React.useMemo(() => {
    const opts = {
      no_akun: new Set(),
      nama_customer: new Set(),
      site_kota: new Set(),
      sales: new Set(),
    };
    
    customers.forEach(c => {
      if (c.no_akun) opts.no_akun.add(c.no_akun);
      if (c.nama_customer) opts.nama_customer.add(c.nama_customer);
      if (c.site_kota) c.site_kota.forEach(s => opts.site_kota.add(s));
      if (c.assigned_sales) c.assigned_sales.forEach(s => opts.sales.add(s.name));
    });

    return {
      no_akun: Array.from(opts.no_akun).sort(),
      nama_customer: Array.from(opts.nama_customer).sort(),
      site_kota: Array.from(opts.site_kota).sort(),
      sales: Array.from(opts.sales).sort(),
    };
  }, [customers]);

  const filteredAndSortedCustomers = React.useMemo(() => {
    let result = [...customers];
    
    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(c => 
        (c.no_akun && c.no_akun.toLowerCase().includes(s)) ||
        (c.nama_customer && c.nama_customer.toLowerCase().includes(s))
      );
    }
    
    result = result.filter(c => {
      if (filters.no_akun && c.no_akun !== filters.no_akun) return false;
      if (filters.nama_customer && c.nama_customer !== filters.nama_customer) return false;
      if (filters.site_kota && (!c.site_kota || !c.site_kota.includes(filters.site_kota))) return false;
      if (filters.sales && (!c.assigned_sales || !c.assigned_sales.some(s => s.name === filters.sales))) return false;
      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = '', bVal = '';
        if (sortConfig.key === 'no_akun') { aVal = a.no_akun || ''; bVal = b.no_akun || ''; }
        else if (sortConfig.key === 'nama_customer') { aVal = a.nama_customer || ''; bVal = b.nama_customer || ''; }
        else if (sortConfig.key === 'site_kota') { aVal = (a.site_kota||[]).join(', '); bVal = (b.site_kota||[]).join(', '); }
        else if (sortConfig.key === 'sales') { aVal = (a.assigned_sales||[]).map(s=>s.name).join(', '); bVal = (b.assigned_sales||[]).map(s=>s.name).join(', '); }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [customers, filters, sortConfig, globalSearch]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
  };

  const FilterHeader = ({ columnKey, label }) => {
    const isActive = !!filters[columnKey];
    return (
      <th className="p-4 font-semibold text-sm text-gray-600 relative whitespace-nowrap group align-middle">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 cursor-pointer hover:text-gray-900 flex items-center gap-1" onClick={() => requestSort(columnKey)}>
            {label} <SortIcon columnKey={columnKey} />
          </div>
          <div 
            className={`cursor-pointer p-1.5 rounded transition-colors ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
            onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === columnKey ? null : columnKey); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
        </div>
        {openFilter === columnKey && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md z-[60] w-48 font-normal normal-case text-gray-700">
            <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
              <span className="font-semibold text-xs text-gray-600">Filter {label}</span>
              <button onClick={(e) => { e.stopPropagation(); setOpenFilter(null); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <div 
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${!isActive ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleFilterChange(columnKey, ''); setOpenFilter(null); }}
              >
                Semua
              </div>
              {uniqueOptions[columnKey].map(o => (
                <div 
                  key={o}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${filters[columnKey] === o ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleFilterChange(columnKey, o); setOpenFilter(null); }}
                >
                  {o}
                </div>
              ))}
            </div>
          </div>
        )}
      </th>
    );
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Customer</h2>
          <p className="text-gray-600 mt-1">Kelola data pelanggan dan assign ke Sales.</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            Tambah Customer
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {openFilter && (
          <div className="fixed inset-0 z-50" onClick={() => setOpenFilter(null)} />
        )}
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari customer..." 
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <FilterHeader columnKey="no_akun" label="No. Akun" />
                <FilterHeader columnKey="nama_customer" label="Nama Customer" />
                <FilterHeader columnKey="site_kota" label="Site / Kota" />
                <FilterHeader columnKey="sales" label="Sales" />
                <th className="p-4 font-semibold text-sm whitespace-nowrap">Aktivitas</th>
                <th className="p-4 font-semibold text-sm text-right w-24 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCustomers.length > 0 ? filteredAndSortedCustomers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-800 font-medium">{c.no_akun || '-'}</td>
                  <td className="p-4 text-sm text-gray-800 font-medium">{c.nama_customer}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {c.site_kota && c.site_kota.length > 0 ? (
                        c.site_kota.map((site, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium border border-green-100">
                            {site}
                          </span>
                        ))
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {c.assigned_sales && c.assigned_sales.length > 0 ? (
                        c.assigned_sales.map(s => (
                          <span key={s.id} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium border border-blue-100">
                            {s.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">Belum ada</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                      0 Aktivitas
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {isSuperAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-gray-400 text-xs italic">
                        No Access
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Belum ada data customer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                {isEditing ? 'Edit Customer' : 'Tambah Customer'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">No. Akun</label>
                    <input 
                      type="text" 
                      name="no_akun"
                      value={formData.no_akun}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Customer</label>
                    <input 
                      type="text" 
                      name="nama_customer"
                      value={formData.nama_customer}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Site / Kota</label>
                    <button 
                      type="button" 
                      onClick={handleAddSite}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                    >
                      <Plus size={14} /> Tambah Site
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.site_kota.map((site, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={site}
                          onChange={(e) => handleSiteTextChange(idx, e.target.value)}
                          placeholder={`Site ${idx + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.site_kota.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSite(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign ke Sales</label>
                  <Select
                    isMulti
                    name="sales"
                    options={salesList.map(sales => ({
                      value: sales.id,
                      label: `${sales.name} (${sales.nama_jabatan})`
                    }))}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    placeholder="Ketik untuk mencari sales..."
                    value={salesList
                      .filter(sales => formData.sales_ids.includes(sales.id))
                      .map(sales => ({
                        value: sales.id,
                        label: `${sales.name} (${sales.nama_jabatan})`
                      }))}
                    onChange={handleSelectChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Anda dapat memilih lebih dari satu sales untuk customer ini.</p>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="customerForm"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
