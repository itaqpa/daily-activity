import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, Calendar } from 'lucide-react';
import RekapManpowerBiaya from '../CostProject/RekapManpowerBiaya';

export default function ReportTab({ project }) {
  const [data, setData] = useState({
    units: [],
    dataJoinSelesai: [],
    dataManpowerUnit: [],
    dataManHour: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8400/api/report/manpower?project_id=${project.id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (project?.id) fetchData();
  }, [project?.id]);

  const { units, dataJoinSelesai, dataManpowerUnit, dataManHour } = data;

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');



  const MobileCardManHour = ({ row }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div className="mb-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              {row.tanggal}
            </div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
              <span>Total: <span className="font-semibold text-gray-700">{row.total}</span> Jam</span>
              <span>Hadir: <span className="font-semibold text-gray-700">{row.hadir}</span> Org</span>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
        {isExpanded && (
          <div className="p-4 bg-gray-50/80 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Rincian Jam per Unit
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {units.map(u => (
                <div key={u.id} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                  <span className="text-[10px] text-gray-500">{u.area}</span>
                  <span className="text-xs font-medium text-gray-800 line-clamp-1" title={u.nama}>{u.nama}</span>
                  <span className="text-sm font-bold text-blue-600 mt-1.5">{row[`u_${u.id}`] || 0} Jam</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const DesktopRowManHour = ({ row }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <React.Fragment>
        <tr className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
          <td className="p-3">
            <div className="flex items-center gap-2 text-gray-700">
              {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              {row.tanggal}
            </div>
          </td>
          <td className="p-3 font-semibold text-right">{row.total}</td>
          <td className="p-3 text-right">{row.hadir} Org</td>
        </tr>
        {isExpanded && (
          <tr className="bg-gray-50/80 border-b border-gray-200">
            <td colSpan={3} className="p-4">
              <div className="pl-8">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                  Rincian Jam per Unit
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {units.map(u => (
                    <div key={u.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col hover:border-blue-300 transition-colors">
                      <span className="text-xs text-gray-500">{u.area}</span>
                      <span className="text-sm font-medium text-gray-800 line-clamp-1" title={u.nama}>{u.nama}</span>
                      <span className="text-sm font-bold text-blue-600 mt-2">{row[`u_${u.id}`] || 0} Jam</span>
                    </div>
                  ))}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Rekap Manpower & Biaya */}
      <RekapManpowerBiaya dataJoinSelesai={dataJoinSelesai} units={units} loading={loading} />

      {/* Card 3: Man-Hour Harian */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Man-Hour Harian</h3>
          <p className="text-xs text-gray-500 mt-1">Periode: awal proyek s.d. saat ini.</p>
        </div>
        <div className="md:hidden p-4 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : dataManHour.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">Belum ada data Man-Hour Harian</div>
          ) : (
            dataManHour.map(row => <MobileCardManHour key={row.id} row={row} />)
          )}
        </div>
        <div className="hidden md:block overflow-x-auto min-h-[300px]">
          <table className="w-full min-w-[600px] text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-3 font-semibold text-gray-600 w-32">Tanggal</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Total Man-Hours</th>
                <th className="p-3 font-semibold text-gray-600 text-right pr-6">Manpower Hadir</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></td>
                </tr>
              ) : dataManHour.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Belum ada data Man-Hour Harian
                  </td>
                </tr>
              ) : (
                dataManHour.map(row => (
                  <DesktopRowManHour key={row.id} row={row} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
