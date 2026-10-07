import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

const MobileCardRekap = ({ row, units }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalBiaya = Number(row.rate || 0) * Number(row.jam || 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div className="font-semibold text-gray-800 text-sm">{row.nama}</div>
          <div className="text-xs text-gray-500 mt-1">{row.posisi}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {row.status}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-xs text-gray-500 block">Mulai</span><span className="text-gray-800">{row.mulai}</span></div>
            <div><span className="text-xs text-gray-500 block">Selesai</span><span className="text-gray-800">{row.selesai}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-xs text-gray-500 block">Hari Kerja</span><span className="text-gray-800">{row.hari} hari</span></div>
            <div><span className="text-xs text-gray-500 block">Total Jam</span><span className="text-gray-800">{row.jam} jam</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-xs text-gray-500 block">Rate Manpower</span><span className="text-gray-800">{formatRp(row.rate)}/jam</span></div>
            <div><span className="text-xs text-gray-500 block">Total Biaya</span><span className="text-gray-800 font-semibold text-blue-600">{formatRp(totalBiaya)}</span></div>
          </div>
          <div className="border-t border-gray-200 pt-3 mt-1">
            <span className="text-xs font-semibold text-gray-700 block mb-2">Rincian Jam per Unit:</span>
            <div className="grid grid-cols-2 gap-2">
              {units.map(u => (
                <div key={u.id}>
                  <span className="text-xs text-gray-500 block">{u.area} - {u.nama}</span>
                  <span className="text-gray-800">{row[`u_${u.id}`] || 0} jam</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DesktopRowRekap = ({ row, units }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <React.Fragment>
      <tr className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`} onClick={() => setIsExpanded(!isExpanded)}>
        <td className="p-3">
          <div className="flex items-center gap-2 text-gray-700">
            {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            {row.no || 1}
          </div>
        </td>
        <td className="p-3 font-medium text-gray-800">{row.nama}</td>
        <td className="p-3">{row.posisi}</td>
        <td className="p-3 text-gray-600">{row.mulai} s.d {row.selesai}</td>
        <td className="p-3 text-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {row.status}
          </span>
        </td>
        <td className="p-3 text-right">{row.hari}</td>
        <td className="p-3 text-right">{row.jam}</td>
        <td className="p-3 text-right text-gray-500">{formatRp(row.rate)}</td>
        <td className="p-3 text-right font-semibold text-blue-700">{formatRp(row.rate * row.jam)}</td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50/80 border-b border-gray-200">
          <td colSpan={9} className="p-4">
            <div className="pl-8 pr-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                Rincian Data Perharian
              </h4>
              {row.daily && Object.keys(row.daily).length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-xs whitespace-nowrap bg-white">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-2 font-semibold text-gray-600">Tanggal</th>
                        {units.map(u => (
                          <th key={u.id} className="p-2 font-semibold text-gray-600 text-center">{u.area}-{u.nama}</th>
                        ))}
                        <th className="p-2 font-semibold text-gray-600 text-right">Total Jam</th>
                        <th className="p-2 font-semibold text-gray-600 text-center">Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(row.daily).sort().map(date => {
                        const dailyData = row.daily[date];
                        return (
                          <tr key={date} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-2">{date}</td>
                            {units.map(u => (
                              <td key={u.id} className="p-2 text-center text-gray-600">{dailyData.units[u.id] || 0}</td>
                            ))}
                            <td className="p-2 font-semibold text-right text-blue-600">{dailyData.total}</td>
                            <td className="p-2 text-center"><span className="text-green-600 font-medium">Hadir</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Belum ada rincian harian.</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default function RekapManpowerBiaya({ dataJoinSelesai = [], units = [], loading = false }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">Rekap Manpower & Biaya</h3>
        <p className="text-xs text-gray-500 mt-1">Periode: awal proyek s.d. saat ini.</p>
      </div>
      
      <div className="md:hidden p-4 bg-gray-50/30">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : dataJoinSelesai.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">Belum ada data Rekap Manpower</div>
        ) : (
          dataJoinSelesai.map(row => <MobileCardRekap key={row.id} row={row} units={units} />)
        )}
      </div>

      <div className="hidden md:block overflow-x-auto min-h-[100px]">
        <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-3 font-semibold text-gray-600 w-16">No</th>
              <th className="p-3 font-semibold text-gray-600">Nama Manpower</th>
              <th className="p-3 font-semibold text-gray-600">Posisi</th>
              <th className="p-3 font-semibold text-gray-600">Mulai - Selesai</th>
              <th className="p-3 font-semibold text-gray-600 text-center">Status</th>
              <th className="p-3 font-semibold text-gray-600 text-right">Hari</th>
              <th className="p-3 font-semibold text-gray-600 text-right">Jam</th>
              <th className="p-3 font-semibold text-gray-600 text-right">Rate/Jam</th>
              <th className="p-3 font-semibold text-gray-600 text-right pr-6">Total Biaya</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></td>
              </tr>
            ) : dataJoinSelesai.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  Belum ada data Rekap Manpower
                </td>
              </tr>
            ) : (
              dataJoinSelesai.map((row, index) => (
                <DesktopRowRekap key={row.id} row={{...row, no: index + 1}} units={units} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
