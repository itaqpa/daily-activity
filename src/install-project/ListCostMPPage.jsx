import React, { useState, useEffect, useMemo } from 'react';
import { Coins, Loader2, RefreshCcw, Calendar, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';
import MainLayout from '../components/layouts/MainLayout';
import TableDetailCostMP from './components/CostProject/TableDetailCostMP';
import CostDashboard from './components/DataPengeluaran/CostDashboard';
import { currentMonthRange } from './components/DataPengeluaran/costSummary';

const API_BASE = 'http://localhost:8400';

export default function ListCostMPPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [range, setRange] = useState(currentMonthRange());
    const [projectId, setProjectId] = useState('all');
    const [pageSize, setPageSize] = useState(15);
    const [page, setPage] = useState(1);

    const filtered = useMemo(
        () => (projectId === 'all' ? data : data.filter((p) => String(p.id) === projectId)),
        [data, projectId]
    );

    const [search, setSearch] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const emptyFilter = { status: 'all', minTotal: '', maxTotal: '', mulaiFrom: '', mulaiTo: '' };
    const [tf, setTf] = useState(emptyFilter);
    const activeFilterCount = Object.entries(tf).filter(([k, v]) => (k === 'status' ? v !== 'all' : v !== '')).length;

    useEffect(() => { setPage(1); }, [projectId, search, tf]);

    // Data tabel setelah search + filter corong
    const tableRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return filtered.filter((p) => {
            if (q) {
                const hay = [p.no_project, ...(p.dataPerUnit || []).map((u) => u.scope)].join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (tf.status === 'under' && !(p.deviasi >= 0)) return false;
            if (tf.status === 'over' && !(p.deviasi < 0)) return false;
            if (tf.status === 'nodata' && p.actual_mulai) return false;
            if (tf.minTotal !== '' && p.grand_total < Number(tf.minTotal)) return false;
            if (tf.maxTotal !== '' && p.grand_total > Number(tf.maxTotal)) return false;
            if (tf.mulaiFrom && (!p.actual_mulai || p.actual_mulai < tf.mulaiFrom)) return false;
            if (tf.mulaiTo && (!p.actual_mulai || p.actual_mulai > tf.mulaiTo)) return false;
            return true;
        });
    }, [filtered, search, tf]);

    const size = pageSize === 'all' ? Math.max(tableRows.length, 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(tableRows.length / size));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * size;
    const paged = tableRows.slice(startIdx, startIdx + size);

    // Nomor halaman ringkas: 1 … 4 5 6 … 20
    const pageNumbers = useMemo(() => {
        const set = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
        const nums = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
        const out = [];
        nums.forEach((n, i) => {
            if (i > 0 && n - nums[i - 1] > 1) out.push('…');
            out.push(n);
        });
        return out;
    }, [totalPages, currentPage]);

    const fetchAllCosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_BASE}/api/report/all-costs`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error('Failed to fetch costs:', err);
            setError('Gagal memuat data pengeluaran');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCosts();
    }, []);

    return (
    <MainLayout>
      <div className="p-6 w-full max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Data Pengeluaran Proyek
            </h1>

            <p className="text-gray-500 mt-1">
              Rekapitulasi biaya dan manpower untuk semua proyek
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                id="filter-start"
                type="date"
                value={range.start}
                onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                className="outline-none text-gray-700"
              />
              <span className="text-gray-400">-</span>
              <input
                id="filter-end"
                type="date"
                value={range.end}
                onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                className="outline-none text-gray-700"
              />
            </div>

            <select
              id="filter-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 outline-none"
            >
              <option value="all">Semua Project</option>
              {data.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.no_project}</option>
              ))}
            </select>

            <button
              id="btn-refresh"
              onClick={fetchAllCosts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
            >
              <RefreshCcw
                className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''
                  }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <CostDashboard projects={filtered} allProjects={data} start={range.start} end={range.end} />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar: search + filter corong */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Daftar Pengeluaran Project</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="table-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari no project / unit..."
                  className="w-64 pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                id="btn-filter"
                onClick={() => setShowFilter((v) => !v)}
                className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilter || activeFilterCount ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
            </div>
          </div>

          {showFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3 bg-gray-50/70 border-b border-gray-200 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Status Deviasi</span>
                <select id="f-status" value={tf.status} onChange={(e) => setTf({ ...tf, status: e.target.value })} className="px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none">
                  <option value="all">Semua</option>
                  <option value="under">Dalam Budget</option>
                  <option value="over">Over Budget</option>
                  <option value="nodata">Belum Ada Aktual</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Grand Total (Rp)</span>
                <div className="flex items-center gap-1">
                  <input id="f-min" type="number" placeholder="Min" value={tf.minTotal} onChange={(e) => setTf({ ...tf, minTotal: e.target.value })} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                  <span className="text-gray-400">-</span>
                  <input id="f-max" type="number" placeholder="Max" value={tf.maxTotal} onChange={(e) => setTf({ ...tf, maxTotal: e.target.value })} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Actual Mulai</span>
                <div className="flex items-center gap-1">
                  <input id="f-from" type="date" value={tf.mulaiFrom} onChange={(e) => setTf({ ...tf, mulaiFrom: e.target.value })} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                  <span className="text-gray-400">-</span>
                  <input id="f-to" type="date" value={tf.mulaiTo} onChange={(e) => setTf({ ...tf, mulaiTo: e.target.value })} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg outline-none" />
                </div>
              </label>
              <div className="flex items-end">
                <button
                  id="f-reset"
                  onClick={() => setTf(emptyFilter)}
                  disabled={!activeFilterCount}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40"
                >
                  <X className="w-4 h-4" /> Reset Filter
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto min-h-[840px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">No Project</th>
                  <th className="px-4 py-3">Actual Mulai</th>
                  <th className="px-4 py-3">Actual Selesai</th>
                  <th className="px-4 py-3">Deviasi</th>
                  <th className="px-4 py-3 text-right">
                    Grand Total
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center"
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />

                      <p className="mt-2 text-sm text-gray-500">
                        Memuat data pengeluaran...
                      </p>
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Tidak ada data proyek.
                    </td>
                  </tr>
                ) : (
                  paged.map((proj, idx) => (
                    <TableDetailCostMP
                      key={proj.id}
                      proj={proj}
                      index={startIdx + idx}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: page size + pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/60 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span>Tampilkan</span>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => { setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 bg-white border border-gray-200 rounded-md outline-none"
              >
                {[15, 30, 90, 180].map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="all">All</option>
              </select>
              <span>
                data &middot; {tableRows.length === 0 ? 0 : startIdx + 1}–{startIdx + paged.length} dari {tableRows.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="page-prev"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${n === currentPage ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                id="page-next"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
