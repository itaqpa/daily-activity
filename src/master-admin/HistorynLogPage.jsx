import React, { useState, useEffect, useMemo, useRef } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { apiUrl } from '../api';
import { Search, Clock, User, Shield, AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

// Custom hook for clicking outside
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// Reusable Filter Dropdown Component
function ColumnFilter({ title, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();
  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <div className="relative inline-flex items-center gap-1 cursor-pointer" ref={ref}>
      <div className="flex items-center gap-1 hover:text-blue-600" onClick={() => setIsOpen(!isOpen)}>
        {title}
        <Filter className={`w-3 h-3 ${value !== 'ALL' ? 'text-blue-600' : 'text-gray-400'}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-lg py-1 min-w-[150px] z-10 max-h-60 overflow-y-auto">
          {options.map(opt => (
            <div 
              key={opt}
              className={`px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors ${value === opt ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistorynLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchLogs = () => {
    setLoading(true);
    fetch(apiUrl('/global-logs'))
      .then(res => res.json())
      .then(data => {
        setLogs(data);
      })
      .catch(err => console.error('Failed to fetch logs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueModules = useMemo(() => ['ALL', ...new Set(logs.map(l => l.module).filter(Boolean))], [logs]);
  const uniqueUsers = useMemo(() => ['ALL', ...new Set(logs.map(l => l.username).filter(Boolean))], [logs]);
  const uniqueActions = useMemo(() => ['ALL', ...new Set(logs.map(l => l.action).filter(Boolean))], [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = (log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchModule = filterModule === 'ALL' || log.module === filterModule;
      const matchUser = filterUser === 'ALL' || log.username === filterUser;
      const matchAction = filterAction === 'ALL' || log.action === filterAction;
      return matchSearch && matchModule && matchUser && matchAction;
    });
  }, [logs, searchTerm, filterModule, filterUser, filterAction]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterModule, filterUser, filterAction, itemsPerPage]);

  const paginatedLogs = useMemo(() => {
    if (itemsPerPage === 'ALL') return filteredLogs;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === 'ALL' ? 1 : Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Sistem History & Global Logs
            </h1>
            <p className="text-gray-500 text-sm mt-1">Audit jejak aktivitas semua modul dan user di dalam sistem.</p>
          </div>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari action, deskripsi, atau ip address..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
              <div className="overflow-visible min-h-[300px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">
                        <ColumnFilter title="User" options={uniqueUsers} value={filterUser} onChange={setFilterUser} />
                      </th>
                      <th className="py-3 px-4">
                        <ColumnFilter title="Modul" options={uniqueModules} value={filterModule} onChange={setFilterModule} />
                      </th>
                      <th className="py-3 px-4">
                        <ColumnFilter title="Action" options={uniqueActions} value={filterAction} onChange={setFilterAction} />
                      </th>
                      <th className="py-3 px-4">Deskripsi</th>
                      <th className="py-3 px-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {log.username}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800 font-medium">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {log.description}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs font-mono">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))}
                    {paginatedLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-500">
                          Tidak ada log yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {/* Filter indicator for mobile */}
              {(filterUser !== 'ALL' || filterModule !== 'ALL' || filterAction !== 'ALL') && (
                <div className="flex flex-wrap gap-2 mb-2 text-xs">
                  {filterUser !== 'ALL' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">User: {filterUser}</span>}
                  {filterModule !== 'ALL' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Modul: {filterModule}</span>}
                  {filterAction !== 'ALL' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Action: {filterAction}</span>}
                  <button onClick={() => { setFilterUser('ALL'); setFilterModule('ALL'); setFilterAction('ALL'); }} className="text-red-500 font-medium underline">Reset Filter</button>
                </div>
              )}

              {paginatedLogs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-lg">{log.action}</span>
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded mt-1">
                        {log.module}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs">User</span>
                      <span className="font-medium text-gray-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {log.username}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs">IP Address</span>
                      <span className="text-gray-600 font-mono text-xs mt-0.5">{log.ip_address}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-400 block mb-1">Deskripsi:</span>
                    <p className="text-gray-700 text-sm">{log.description}</p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                    <span>{new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
              
              {paginatedLogs.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500 flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                  <p>Tidak ada log yang ditemukan.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredLogs.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Tampilkan:</span>
                  <select
                    className="border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  >
                    <option value={20}>20</option>
                    <option value={40}>40</option>
                    <option value={80}>80</option>
                    <option value={160}>160</option>
                    <option value="ALL">All</option>
                  </select>
                  <span>data per halaman</span>
                </div>
                
                {itemsPerPage !== 'ALL' && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
