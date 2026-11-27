import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, ArrowUp, ArrowDown, Save, FileSpreadsheet, FileText } from 'lucide-react';
import { KATEGORI, SOURCES, num, bobotOk, fmtPct, costPrefix, rid, clone } from '../utils/calc';
import { masterModel, exportModelToXlsx, exportModelToPdf } from '../utils/reportModels';

export default function MasterDataView({ dark, master, onUpdateMaster }) {
  const [m, setM] = useState(() =>
    clone(master || { products: [], jobs: [], levels: [], codes: {} })
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (master) setM(clone(master));
  }, [master]);

  const tj = (m.jobs || []).reduce((s, j) => s + num(j.bobot), 0);
  const jobValid = bobotOk(tj);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/install-project-v2/master', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m)
      });
      if (!res.ok) throw new Error('Gagal menyimpan master data');
      onUpdateMaster(clone(m));
      setMsg('Master data berhasil disimpan');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan master data');
    } finally {
      setSaving(false);
    }
  };

  const cardCls = dark
    ? 'bg-[#111b2a] border-[#1e3a5a] text-slate-100'
    : 'bg-white border-slate-200 shadow-sm text-slate-900';
  const inputCls = dark
    ? 'bg-[#162133] border-[#1e3a5a] text-slate-100 focus:border-cyan-400'
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Master Data
          </h2>
          <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Data validasi untuk semua project: daftar produk, detail pekerjaan default (Tabel 1), level manpower &amp; rate (Tabel 2), dan kode nomor biaya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportModelToPdf(masterModel(m))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
              dark ? 'border-[#1e3a5a] bg-[#111b2a] hover:border-cyan-400 text-slate-200' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Save PDF
          </button>
          <button
            type="button"
            onClick={() => exportModelToXlsx(masterModel(m))}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
              dark ? 'border-[#1e3a5a] bg-[#111b2a] hover:border-cyan-400 text-slate-200' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 ${
              dark ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Master'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-xs font-medium border ${
          dark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {msg}
        </div>
      )}

      {/* Daftar Produk */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Daftar Produk yang Diinstal</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Pilihan produk di Plan Awal.</p>
          </div>
          <button
            type="button"
            onClick={() => setM((prev) => ({ ...prev, products: [...prev.products, { id: rid('pr'), code: '', name: '' }] }))}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
              dark ? 'border-[#1e3a5a] hover:border-cyan-400 text-cyan-300' : 'border-slate-200 hover:bg-slate-50 text-sky-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Produk
          </button>
        </div>
        <div className="overflow-x-auto max-w-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b ${dark ? 'border-[#1e3a5a] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2 px-2 w-10">No</th>
                <th className="py-2 px-2 w-24">Kode</th>
                <th className="py-2 px-2">Produk</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-[#0e2540]' : 'divide-slate-100'}`}>
              {(m.products || []).map((x, idx) => (
                <tr key={x.id}>
                  <td className="py-1.5 px-2 font-mono">{idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <input
                      value={x.code || ''}
                      maxLength={5}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setM((prev) => ({
                          ...prev,
                          products: prev.products.map((it) => (it.id === x.id ? { ...it, code: val } : it))
                        }));
                      }}
                      className={`w-20 px-2 py-1 rounded border font-mono uppercase text-xs ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      value={x.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setM((prev) => ({
                          ...prev,
                          products: prev.products.map((it) => (it.id === x.id ? { ...it, name: val } : it))
                        }));
                      }}
                      className={`w-full min-w-[220px] px-2 py-1 rounded border text-xs ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <button
                      type="button"
                      disabled={m.products.length <= 1}
                      onClick={() => setM((prev) => ({ ...prev, products: prev.products.filter((it) => it.id !== x.id) }))}
                      className="p-1 text-rose-400 hover:bg-rose-500/10 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel 1: Detail Pekerjaan */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm">Tabel 1 · Detail Pekerjaan Default</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Dipakai otomatis untuk setiap item baru di Plan Awal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              jobValid
                ? dark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : dark ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              Total {fmtPct(tj, 2)}
            </span>
            <button
              type="button"
              onClick={() => setM((prev) => ({ ...prev, jobs: [...prev.jobs, { id: rid('j'), name: '', bobot: 0 }] }))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                dark ? 'border-[#1e3a5a] hover:border-cyan-400 text-cyan-300' : 'border-slate-200 hover:bg-slate-50 text-sky-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Job
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-w-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b ${dark ? 'border-[#1e3a5a] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2 px-2 w-10">No</th>
                <th className="py-2 px-2">Job</th>
                <th className="py-2 px-2 w-28">Bobot (%)</th>
                <th className="py-2 px-2 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-[#0e2540]' : 'divide-slate-100'}`}>
              {(m.jobs || []).map((j, idx) => (
                <tr key={j.id}>
                  <td className="py-1.5 px-2 font-mono">{idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <input
                      value={j.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setM((prev) => ({
                          ...prev,
                          jobs: prev.jobs.map((it) => (it.id === j.id ? { ...it, name: val } : it))
                        }));
                      }}
                      className={`w-full min-w-[220px] px-2 py-1 rounded border text-xs ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={+(num(j.bobot) * 100).toFixed(2)}
                      onChange={(e) => {
                        const val = Math.max(0, num(e.target.value)) / 100;
                        setM((prev) => ({
                          ...prev,
                          jobs: prev.jobs.map((it) => (it.id === j.id ? { ...it, bobot: val } : it))
                        }));
                      }}
                      className={`w-24 px-2 py-1 rounded border text-xs text-right font-mono ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        setM((prev) => {
                          const arr = [...prev.jobs];
                          [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                          return { ...prev, jobs: arr };
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === m.jobs.length - 1}
                      onClick={() => {
                        setM((prev) => {
                          const arr = [...prev.jobs];
                          [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                          return { ...prev, jobs: arr };
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={m.jobs.length <= 1}
                      onClick={() => setM((prev) => ({ ...prev, jobs: prev.jobs.filter((it) => it.id !== j.id) }))}
                      className="p-1 text-rose-400 hover:bg-rose-500/10 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel 2: Level Manpower */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Tabel 2 · Level Manpower &amp; Rate</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Internal = manpower AQPA Indonesia · External = daily manpower khusus project. Rate per 8 jam; jam &gt; 8 dihitung lembur per jam.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setM((prev) => ({ ...prev, levels: [...prev.levels, { id: rid('v'), source: 'External', level: '', rate: 0, ot: 0 }] }))}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
              dark ? 'border-[#1e3a5a] hover:border-cyan-400 text-cyan-300' : 'border-slate-200 hover:bg-slate-50 text-sky-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Level
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b ${dark ? 'border-[#1e3a5a] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2 px-2">Source</th>
                <th className="py-2 px-2">Manpower Level</th>
                <th className="py-2 px-2">Rate per 8 hours (Rp)</th>
                <th className="py-2 px-2">Overtime / hour (Rp)</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-[#0e2540]' : 'divide-slate-100'}`}>
              {(m.levels || []).map((v) => (
                <tr key={v.id}>
                  <td className="py-1.5 px-2">
                    <select
                      value={v.source || 'Internal'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setM((prev) => ({
                          ...prev,
                          levels: prev.levels.map((it) => (it.id === v.id ? { ...it, source: val } : it))
                        }));
                      }}
                      className={`px-2 py-1 rounded border text-xs ${inputCls}`}
                    >
                      {SOURCES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      value={v.level || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setM((prev) => ({
                          ...prev,
                          levels: prev.levels.map((it) => (it.id === v.id ? { ...it, level: val } : it))
                        }));
                      }}
                      className={`w-full min-w-[140px] px-2 py-1 rounded border text-xs ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min="0"
                      value={num(v.rate)}
                      onChange={(e) => {
                        const val = num(e.target.value);
                        setM((prev) => ({
                          ...prev,
                          levels: prev.levels.map((it) => (it.id === v.id ? { ...it, rate: val } : it))
                        }));
                      }}
                      className={`w-32 px-2 py-1 rounded border text-xs text-right font-mono ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min="0"
                      value={num(v.ot)}
                      onChange={(e) => {
                        const val = num(e.target.value);
                        setM((prev) => ({
                          ...prev,
                          levels: prev.levels.map((it) => (it.id === v.id ? { ...it, ot: val } : it))
                        }));
                      }}
                      className={`w-28 px-2 py-1 rounded border text-xs text-right font-mono ${inputCls}`}
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => setM((prev) => ({ ...prev, levels: prev.levels.filter((it) => it.id !== v.id) }))}
                      className="p-1 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kode Nomor Biaya */}
      <div className={`rounded-xl border p-4 space-y-3 ${cardCls}`}>
        <div>
          <h3 className="font-bold text-sm">Kode Nomor Biaya</h3>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Format TAHUN-NOPROJECT-KODE-URUT, contoh 2026-02-AK-001.
          </p>
        </div>
        <div className="overflow-x-auto max-w-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className={`border-b ${dark ? 'border-[#1e3a5a] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2 px-2">Kategori</th>
                <th className="py-2 px-2">Kode</th>
                <th className="py-2 px-2">Contoh</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-[#0e2540]' : 'divide-slate-100'}`}>
              {KATEGORI.map((k) => (
                <tr key={k}>
                  <td className="py-1.5 px-2">{k}</td>
                  <td className="py-1.5 px-2">
                    <input
                      value={(m.codes || {})[k] || ''}
                      maxLength={4}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setM((prev) => ({ ...prev, codes: { ...(prev.codes || {}), [k]: val } }));
                      }}
                      className={`w-20 px-2 py-1 rounded border font-mono uppercase text-xs ${inputCls}`}
                    />
                  </td>
                  <td className={`py-1.5 px-2 font-mono ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {costPrefix({ no: 'INS-' + new Date().getFullYear() + '-002' }, k, m.codes)}001
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
