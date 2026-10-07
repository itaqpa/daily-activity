import React, { useState, useEffect } from 'react';
import { DollarSign, ChevronDown, ChevronUp, Plus, Loader2, Info } from 'lucide-react';
import FormCostProject from '../CostProject/FormCostProject';

const API = 'http://localhost:8400';
const fmtRp = n => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const fmtNum = (n, d = 0) => (Number(n) || 0).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

const COST_COLS = [
  { key: 'scope',       label: 'Scope',               cls: '' },
  { key: 'uniqueManpower', label: 'Total Manpower (Org)', cls: 'text-right', fmt: v => fmtNum(v) },
  { key: 'manHours',    label: 'Man-Hours',            cls: 'text-right', fmt: v => fmtNum(v, 1) },
  { key: 'manpower',    label: 'Biaya Manpower',       cls: 'text-right text-blue-700 font-medium', fmt: fmtRp },
  { key: 'Akomodasi',   label: 'Akomodasi',            cls: 'text-right', fmt: fmtRp },
  { key: 'Hotel',       label: 'Hotel',                cls: 'text-right', fmt: fmtRp },
  { key: 'Transportasi',label: 'Transportasi',         cls: 'text-right', fmt: fmtRp },
  { key: 'Consumable',  label: 'Consumable',           cls: 'text-right', fmt: fmtRp },
  { key: 'total',       label: 'Grand Total',          cls: 'text-right text-blue-700 font-bold', fmt: fmtRp },
];

const MobileCardPengeluaran = ({ row }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setOpen(!open)}>
        <div>
          <div className="font-semibold text-gray-800 text-sm">{row.tanggal}</div>
          <div className="text-xs text-gray-500 mt-0.5">{row.kategori}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-md">{fmtRp(row.jumlah)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-sm space-y-2">
          <div><span className="text-xs text-gray-500 block">Keterangan</span><span>{row.keterangan || '-'}</span></div>
          <div><span className="text-xs text-gray-500 block">Pembebanan</span><span>{row.pembebanan}</span></div>
        </div>
      )}
    </div>
  );
};

const MobileCardCostRow = ({ row }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-3">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setOpen(!open)}>
        <div className="font-semibold text-gray-800 text-sm">{row.scope || 'Total'}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{fmtRp(row.total)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-sm grid grid-cols-2 gap-2">
          {COST_COLS.filter(c => c.key !== 'scope').map(col => (
            <div key={col.key}>
              <span className="text-xs text-gray-500 block">{col.label}</span>
              <span>{col.fmt ? col.fmt(row[col.key]) : (row[col.key] ?? '-')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CostTable = ({ title, rows, totRow }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
    <div className="p-4 border-b border-gray-200 bg-gray-50/50">
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="md:hidden p-4 bg-gray-50/30">
      {rows.length === 0
        ? <div className="py-8 text-center text-gray-500 text-sm">Belum ada data</div>
        : rows.map((r, i) => <MobileCardCostRow key={i} row={r} />)
      }
      {totRow && <MobileCardCostRow row={totRow} />}
    </div>
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {COST_COLS.map(col => (
              <th key={col.key} className={`p-3 font-semibold text-gray-600 ${col.cls}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={COST_COLS.length} className="p-8 text-center text-gray-500">Belum ada data {title}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {COST_COLS.map(col => (
                <td key={col.key} className={`p-3 ${col.cls}`}>
                  {col.fmt ? col.fmt(r[col.key]) : (r[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
          {totRow && (
            <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
              {COST_COLS.map(col => (
                <td key={col.key} className={`p-3 ${col.cls}`}>
                  {col.key === 'scope' ? (totRow.scope || 'TOTAL') : col.fmt ? col.fmt(totRow[col.key]) : (totRow[col.key] ?? '')}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function BiayaProyekTab({ project }) {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const fetchCost = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/report/cost?project_id=${project.id}`);
      if (res.ok) setCostData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (project?.id) fetchCost(); }, [project?.id]);

  const ledger = costData?.ledger || [];
  const dataPerUnit = costData?.dataPerUnit || [];
  const dataPerArea = costData?.dataPerArea || [];
  const totalProject = costData?.totalProject || {};
  const pool = costData?.pool_costs || {};
  const totalMH = costData?.totalMH || 0;

  return (
    <div className="space-y-6">
      {!loading && costData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-blue-800">
            <span className="font-semibold">Pool Biaya Prorata</span> (dibagi ke unit berdasar Man-Hours):&nbsp;
            Akomodasi <b>{fmtRp(pool.Akomodasi)}</b> · Hotel <b>{fmtRp(pool.Hotel)}</b> · Transportasi <b>{fmtRp(pool.Transportasi)}</b> · Consumable <b>{fmtRp(pool.Consumable)}</b>&nbsp;
            · Basis Man-Hours: <b>{fmtNum(totalMH, 1)}</b>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Pengeluaran Proyek</h3>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Pengeluaran</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
        <div className="md:hidden p-4 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : ledger.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">Belum ada data Pengeluaran</div>
          ) : (
            ledger.map(row => <MobileCardPengeluaran key={row.id} row={row} />)
          )}
        </div>
        <div className="hidden md:block overflow-x-auto min-h-[200px]">
          <table className="w-full min-w-[700px] text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-600">Tanggal</th>
                <th className="p-3 font-semibold text-gray-600">Kategori</th>
                <th className="p-3 font-semibold text-gray-600">Keterangan</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Jumlah</th>
                <th className="p-3 font-semibold text-gray-600">Pembebanan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Belum ada data Pengeluaran</td></tr>
              ) : (
                ledger.map(row => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">{row.tanggal}</td>
                    <td className="p-3">{row.kategori}</td>
                    <td className="p-3">{row.keterangan || '-'}</td>
                    <td className="p-3 text-right font-semibold text-red-600">{fmtRp(row.jumlah)}</td>
                    <td className="p-3">
                      {row.pembebanan === 'Prorata Semua Unit'
                        ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Prorata Project</span>
                        : <span className="text-gray-700">{row.pembebanan}</span>
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <CostTable title="1) Per Unit" rows={dataPerUnit} totRow={{ scope: 'TOTAL SELURUH UNIT', ...totalProject }} />
          <CostTable title="2) Per Area" rows={dataPerArea} />
          <CostTable title="3) Total Project" rows={[{ scope: 'INSTALLATION PROJECT', ...totalProject }]} />
          <p className="text-xs text-gray-500 px-1">
            Biaya Manpower = jam kerja x rate/jam seluruh anggota group (sesuai komposisi pada tanggal tsb). Seluruh angka diakumulasi s.d. hari ini.
          </p>
        </>
      )}

      {showForm && (
        <FormCostProject project={project} isMobile={isMobile} onClose={() => setShowForm(false)} onSuccess={fetchCost} />
      )}
    </div>
  );
}
