import React, { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Filter, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import FormDailyInput from '../DailyProgress/FormDailyInput';
import { apiUrl } from '../../../api';

export default function DailyInputTab({ project }) {
  const [activeFilter, setActiveFilter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const handleTambahCatatan = () => {
    if (window.innerWidth < 768) {
      navigate(`/installation-project/${id}/daily-progress/new`);
    } else {
      setIsModalOpen(true);
    }
  };

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/daily-progress?project_id=${id}`));
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchData(); // Refresh data after modal closes
  };

  const TableHeader = ({ label, filterKey, children }) => {
    return (
      <th className="p-3 font-semibold text-gray-600 relative group">
        <div className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {filterKey && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveFilter(activeFilter === filterKey ? null : filterKey);
              }}
              className={`p-1 rounded transition-colors ${activeFilter === filterKey ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400 group-hover:text-gray-600'}`}
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {activeFilter === filterKey && children && (
          <div 
            className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 shadow-xl rounded-xl p-4 z-[100] font-normal"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setActiveFilter(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors w-full"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </th>
    );
  };

  const MobileCard = ({ row }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3">
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <div className="font-semibold text-gray-800 text-sm">{row.tanggal}</div>
            <div className="text-xs text-gray-500 mt-1">{row.areaUnit}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{row.jamKerja} Jam</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Capaian Hari Itu</span>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-blue-100 bg-blue-50/50">
                  <span className="text-xs font-medium text-blue-800">{row.capaian}</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-0.5">Catatan</span>
              <span className="text-gray-800">{row.catatan}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm" onClick={() => setActiveFilter(null)}>
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 rounded-t-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Riwayat Daily Input</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={handleTambahCatatan}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Catatan
          </button>
        </div>
      </div>

      {/* Modal for Web */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl animate-in fade-in zoom-in duration-200">
            <FormDailyInput onBack={handleCloseModal} project={project} />
          </div>
        </div>
      )}

      {/* Mobile View (Cards) */}
      <div className="md:hidden p-4 bg-gray-50/30">
        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            Belum ada data Daily Input
          </div>
        ) : (
          data.map(row => <MobileCard key={row.id} row={row} />)
        )}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto min-h-[600px] rounded-b-2xl">
        <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <TableHeader label="Tanggal" filterKey="tanggal">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Dari Tanggal</label>
                    <input type="date" className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Sampai Tanggal</label>
                    <input type="date" className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </TableHeader>
              <TableHeader label="Daerah - Unit" filterKey="areaUnit">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Daerah</label>
                    <select className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Semua Daerah</option>
                      {project?.areas?.map(area => (
                        <option key={area.id} value={area.id}>{area.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-600">Unit</label>
                    <select className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm w-full outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Semua Unit</option>
                      {project?.areas?.map(area => 
                        area.units?.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.nama}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </TableHeader>
              <TableHeader label="Jam Kerja" />
              <TableHeader label="Capaian Hari Itu" />
              <TableHeader label="Catatan" />
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  Belum ada data Daily Input
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-800">{row.tanggal}</td>
                  <td className="p-3 text-gray-600 font-medium">{row.areaUnit}</td>
                  <td className="p-3 text-gray-600">{row.jamKerja} Jam</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-blue-200 text-xs font-medium text-blue-700 bg-blue-50/50">
                      {row.capaian}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{row.catatan}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
