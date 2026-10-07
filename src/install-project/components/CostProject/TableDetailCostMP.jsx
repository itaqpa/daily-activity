import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

const fmtRp = (n) =>
    'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

const fmtNum = (n, d = 0) =>
    (Number(n) || 0).toLocaleString('id-ID', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });

const COST_COLS = [
    {
        key: 'scope',
        label: 'Scope',
        cls: '',
    },
    {
        key: 'uniqueManpower',
        label: 'Total Manpower (Org)',
        cls: 'text-right',
        fmt: (v) => fmtNum(v),
    },
    {
        key: 'manHours',
        label: 'Man-Hours',
        cls: 'text-right',
        fmt: (v) => fmtNum(v, 1),
    },
    {
        key: 'manpower',
        label: 'Biaya Manpower',
        cls: 'text-right text-blue-700 font-medium',
        fmt: fmtRp,
    },
    {
        key: 'Akomodasi',
        label: 'Akomodasi',
        cls: 'text-right',
        fmt: fmtRp,
    },
    {
        key: 'Hotel',
        label: 'Hotel',
        cls: 'text-right',
        fmt: fmtRp,
    },
    {
        key: 'Transportasi',
        label: 'Transportasi',
        cls: 'text-right',
        fmt: fmtRp,
    },
    {
        key: 'Consumable',
        label: 'Consumable',
        cls: 'text-right',
        fmt: fmtRp,
    },
    {
        key: 'total',
        label: 'Grand Total',
        cls: 'text-right text-blue-700 font-bold',
        fmt: fmtRp,
    },
];

