import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layouts/MainLayout';
import { apiUrl } from '../../../api';
import { History, Search, Filter } from 'lucide-react';

export default function HistoryLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(apiUrl('/activity-logs'));
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              History & Activity Log
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Rekam jejak seluruh aktivitas penting dari setiap pengguna di dalam sistem.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari aktivitas, user, atau entitas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <span className="text-sm text-gray-500">Menampilkan {filteredLogs.length} aktivitas terbaru</span>
          </div>
        </div>

        {/* Timeline Table / List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 font-semibold text-gray-700 w-48">Waktu</th>
                  <th className="py-4 px-6 font-semibold text-gray-700 w-48">User</th>
                  <th className="py-4 px-6 font-semibold text-gray-700 w-40">Tindakan</th>
                  <th className="py-4 px-6 font-semibold text-gray-700 w-40">Modul</th>
                  <th className="py-4 px-6 font-semibold text-gray-700">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">Loading history...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-400">Tidak ada riwayat aktivitas ditemukan.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-gray-500 font-mono text-xs">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{log.user_name || 'System / Deleted User'}</div>
                        <div className="text-xs text-gray-500">{log.user_role}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {log.entity_type}
                      </td>
                      <td className="py-4 px-6 text-gray-800">
                        {log.description}
                        {log.details && (
                           <div className="mt-1 text-xs text-gray-400 bg-gray-50 p-2 rounded-md font-mono overflow-x-auto">
                              {JSON.stringify(log.details)}
                           </div>
                        )}
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
