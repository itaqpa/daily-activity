import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { 
  FileBarChart, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Box, 
  Eye, 
  MapPin, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiUrl } from '../api';

export default function SurveyProductReports() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSurveyProducts = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl('survey-engine/product-drafts'));
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengambil data survey product');
      }
      setData(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setErrorMessage(error.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyProducts();
  }, []);

  // Format tanggal
  const formatTanggal = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || (
        (item.no_survey || '').toLowerCase().includes(search) ||
        (item.customer || '').toLowerCase().includes(search) ||
        (item.lokasi || '').toLowerCase().includes(search) ||
        (item.marketing || '').toLowerCase().includes(search) ||
        (item.leader_surveyor || '').toLowerCase().includes(search)
      );

      // Status
      const matchStatus = selectedStatus === 'all' || 
        (item.status || '').toLowerCase() === selectedStatus.toLowerCase();

      // Date Range
      let matchDate = true;
      if (item.tanggal) {
        const itemDate = new Date(item.tanggal).toISOString().split('T')[0];
        if (startDate && itemDate < startDate) matchDate = false;
        if (endDate && itemDate > endDate) matchDate = false;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [data, searchTerm, selectedStatus, startDate, endDate]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = data.length;
    const selesai = data.filter(d => (d.status || '').toLowerCase() === 'selesai').length;
    const lapangan = data.filter(d => (d.status || '').toLowerCase() === 'lapangan').length;
    const persiapan = data.filter(d => (d.status || '').toLowerCase() === 'persiapan').length;
    
    const totalPercent = data.reduce((acc, curr) => acc + (Number(curr.percent_kelengkapan) || 0), 0);
    const avgKelengkapan = total > 0 ? Math.round(totalPercent / total) : 0;

    return { total, selesai, lapangan, persiapan, avgKelengkapan };
  }, [data]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const exportRows = filteredData.map((item, index) => ({
      'No.': index + 1,
      'No. Survey': item.no_survey || '-',
      'Customer / Client': item.customer || '-',
      'Plant / Area': item.lokasi || '-',
      'Marketing': item.marketing || '-',
      'Leader Surveyor': item.leader_surveyor || '-',
      'Tanggal Survey': formatTanggal(item.tanggal),
      'Status': (item.status || 'Draft').toUpperCase(),
      'Jumlah Item': item.jumlah_item || 0,
      'Jumlah Jenis Produk': item.jumlah_jenis_product || 0,
      'Kelengkapan (%)': `${item.percent_kelengkapan || 0}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Survey Product');
    
    const fileName = `Laporan_Survey_Product_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'selesai') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
        </span>
      );
    }
    if (s === 'lapangan') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Activity className="w-3.5 h-3.5" /> Lapangan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> Persiapan
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <span>Survey Product</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600 font-bold">Laporan & Rekap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <FileBarChart className="w-8 h-8 text-blue-600" />
              Laporan Survey Product
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Pantau rekapitulasi data survey, status kelengkapan form lapangan, dan laporan komprehensif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchSurveyProducts}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Survey</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Box className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.total}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Keseluruhan draft survey</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selesai</span>
              <div className="p-2 rounded-xl bg-green-50 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-green-600">{stats.selesai}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Survey rampung</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lapangan</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{stats.lapangan}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Proses survei lapangan</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Persiapan</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.persiapan}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Tahap persiapan data</p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rata-rata Kelengkapan</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.avgKelengkapan}%</span>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.avgKelengkapan}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Data Laporan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cari Survey / Customer</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="No. survey, plant, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status Survey</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              >
                <option value="all">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="lapangan">Lapangan</option>
                <option value="persiapan">Persiapan</option>
              </select>
            </div>

            {/* Tanggal Mulai */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              >
              </input>
            </div>

            {/* Tanggal Selesai */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-gray-800">Rekap Data Survey</h2>
              <p className="text-xs text-gray-400 mt-0.5">Menampilkan {filteredData.length} data survey dari total {data.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold uppercase text-gray-500 tracking-wider">
                  <th className="py-3.5 px-4">No. Survey</th>
                  <th className="py-3.5 px-4">Customer / Plant</th>
                  <th className="py-3.5 px-4">Marketing</th>
                  <th className="py-3.5 px-4">Leader Surveyor</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4 text-center">Kelengkapan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Memuat data laporan survey...
                    </td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-red-500 font-medium">
                      {errorMessage}
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-400">
                      Tidak ada data survey yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        {item.no_survey || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{item.customer || '-'}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.lokasi || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.marketing || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {item.leader_surveyor || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatTanggal(item.tanggal)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                        {item.jumlah_item || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-extrabold text-xs text-gray-700">
                            {item.percent_kelengkapan || 0}%
                          </span>
                          <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${
                                (item.percent_kelengkapan || 0) >= 80 ? 'bg-green-500' :
                                (item.percent_kelengkapan || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${item.percent_kelengkapan || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/survey-product/${item.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