const UnitRow = ({ unitRow, proj, manpowerData, isMobile }) => {
    const [open, setOpen] = useState(false);
    const [showManpower, setShowManpower] = useState(true);
    const [showLedger, setShowLedger] = useState(true);
    
    // Process manpower rows broken down by date
    const unitManpower = [];
    (manpowerData?.dataJoinSelesai || []).forEach(mp => {
        if (mp.daily) {
            Object.keys(mp.daily).sort().forEach(date => {
                const hrs = mp.daily[date]?.units?.[unitRow.id] || 0;
                if (hrs > 0) {
                    unitManpower.push({
                        ...mp,
                        rowId: `${mp.id}_${date}`,
                        tanggal: date,
                        jamUnit: hrs,
                        biayaUnit: hrs * (Number(mp.rate) || 0)
                    });
                }
            });
        }
    });

    // Filter ledger for this unit
    const unitLedger = (proj.ledger || []).filter(l => l.pembebanan === unitRow.scope || l.pembebanan === 'Prorata Semua Unit');

    if (isMobile) {
        return (
            <div className="flex flex-col border-b border-gray-100 last:border-0">
                <div 
                    className="p-3 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => setOpen(!open)}
                >
                    <div className="flex justify-between items-center mb-2">
                        <div className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                            {open ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            {unitRow.scope || '-'}
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-500 block">Grand Total</span>
                            <span className="font-bold text-blue-700 text-sm">{fmtRp(unitRow.total)}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2 pl-6">
                        <div><span className="text-gray-500 block">Total Manpower:</span> <span className="font-medium text-gray-700">{fmtNum(unitRow.uniqueManpower)}</span></div>
                        <div><span className="text-gray-500 block">Man-Hours:</span> <span className="font-medium text-gray-700">{fmtNum(unitRow.manHours, 1)}</span></div>
                        <div><span className="text-gray-500 block">Biaya Manpower:</span> <span className="font-medium text-blue-600">{fmtRp(unitRow.manpower)}</span></div>
                        <div><span className="text-gray-500 block">Akomodasi:</span> <span className="font-medium text-gray-700">{fmtRp(unitRow.Akomodasi)}</span></div>
                        <div><span className="text-gray-500 block">Hotel:</span> <span className="font-medium text-gray-700">{fmtRp(unitRow.Hotel)}</span></div>
                        <div><span className="text-gray-500 block">Transportasi:</span> <span className="font-medium text-gray-700">{fmtRp(unitRow.Transportasi)}</span></div>
                        <div><span className="text-gray-500 block">Consumable:</span> <span className="font-medium text-gray-700">{fmtRp(unitRow.Consumable)}</span></div>
                    </div>
                </div>
                {open && (
                    <div className="p-3 bg-gray-50/50 space-y-4">
                        {/* Manpower Section */}
                        <div>
                            <h5 
                                className="font-semibold text-gray-700 text-xs mb-2 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => setShowManpower(!showManpower)}
                            >
                                <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span>
                                Section Manpower
                                {showManpower ? <ChevronUp className="w-3 h-3 text-gray-400 ml-1" /> : <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />}
                            </h5>
                            {showManpower && (
                                unitManpower.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {unitManpower.map(mp => (
                                            <div key={mp.rowId} className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs shadow-sm">
                                                <div className="font-semibold text-gray-800">{mp.nama} <span className="text-gray-500 font-normal">({mp.posisi})</span></div>
                                                <div className="flex justify-between items-end mt-1.5">
                                                    <div>
                                                        <span className="text-gray-500 block">Tgl: {mp.tanggal}</span>
                                                        <span className="text-gray-500 block">Jam: {mp.jamUnit} &times; {fmtRp(mp.rate)}</span>
                                                    </div>
                                                    <div className="font-medium text-blue-600 text-sm">{fmtRp(mp.biayaUnit)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-xs text-gray-500 italic">Tidak ada manpower.</div>
                            )}
                        </div>

                        {/* Ledger Section */}
                        <div>
                            <h5 
                                className="font-semibold text-gray-700 text-xs mb-2 flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors"
                                onClick={() => setShowLedger(!showLedger)}
                            >
                                <span className="w-1.5 h-3 bg-green-500 rounded-full"></span>
                                Section Bukti Pengeluaran
                                {showLedger ? <ChevronUp className="w-3 h-3 text-gray-400 ml-1" /> : <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />}
                            </h5>
                            {showLedger && (
                                unitLedger.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {unitLedger.map(l => (
                                            <div key={l.id} className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] text-gray-700">{l.kategori}</span>
                                                    <span className="text-gray-500">{l.tanggal || '-'}</span>
                                                </div>
                                                <div className="text-gray-700 mb-1.5">{l.keterangan || '-'}</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Pembebanan: {l.pembebanan}</span>
                                                    <span className="font-medium text-gray-800 text-sm">{fmtRp(l.jumlah)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-xs text-gray-500 italic">Tidak ada bukti pengeluaran.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <React.Fragment>
            <tr
                className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                {COST_COLS.map((c, i) => (
                    <td key={c.key} className={`px-4 py-2.5 text-sm text-gray-700 ${c.cls}`}>
                        {i === 0 && (
                            <span className="inline-block mr-2 w-4">
                                {open ? <ChevronUp className="w-4 h-4 text-blue-500 inline" /> : <ChevronDown className="w-4 h-4 text-gray-400 inline" />}
                            </span>
                        )}
                        {c.fmt ? c.fmt(unitRow[c.key]) : unitRow[c.key] ?? '-'}
                    </td>
                ))}
            </tr>
            {open && (
                <tr>
                    <td colSpan={COST_COLS.length} className="p-0 bg-gray-50/50 border-b border-gray-200">
                        <div className="p-4 pl-12 space-y-4">
                            {/* Manpower Section */}
                            <div>
                                <h5 
                                    className="font-semibold text-gray-700 text-xs mb-2 flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => setShowManpower(!showManpower)}
                                >
                                    <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span>
                                    Section Manpower
                                    {showManpower ? <ChevronUp className="w-3 h-3 text-gray-400 ml-1" /> : <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />}
                                </h5>
                                {showManpower && (
                                    unitManpower.length > 0 ? (
                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="w-full text-left text-xs bg-white">
                                                <thead className="bg-gray-100 border-b border-gray-200">
                                                    <tr>
                                                        <th className="p-2 font-semibold text-gray-600">Nama Manpower</th>
                                                        <th className="p-2 font-semibold text-gray-600">Posisi</th>
                                                        <th className="p-2 font-semibold text-gray-600">Tanggal</th>
                                                        <th className="p-2 font-semibold text-gray-600 text-right">Jam</th>
                                                        <th className="p-2 font-semibold text-gray-600 text-right">Rate</th>
                                                        <th className="p-2 font-semibold text-gray-600 text-right">Biaya</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {unitManpower.map(mp => (
                                                        <tr key={mp.rowId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                            <td className="p-2 text-gray-800">{mp.nama}</td>
                                                            <td className="p-2 text-gray-600">{mp.posisi}</td>
                                                            <td className="p-2 text-gray-600">{mp.tanggal}</td>
                                                            <td className="p-2 text-right text-gray-800">{mp.jamUnit}</td>
                                                            <td className="p-2 text-right text-gray-500">{fmtRp(mp.rate)}</td>
                                                            <td className="p-2 text-right font-medium text-blue-600">{fmtRp(mp.biayaUnit)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <div className="text-xs text-gray-500 italic">Tidak ada manpower.</div>
                                )}
                            </div>

                            {/* Ledger Section */}
                            <div>
                                <h5 
                                    className="font-semibold text-gray-700 text-xs mb-2 flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors"
                                    onClick={() => setShowLedger(!showLedger)}
                                >
                                    <span className="w-1.5 h-3 bg-green-500 rounded-full"></span>
                                    Section Bukti Pengeluaran
                                    {showLedger ? <ChevronUp className="w-3 h-3 text-gray-400 ml-1" /> : <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />}
                                </h5>
                                {showLedger && (
                                    unitLedger.length > 0 ? (
                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="w-full text-left text-xs bg-white">
                                                <thead className="bg-gray-100 border-b border-gray-200">
                                                    <tr>
                                                        <th className="p-2 font-semibold text-gray-600">Tanggal</th>
                                                        <th className="p-2 font-semibold text-gray-600">Kategori</th>
                                                        <th className="p-2 font-semibold text-gray-600">Keterangan</th>
                                                        <th className="p-2 font-semibold text-gray-600 text-right">Jumlah</th>
                                                        <th className="p-2 font-semibold text-gray-600">Pembebanan</th>
                                                        <th className="p-2 font-semibold text-gray-600 text-center">Bukti</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {unitLedger.map(l => (
                                                        <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                            <td className="p-2 text-gray-800">{l.tanggal || '-'}</td>
                                                            <td className="p-2 text-gray-600"><span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">{l.kategori}</span></td>
                                                            <td className="p-2 text-gray-600">{l.keterangan || '-'}</td>
                                                            <td className="p-2 text-right font-medium text-gray-800">{fmtRp(l.jumlah)}</td>
                                                            <td className="p-2 text-gray-600">{l.pembebanan}</td>
                                                            <td className="p-2 text-center text-gray-400">-</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <div className="text-xs text-gray-500 italic">Tidak ada bukti pengeluaran.</div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

export default function TableDetailCostMP({ proj, index, isMobile }) {
    const [open, setOpen] = useState(false);
    const [manpowerData, setManpowerData] = useState({ dataJoinSelesai: [], units: [] });
    const [loadingManpower, setLoadingManpower] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (open && !hasFetched) {
            setLoadingManpower(true);
            fetch(`http://localhost:8400/api/report/manpower?project_id=${proj.id}`)
                .then(res => res.json())
                .then(data => {
                    setManpowerData(data);
                    setHasFetched(true);
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingManpower(false));
        }
    }, [open, hasFetched, proj.id]);

    if (isMobile) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col">
                <div 
                    className="p-4 flex flex-col gap-3 cursor-pointer"
                    onClick={() => setOpen(!open)}
                >
                    <div className="flex justify-between items-start gap-2">
                        <div className="font-bold text-blue-600 text-base">{proj.no_project || '-'}</div>
                        <div className="text-right">
                            <span className="text-xs text-gray-500 block mb-0.5">Grand Total</span>
                            <span className="font-semibold text-blue-700">{fmtRp(proj.grand_total)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-1">
                        <div>
                            <span className="text-gray-500 text-xs block mb-0.5">Actual Mulai</span>
                            <span className="text-gray-700 font-medium">{proj.actual_mulai || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 text-xs block mb-0.5">Actual Selesai</span>
                            <span className="text-gray-700 font-medium">{proj.actual_selesai || '-'}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-500 text-xs block mb-0.5">Deviasi</span>
                            <span className={`font-medium ${proj.deviasi < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {proj.deviasi !== undefined && proj.deviasi !== null ? fmtRp(proj.deviasi) : '-'}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-center mt-2 border-t border-gray-100 pt-3">
                        {open ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>

                {open && (
                    <div className="p-3 bg-slate-50 border-t border-gray-100 space-y-4 rounded-b-xl">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <h4 className="font-semibold text-gray-800 text-sm">Biaya Per Unit</h4>
                                {loadingManpower && <span className="ml-2 text-xs text-blue-500 animate-pulse">Loading...</span>}
                            </div>
                            <div className="flex flex-col">
                                {proj.dataPerUnit && proj.dataPerUnit.length > 0 ? (
                                    proj.dataPerUnit.map((row, rowIndex) => (
                                        <UnitRow 
                                            key={row.id ?? rowIndex} 
                                            unitRow={row} 
                                            proj={proj} 
                                            manpowerData={manpowerData} 
                                            isMobile={true}
                                        />
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">Tidak ada data per unit.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <tr
                className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors"
                onClick={() => setOpen(!open)}
            >
                <td className="px-4 py-3 text-sm text-gray-500">
                    {index + 1}
                </td>

                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {proj.no_project || '-'}
                </td>

                <td className="px-4 py-3 text-sm text-gray-600">
                    {proj.actual_mulai || '-'}
                </td>

                <td className="px-4 py-3 text-sm text-gray-600">
                    {proj.actual_selesai || '-'}
                </td>

                <td className={`px-4 py-3 text-sm font-medium ${proj.deviasi < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {proj.deviasi !== undefined && proj.deviasi !== null ? fmtRp(proj.deviasi) : '-'}
                </td>

                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                    {fmtRp(proj.grand_total)}
                </td>

                <td className="px-4 py-3 text-right">
                    {open ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 inline" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                    )}
                </td>
            </tr>

            {open && (
                <tr>
                    <td
                        colSpan={7}
                        className="p-0 bg-gray-50 border-b border-gray-200"
                    >
                        <div className="p-4 space-y-6">

                            {/* ============================= */}
                            {/* Table 1: Biaya Per Unit       */}
                            {/* ============================= */}

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4" />
                                    </div>

                                    <h4 className="font-semibold text-gray-800 text-sm">
                                        Biaya Per Unit
                                    </h4>
                                    
                                    {loadingManpower && <span className="ml-2 text-xs text-blue-500 animate-pulse">Loading data...</span>}
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                {COST_COLS.map((c) => (
                                                    <th
                                                        key={c.key}
                                                        className={`px-4 py-3 ${c.cls}`}
                                                    >
                                                        {c.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-100">
                                            {proj.dataPerUnit &&
                                                proj.dataPerUnit.length > 0 ? (
                                                proj.dataPerUnit.map((row, rowIndex) => (
                                                    <UnitRow 
                                                        key={row.id ?? rowIndex} 
                                                        unitRow={row} 
                                                        proj={proj} 
                                                        manpowerData={manpowerData} 
                                                    />
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={COST_COLS.length}
                                                        className="px-4 py-4 text-center text-sm text-gray-500"
                                                    >
                                                        Tidak ada data per unit.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}