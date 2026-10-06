import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Plus, Edit2, Trash2, Search, X, ArrowDown, ArrowUp, ArrowUpDown, Download, UploadCloud, FileText, CheckCircle, Users } from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { apiUrl } from '../../../api';
import FormCustomerPage from '../components/modals/FormCustomerPage';
import Papa from 'papaparse';

export default function DataCustomer() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = (user.jabatan || '').toLowerCase();

  const isSuperAdmin = roleName === 'super admin' || user.username === 'admin' || user.role === 'superadmin';
  const isAdmin = roleName.includes('admin') || isSuperAdmin;
  const isManager = roleName.includes('manager');
  const isSpv = roleName.includes('spv') || roleName.includes('supervisor');
  const isLeader = roleName === 'leader';

  // Hak akses murni menggunakan role/jabatan
  const canEdit = isAdmin || isManager || isSpv || isLeader; // Disesuaikan, misal staff tidak bisa edit
  const canDelete = isAdmin; // Manager tidak bisa delete
  const canApprove = isAdmin || isManager; // Manager bisa approve
  const canImport = isAdmin || isManager;
  const canExport = isAdmin || isManager;

  const isSuperAdminOrAdmin = isAdmin; // Alias for backward compatibility in render

  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewSalesModal, setViewSalesModal] = useState(null);

  // Handlers untuk Import/Export
  const handleExportCSV = () => {
    const csvData = customers.map(c => ({
      'No Akun': c.no_akun || '',
      'Nama Customer': c.nama_customer || '',
      'Site Kota': (c.site_kota || []).join(';'),
      'Sales': (c.assigned_sales || []).map(s => s.name).join(';'),
      'Status': c.status || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_customer.csv';
    link.click();
  };

  const handleImportCSV = () => {
    setIsImportModalOpen(true);
  };

  const downloadFormatCSV = () => {
    // Menambahkan Note pada file CSV
    const csvContent = "data:text/csv;charset=utf-8,# CATATAN: Pisahkan multi value (seperti site_kota atau sales_email) dengan titik koma (;). Baris ini boleh dihapus atau dibiarkan.\nno_akun,nama_customer,site_kota,sales_email\n1001,PT Satu Sales,\"Jakarta\",sales1@email.com\n1002,PT Multi Sales,\"Bandung;Surabaya\",\"sales1@email.com;sales2@email.com\"\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "format_import_customer.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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
      const isManager = user.jabatan?.toLowerCase().includes('manager');

      // Jika bukan Super Admin, SPV, dan Manager, hanya tampilkan customer miliknya sendiri
      if (!isSuperAdmin && !isSPV && !isManager) {
        url.searchParams.append('sales_id', user.id);
      }

      const response = await fetch(url);
      if (response.ok) {
        const rawData = await response.json();
        const normalizedData = rawData.map(c => {
          let sk = c.site_kota;
          if (typeof sk === 'string') {
            try {
              sk = JSON.parse(sk);
            } catch (e) {
              sk = sk.split(/[;,]/).map(s => s.trim()).filter(Boolean);
            }
          }
          if (!Array.isArray(sk)) sk = [];
          return { ...c, site_kota: sk };
        });
        setCustomers(normalizedData);
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
        site_kota: formData.site_kota.filter(site => site.trim() !== ''),
        status: isSuperAdminOrAdmin ? 'approved' : 'pending',
        sales_ids: (isSuperAdminOrAdmin || isManager) ? formData.sales_ids : [user.id]
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

  const handleApprove = async (id) => {
    try {
      const response = await fetch(apiUrl(`/customers/${id}/approve`), {
        method: 'PUT',
      });
      if (response.ok) {
        fetchCustomers();
      } else {
        alert('Gagal meng-approve customer.');
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
        else if (sortConfig.key === 'site_kota') { aVal = (a.site_kota || []).join(', '); bVal = (b.site_kota || []).join(', '); }
        else if (sortConfig.key === 'sales') { aVal = (a.assigned_sales || []).map(s => s.name).join(', '); bVal = (b.assigned_sales || []).map(s => s.name).join(', '); }

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
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Customer</h2>
          <p className="text-gray-600 mt-1">Kelola data pelanggan dan assign ke Sales.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {openFilter && (
          <div className="fixed inset-0 z-50" onClick={() => setOpenFilter(null)} />
        )}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:justify-between items-start lg:items-center bg-gray-50/50 gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari customer..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors sm:w-auto w-full">
              Search
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {(canImport || canExport) && (
              <>
                {canImport && (
                  <button
                    onClick={handleImportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors shadow-sm flex-1 sm:flex-none whitespace-nowrap"
                  >
                    Import CSV
                  </button>
                )}
                {canExport && (
                  <button
                    onClick={handleExportCSV}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors shadow-sm flex-1 sm:flex-none whitespace-nowrap"
                  >
                    Export CSV
                  </button>
                )}
              </>
            )}
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors shadow-sm w-full sm:w-auto sm:flex-none whitespace-nowrap"
            >
              <Plus size={18} />
              Tambah Customer
            </button>
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
                <th className="p-4 font-semibold text-sm whitespace-nowrap">Customer Account Type</th>
                <th className="p-4 font-semibold text-sm whitespace-nowrap">Aktivitas</th>
                <th className="p-4 font-semibold text-sm whitespace-nowrap">Status</th>
                {(canEdit || canDelete || isSuperAdminOrAdmin) && <th className="p-4 font-semibold text-sm text-right w-24 whitespace-nowrap">Aksi</th>}
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
                    {c.assigned_sales && c.assigned_sales.length > 0 ? (
                      <button
                        onClick={() => setViewSalesModal(c)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs rounded-lg font-medium border border-blue-200 transition-colors"
                      >
                        <Users size={14} />
                        <span>{c.assigned_sales.length} Sales</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Belum ada</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {c.assigned_sales && c.assigned_sales.length > 1 ? (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium border border-purple-100">Tandem</span>
                    ) : c.assigned_sales && c.assigned_sales.length === 1 ? (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium border border-blue-100">Individu</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                      0 Aktivitas
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {c.status === 'pending' ? (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md font-medium border border-yellow-100">Pending</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium border border-green-100">Approved</span>
                    )}
                  </td>
                  {(canEdit || canDelete || isSuperAdminOrAdmin) && (
                    <td className="p-4 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'pending' && canApprove && (
                          <button
                            onClick={() => handleApprove(c.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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

      {/* Modal Form Customer */}
      <FormCustomerPage
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isEditing={isEditing}
        formData={formData}
        handleInputChange={handleInputChange}
        handleAddSite={handleAddSite}
        handleSiteTextChange={handleSiteTextChange}
        handleRemoveSite={handleRemoveSite}
        isSuperAdminOrAdmin={isAdmin}
        isManager={isManager}
        salesList={salesList}
        handleSelectChange={handleSelectChange}
        handleSubmit={handleSubmit}
      />

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
                  <p className="text-xs text-gray-500 font-medium">Unggah data customer secara massal</p>
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
                    Gunakan template ini untuk memastikan struktur kolom sesuai (mendukung multi-sales dengan pemisah <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500 font-mono">;</code>).
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
                      complete: async function (results) {
                        const data = results.data.filter(row => {
                          const firstKey = Object.keys(row)[0];
                          return !row[firstKey]?.toString().startsWith('#');
                        });

                        let successCount = 0;
                        for (const row of data) {
                          try {
                            const payload = {
                              no_akun: row.no_akun || '',
                              nama_customer: row.nama_customer || '',
                              site_kota: row.site_kota ? row.site_kota.split(';').map(s => s.trim()) : [],
                              sales_emails: row.sales_email ? row.sales_email.split(';').map(e => e.trim()) : [], // We use emails to match sales in backend or just send it if backend supports it. For now assuming backend handles it or we just add it to note.
                              status: isAdmin ? 'approved' : 'pending'
                            };

                            // Send to backend (adjust endpoint as needed)
                            await fetch(apiUrl('/customers'), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            successCount++;
                          } catch (err) {
                            console.error('Error importing row', row, err);
                          }
                        }
                        alert(`Berhasil mengimport ${successCount} dari ${data.length} baris data.`);
                        fetchCustomers();
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

      {/* Modal View Sales */}
      {viewSalesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Data Sales
              </h3>
              <button
                onClick={() => setViewSalesModal(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Sales yang di-assign ke <span className="font-semibold text-gray-700">{viewSalesModal.nama_customer}</span>:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {viewSalesModal.assigned_sales.map((s, i) => (
                  <div key={s.id || i} className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-700 font-semibold text-sm">
                        {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewSalesModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
