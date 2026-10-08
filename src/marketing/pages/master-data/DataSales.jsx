import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layouts/MainLayout';
import { Users, X, ArrowDown, ArrowUp, ArrowUpDown, Search, Download } from 'lucide-react';
import { apiUrl } from '../../../api';
import Papa from 'papaparse';
import Select from 'react-select';
import { useAuth } from '../../../context/AuthContext';

export default function DataSales() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('sales_export');
  
  const [salesData, setSalesData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedSales, setSelectedSales] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState(null);
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState('all');
  const [exportSalesIds, setExportSalesIds] = useState([]);

  const handleExportCSV = () => {
    let salesToExport = [];
    if (exportTarget === 'all') {
      salesToExport = salesData;
    } else {
      if (!exportSalesIds || exportSalesIds.length === 0) {
        alert('Pilih minimal satu sales terlebih dahulu.');
        return;
      }
      salesToExport = salesData.filter(s => exportSalesIds.includes(s.id));
    }

    const csvData = [];
    salesToExport.forEach(sales => {
      if (sales.assigned_customers && sales.assigned_customers.length > 0) {
        sales.assigned_customers.forEach(cust => {
          csvData.push({
            'No. Pelanggan': cust.no_akun || '',
            'Nama Perusahaan': cust.nama_customer || '',
            'Kota': cust.site_kota ? (Array.isArray(cust.site_kota) ? cust.site_kota.join('; ') : cust.site_kota) : '',
            'Nama Marketing': sales.name || ''
          });
        });
      }
    });

    if (csvData.length === 0) {
      alert('Tidak ada data customer untuk di-export pada pilihan ini.');
      return;
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_sales_${new Date().getTime()}.csv`;
    link.click();
    setIsExportModalOpen(false);
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch(apiUrl('/sales'));
      if (!response.ok) {
        throw new Error('Gagal mengambil data sales');
      }
      const data = await response.json();
      setSalesData(data);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat memuat data sales.');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerModal = (sales) => {
    setSelectedSales(sales);
    setIsModalOpen(true);
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
      name: new Set(),
      email: new Set(),
      nama_jabatan: new Set(),
    };

    salesData.forEach(s => {
      if (s.name) opts.name.add(s.name);
      if (s.email) opts.email.add(s.email);
      if (s.nama_jabatan) opts.nama_jabatan.add(s.nama_jabatan);
    });

    return {
      name: Array.from(opts.name).sort(),
      email: Array.from(opts.email).sort(),
      nama_jabatan: Array.from(opts.nama_jabatan).sort(),
    };
  }, [salesData]);

  const filteredAndSortedSales = React.useMemo(() => {
    let result = [...salesData];

    if (globalSearch) {
      const s = globalSearch.toLowerCase();
      result = result.filter(x =>
        (x.name && x.name.toLowerCase().includes(s)) ||
        (x.email && x.email.toLowerCase().includes(s))
      );
    }

    result = result.filter(x => {
      if (filters.name && x.name !== filters.name) return false;
      if (filters.email && x.email !== filters.email) return false;
      if (filters.nama_jabatan && x.nama_jabatan !== filters.nama_jabatan) return false;
      return true;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = '', bVal = '';
        if (sortConfig.key === 'name') { aVal = a.name || ''; bVal = b.name || ''; }
        else if (sortConfig.key === 'email') { aVal = a.email || ''; bVal = b.email || ''; }
        else if (sortConfig.key === 'nama_jabatan') { aVal = a.nama_jabatan || ''; bVal = b.nama_jabatan || ''; }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [salesData, filters, sortConfig, globalSearch]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
  };

  const FilterHeader = ({ columnKey, label }) => {
    const isActive = !!filters[columnKey];
    return (
      <th className="py-4 px-6 font-medium text-gray-600 relative whitespace-nowrap group align-middle">
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
          <h2 className="text-2xl font-bold text-gray-800">Data Tim Sales</h2>
          <p className="text-gray-600 mt-1">Daftar seluruh staf dan supervisor di Divisi Sales.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        {openFilter && (
          <div className="fixed inset-0 z-50" onClick={() => setOpenFilter(null)} />
        )}

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari sales atau email..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Search
            </button>
          </div>
          <div className="flex w-full sm:w-auto">
            {canExport && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error}
          </div>
        )}

        {/* Table Desktop */}
        <div className="hidden md:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 font-medium text-gray-600 whitespace-nowrap">No</th>
                <FilterHeader columnKey="name" label="Nama Lengkap" />
                <FilterHeader columnKey="email" label="Email" />
                <FilterHeader columnKey="nama_jabatan" label="Jabatan" />
                <th className="py-4 px-6 font-medium text-gray-600 whitespace-nowrap">Data Customer</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredAndSortedSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    Tidak ada data sales yang cocok.
                  </td>
                </tr>
              ) : (
                filteredAndSortedSales.map((sales, index) => (
                  <tr key={sales.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-600">{index + 1}</td>
                    <td className="py-4 px-6 text-gray-800 font-medium">{sales.name}</td>
                    <td className="py-4 px-6 text-gray-600">{sales.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${sales.nama_jabatan === 'Spv'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {sales.nama_jabatan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => openCustomerModal(sales)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                      >
                        <Users size={16} />
                        <span className="font-semibold">{sales.assigned_customers ? sales.assigned_customers.length : 0} Customer</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card Mobile */}
        <div className="md:hidden flex flex-col gap-3 p-4">
          {loading ? (
            <div className="text-center p-8 text-gray-500 text-sm bg-gray-50 rounded-xl border border-gray-100">Memuat data...</div>
          ) : filteredAndSortedSales.length === 0 ? (
            <div className="text-center p-8 text-gray-500 text-sm bg-gray-50 rounded-xl border border-gray-100">Tidak ada data sales yang cocok.</div>
          ) : (
            filteredAndSortedSales.map((sales, index) => (
              <div key={sales.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{index + 1}</span>
                      <h3 className="font-bold text-gray-800 text-sm">{sales.name}</h3>
                    </div>
                    <p className="text-[11px] text-gray-500">{sales.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap ${sales.nama_jabatan === 'Spv' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {sales.nama_jabatan}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Total Customer</span>
                  <button onClick={() => openCustomerModal(sales)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs rounded-lg font-medium border border-blue-200 transition-colors shadow-sm">
                    <Users size={14} />
                    <span>{sales.assigned_customers ? sales.assigned_customers.length : 0} Customer</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Customer List Modal */}
      {isModalOpen && selectedSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Daftar Customer</h3>
                <p className="text-sm text-gray-500 mt-1">Assigned ke: <span className="font-semibold text-gray-700">{selectedSales.name}</span></p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50/50">
              {selectedSales.assigned_customers && selectedSales.assigned_customers.length > 0 ? (
                <div className="space-y-3">
                  {selectedSales.assigned_customers.map(cust => (
                    <div key={cust.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-800 text-sm">{cust.nama_customer}</span>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{cust.no_akun || 'No Akun'}</span>
                      </div>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {cust.site_kota || 'Lokasi tidak diketahui'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Belum ada customer yang di-assign.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 tracking-tight">Export Data Sales</h3>
                  <p className="text-xs text-gray-500 font-medium">Download data customer dari sales</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Export</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportTarget"
                      value="all"
                      checked={exportTarget === 'all'}
                      onChange={() => setExportTarget('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Semua Sales</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportTarget"
                      value="specific"
                      checked={exportTarget === 'specific'}
                      onChange={() => setExportTarget('specific')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Sales Tertentu</span>
                  </label>
                </div>
              </div>

              {exportTarget === 'specific' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Sales</label>
                  <Select
                    isMulti
                    options={salesData.map(sales => ({
                      value: sales.id,
                      label: `${sales.name} (${sales.nama_jabatan})`
                    }))}
                    className="text-sm"
                    placeholder="Cari sales..."
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }),
                    }}
                    value={
                      exportSalesIds.map(id => ({
                        value: id,
                        label: salesData.find(s => s.id === id)?.name || ''
                      }))
                    }
                    onChange={(selected) => setExportSalesIds(selected ? selected.map(s => s.value) : [])}
                    isClearable
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Download size={18} />
                Export Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
