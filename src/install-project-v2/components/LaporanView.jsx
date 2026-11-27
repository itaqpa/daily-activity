import React, { useState, useMemo } from 'react';
import { FileText, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  todayStr,
  isDate,
  addDays,
  weekStart,
  monthOf,
  monthStart,
  monthEnd,
  minD,
  maxD,
  fmtDate,
  fmtMonth,
  fmtRange,
  dataDates,
  weekNo
} from '../utils/calc';
import {
  AUD,
  cellText,
  isNumFmt,
  dailyModel,
  weeklyModel,
  monthlyModel,
  finalModel,
  costCompareModel,
  exportModelToXlsx,
  exportModelToPdf
} from '../utils/reportModels';

export default function LaporanView({ dark, project, days, master, initialType = 'daily', initialDate = '' }) {
  const dd = useMemo(() => dataDates(days), [days]);
  const defaultDate = useMemo(() => {
    if (isDate(initialDate)) return initialDate;
    return minD(todayStr(), maxD(dd.slice(-1)[0] || '', project?.reg?.estStart || '')) || todayStr();
  }, [initialDate, dd, project]);

  const [type, setType] = useState(initialType);
  const [aud, setAud] = useState('internal');
  const [date, setDate] = useState(defaultDate);

  const model = useMemo(() => {
    if (!project) return null;
    const effectiveType = type === 'biaya' && aud === 'customer' ? 'daily' : type;
    if (effectiveType === 'biaya') return costCompareModel(project, days, date, master);
    if (effectiveType === 'daily') return dailyModel(project, days, date, aud, master);
    if (effectiveType === 'weekly') return weeklyModel(project, days, weekStart(date), aud, master);
    if (effectiveType === 'monthly') return monthlyModel(project, days, monthOf(date), aud, master);
    return finalModel(project, days, aud, master);
  }, [project, days, type, aud, date, master]);

  if (!project || !model) return null;

  const types = [
    ['daily', 'Harian'],
    ['weekly', 'Mingguan'],
    ['monthly', 'Bulanan'],
    ['final', 'Akhir project'],
    ...(aud === 'internal' ? [['biaya', 'Biaya rencana vs aktual']] : [])
  ];

  const cardCls = dark
    ? 'bg-[#111b2a] border-[#1e3a5a] text-slate-100'
    : 'bg-white border-slate-200 shadow-sm text-slate-900';
  const inputCls = dark
    ? 'bg-[#162133] border-[#1e3a5a] text-slate-100'
    : 'bg-white border-slate-300 text-slate-900';

  const recentDays = dd.slice(-10).reverse();

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>Laporan</h1>
          <p className="note">
            Versi <b>Internal</b> untuk GM/manajemen (lengkap). Versi <b>Customer</b> tanpa team &amp; kehadiran manpower dan tanpa biaya. Pratinjau sama dengan isi PDF &amp; Excel.
          </p>
        </div>
        <div className="row">
          <div className="seg" role="group" aria-label="Versi laporan">
            {Object.entries(AUD).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setAud(k);
                  if (k === 'customer' && type === 'biaya') setType('daily');
                }}
                className={aud === k ? 'on' : ''}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => exportModelToPdf(model)}
            className="btn pri"
          >
            <FileText className="w-3.5 h-3.5" /> Save PDF
          </button>
          <button
            type="button"
            onClick={() => exportModelToXlsx(model)}
            className="btn"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="seg" role="group" aria-label="Jenis laporan">
            {types.map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={type === k ? 'on' : ''}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="row">
            {(type === 'daily' || type === 'biaya') && (
              <>
                <button type="button" onClick={() => setDate(addDays(date, -1))} className="btn sm" aria-label="Sebelumnya">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => isDate(e.target.value) && setDate(e.target.value)}
                  style={{ width: 'auto' }}
                />
                <button type="button" onClick={() => setDate(addDays(date, 1))} className="btn sm" aria-label="Berikutnya">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            {type === 'weekly' && (() => {
              const ws = weekStart(date);
              return (
                <>
                  <button type="button" onClick={() => setDate(addDays(date, -7))} className="btn sm" aria-label="Minggu sebelumnya">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>
                    <b>Minggu ke-{weekNo(project, ws)}</b> · {fmtRange(ws, addDays(ws, 6))}
                  </span>
                  <button type="button" onClick={() => setDate(addDays(date, 7))} className="btn sm" aria-label="Minggu berikutnya">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              );
            })()}
            {type === 'monthly' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const m = monthOf(date);
                    setDate(monthStart(monthOf(addDays(monthStart(m), -1))));
                  }}
                  className="btn sm"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <b style={{ fontFamily: 'var(--f-mono)', fontSize: 13 }}>{fmtMonth(monthOf(date))}</b>
                <button
                  type="button"
                  onClick={() => {
                    const m = monthOf(date);
                    setDate(monthStart(monthOf(addDays(monthEnd(m), 1))));
                  }}
                  className="btn sm"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            {type === 'final' && (
              <span className="note">
                {project.status === 'closed' ? `Project ditutup ${fmtDate(project.closedAt)}` : 'Project belum ditutup – laporan bertanda draft'}
              </span>
            )}
          </div>
        </div>

        {type === 'daily' && recentDays.length > 0 && (
          <div className="chips" style={{ marginTop: 12 }}>
            {recentDays.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setDate(x)}
                className={`chip ${x === date ? 'on' : ''}`}
              >
                {fmtDate(x)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Preview Paper */}
      <div className="paper space-y-5">
        <div className="kop">
          <img src="/logo/aqpa-indonesia-logo.png" alt="AQPA Indonesia" className="h-12 w-auto object-contain" />
          <div>
            <div className="small" style={{ color: '#0380ff', fontWeight: 700, letterSpacing: '0.04em' }}>AQPA INDONESIA</div>
            <h2>{model.title}</h2>
            {model.subtitle && <div className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{model.subtitle}</div>}
          </div>
        </div>

        {(model.sheets || []).map((sh, si) => (
          <div key={si} className="space-y-4">
            {(sh.blocks || []).map((b, bi) => {
              if (b.t === 'h') {
                return (
                  <h4 key={bi} className={`text-xs font-bold uppercase tracking-wider pt-2 border-b pb-1 ${dark ? 'text-cyan-400 border-[#1e3a5a]' : 'text-sky-700 border-slate-200'}`}>
                    {b.text}
                  </h4>
                );
              }
              if (b.t === 'p') {
                return (
                  <p key={bi} className={`text-xs ${b.ink ? '' : dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {b.text}
                  </p>
                );
              }
              if (b.t === 'kv') {
                return (
                  <div key={bi} className={`grid ${b.cols === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} border rounded-lg overflow-hidden ${dark ? 'border-[#1e3a5a]' : 'border-slate-200'}`}>
                    {(b.rows || []).map(([k, v], ki) => (
                      <div key={ki} className={`px-3 py-2 border-b border-r text-xs ${dark ? 'border-[#0e2540]' : 'border-slate-100'}`}>
                        <div className={`text-[10px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{k}</div>
                        <div className="font-semibold mt-0.5">{cellText(v, b.fmt)}</div>
                      </div>
                    ))}
                  </div>
                );
              }
              if (b.t === 'kpi') {
                return (
                  <div key={bi} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(b.items || []).map((it, ii) => (
                      <div key={ii} className={`rounded-lg border p-3 ${dark ? 'border-[#1e3a5a] bg-[#0d1520]' : 'border-slate-200 bg-slate-50'}`}>
                        <div className={`text-[10px] font-mono uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{it.l}</div>
                        <div className={`text-base font-bold font-mono mt-0.5 ${it.tone === 'bad' ? 'text-rose-400' : it.tone === 'ok' ? 'text-emerald-400' : ''}`}>
                          {it.v}
                        </div>
                        {it.s && <div className={`text-[11px] mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{it.s}</div>}
                      </div>
                    ))}
                  </div>
                );
              }
              if (b.t === 'table') {
                const F = b.fmt || [];
                return (
                  <div key={bi} className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className={`border-b ${dark ? 'bg-[#0d1520] border-[#1e3a5a] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          {b.head.map((h, hi) => (
                            <th key={hi} className={`py-2 px-2.5 font-mono uppercase text-[10px] ${isNumFmt(F[hi]) ? 'text-right' : ''}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${dark ? 'divide-[#0e2540]' : 'divide-slate-100'}`}>
                        {(b.rows || []).length > 0 ? (
                          b.rows.map((r, ri) => {
                            const isTot = (b.tot || []).includes(ri);
                            return (
                              <tr key={ri} className={isTot ? (dark ? 'bg-[#0d1520] font-bold text-cyan-300' : 'bg-slate-50 font-bold text-sky-700') : ''}>
                                {r.map((v, ci) => (
                                  <td key={ci} className={`py-1.5 px-2.5 ${isNumFmt(F[ci]) ? 'text-right font-mono' : ''}`}>
                                    {cellText(v, F[ci])}
                                  </td>
                                ))}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={b.head.length} className={`py-3 px-2.5 text-center ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {b.empty || 'Tidak ada data.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              }
              if (b.t === 'sign') {
                return (
                  <div key={bi} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    {(b.items || []).map((it, sii) => (
                      <div key={sii} className={`border rounded-lg p-3 min-h-[88px] flex flex-col justify-between text-center text-xs ${dark ? 'border-[#1e3a5a]' : 'border-slate-200'}`}>
                        <b>{it.role}</b>
                        <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{it.name || '(…………………………)'}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
