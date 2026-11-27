import React, { useState } from 'react';
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sumBobot, bobotOk } from '../utils/calc';
import {
  dataWorkbook,
  exportModelToXlsx,
  readXlsxFile,
  parseDataWorkbook,
  applyImport
} from '../utils/reportModels';

export default function DataImportExportView({
  dark,
  project,
  days,
  master,
  onUpdateProject,
  onSaveDay
}) {
  const [imp, setImp] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const sheets = await readXlsxFile(file);
      const res = parseDataWorkbook(sheets, project);
      const on = {};
      Object.keys(res.sec).forEach((k) => { on[k] = true; });
      setImp({ name: file.name, res, on });
    } catch (err) {
      setImp({ err: 'File tidak dapat dibaca: ' + (err?.message || err) });
    } finally {
      setBusy(false);
    }
  };

  const handleApply = async () => {
    if (!imp?.res) return;
    setBusy(true);
    try {
      const { nextP, nextD, updatedDays } = applyImport(project, days, imp.res, imp.on, master);
      if (nextP.status === 'registered' && nextP.lines.length && bobotOk(sumBobot(nextP.lines))) {
        nextP.status = 'planned';
      }
      const resP = await fetch(`/api/install-project-v2/projects/${encodeURIComponent(nextP.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextP)
      });
      if (resP.ok) onUpdateProject(nextP);
      for (const dt of updatedDays) {
        if (nextD[dt]) await onSaveDay(nextP.id, dt, nextD[dt], nextP);
      }
      setImp(null);
      alert(`Impor selesai: ${updatedDays.length} tanggal diperbarui.`);
    } catch (err) {
      alert(err?.message || 'Gagal menerapkan impor');
    } finally {
      setBusy(false);
    }
  };

  const cardCls = dark
    ? 'bg-[#111b2a] border-[#1e3a5a] text-slate-100'
    : 'bg-white border-slate-200 shadow-sm text-slate-900';

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>Impor / ekspor Excel</h1>
          <p className="note">
            Workbook data {project.no} berisi 12 sheet: Project, Plan, Detail Pekerjaan, Rencana Biaya, Rencana Manpower, Manpower, Team, Kehadiran, Level Harian, Progress (per job), Biaya, Catatan. File ini juga dipakai sebagai template impor.
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 18 }}>
        <div className="panel">
          <h2>Ekspor</h2>
          <p className="note" style={{ marginTop: 6 }}>
            Unduh seluruh data project ke Excel untuk diarsipkan, diolah, atau diisi lalu diimpor kembali.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => exportModelToXlsx(dataWorkbook(project, days, master))}
              className="btn pri"
            >
              <FileSpreadsheet className="w-4 h-4" /> Ekspor data project (.xlsx)
            </button>
          </div>
          <p className="note small" style={{ marginTop: 12 }}>
            Laporan harian, mingguan, bulanan &amp; akhir project diekspor dari tab Laporan. Plan, Kurva S dan Biaya punya tombol ekspor di tab masing-masing.
          </p>
        </div>

        <div className="panel">
          <h2>Impor</h2>
          <p className="note" style={{ marginTop: 6 }}>
            Pilih file .xlsx dengan susunan sheet dan judul kolom seperti hasil ekspor. Persen diisi sebagai angka 0–100, tanggal format YYYY-MM-DD atau tanggal Excel. Master data (Tabel 1 &amp; 2) diimpor dari tab Master Data.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <label className="btn" style={{ cursor: 'pointer' }}>
              <Upload className="w-4 h-4" /> Pilih file Excel
              <input type="file" accept=".xlsx" onChange={handleFile} className="hidden" />
            </label>
          </div>
          {busy && <p className="note" style={{ marginTop: 8 }}>Membaca file…</p>}
          {imp?.err && (
            <div className="warnbox" style={{ marginTop: 10 }}>
              <AlertTriangle className="w-4 h-4 inline mr-1.5" /> {imp.err}
            </div>
          )}
        </div>
      </div>

      {imp?.res && (
        <div className="panel">
          <h2>Pratinjau impor: {imp.name}</h2>
          {(imp.res.warn || []).map((w, i) => (
            <p key={i} className="warnbox" style={{ margin: '8px 0' }}>
              {w}
            </p>
          ))}
          <p className="note" style={{ marginTop: 6 }}>
            Pilih bagian yang akan diterapkan ke <b>{project.no}</b>. Bagian terpilih <b>menggantikan</b> data yang ada (per tanggal untuk data harian).
          </p>
          <div className="chips" style={{ margin: '10px 0' }}>
            {Object.keys(imp.res.sec).map((k) => {
              const checked = !!imp.on[k];
              return (
                <label key={k} className={`chip ${checked ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setImp((prev) => ({ ...prev, on: { ...prev.on, [k]: e.target.checked } }))}
                  />
                  <span>{imp.res.sec[k].label}</span>
                  <small>{imp.res.sec[k].count} baris</small>
                </label>
              );
            })}
          </div>
          <div className="row">
            <button
              type="button"
              disabled={busy || !Object.values(imp.on).some(Boolean)}
              onClick={handleApply}
              className="btn pri"
            >
              <CheckCircle2 className="w-4 h-4" /> Terapkan impor
            </button>
            <button type="button" onClick={() => setImp(null)} className="btn">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
