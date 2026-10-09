import React, { useState } from 'react';
import { ClipboardCheck, FileCheck, CheckCircle2, Circle, Plus, X, Trash2, Printer, Download, Share2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const INITIAL_MASTER_PERSIAPAN = [
  // Checklist Persiapan
  { id: 1, jenis: 'Checklist Persiapan', label: 'Meteran baja 5–8 m', ket_tambahan: 'Alat ukur umum', is_default: true },
  { id: 2, jenis: 'Checklist Persiapan', label: 'Jangka sorong 150 & 300 mm', ket_tambahan: 'Alat ukur umum', is_default: true },
  { id: 3, jenis: 'Checklist Persiapan', label: 'Pi tape / circumference tape', ket_tambahan: 'Alat ukur umum', is_default: true },
  { id: 4, jenis: 'Checklist Persiapan', label: 'Penggaris baja 30 cm & 1 m', ket_tambahan: 'Alat ukur umum', is_default: true },
  { id: 5, jenis: 'Checklist Persiapan', label: 'Laser distance meter', ket_tambahan: 'Alat ukur umum', is_default: true },
  { id: 6, jenis: 'Checklist Persiapan', label: 'Magnet (cek CS / SS)', ket_tambahan: 'Identifikasi material & kondisi', is_default: true },
  { id: 7, jenis: 'Checklist Persiapan', label: 'Thermo gun (IR)', ket_tambahan: 'Identifikasi material & kondisi', is_default: true },
  { id: 8, jenis: 'Checklist Persiapan', label: 'HP terisi penuh + powerbank', ket_tambahan: 'Dokumentasi', is_default: true },
  { id: 9, jenis: 'Checklist Persiapan', label: 'Senter', ket_tambahan: 'Dokumentasi', is_default: true },
  { id: 10, jenis: 'Checklist Persiapan', label: 'Spidol / kapur marker', ket_tambahan: 'Dokumentasi', is_default: true },
  { id: 11, jenis: 'Checklist Persiapan', label: 'Clipboard & alat tulis', ket_tambahan: 'Dokumentasi', is_default: true },
  { id: 12, jenis: 'Checklist Persiapan', label: 'Helm safety', ket_tambahan: 'K3 / APD', is_default: true },
  { id: 13, jenis: 'Checklist Persiapan', label: 'Safety shoes', ket_tambahan: 'K3 / APD', is_default: true },
  { id: 14, jenis: 'Checklist Persiapan', label: 'Sarung tangan', ket_tambahan: 'K3 / APD', is_default: true },
  { id: 15, jenis: 'Checklist Persiapan', label: 'Kacamata safety', ket_tambahan: 'K3 / APD', is_default: true },
  { id: 16, jenis: 'Checklist Persiapan', label: 'Earplug', ket_tambahan: 'K3 / APD', is_default: true },
  { id: 17, jenis: 'Checklist Persiapan', label: 'Full body harness (jika di ketinggian)', ket_tambahan: 'K3 / APD', is_default: true },
  { id: 18, jenis: 'Checklist Persiapan', label: 'Gas detector (jika confined space)', ket_tambahan: 'K3 / APD', is_default: true },

  // Dokumen & Izin
  { id: 19, jenis: 'Dokumen & Izin', label: 'Work permit / izin masuk area', ket_tambahan: 'Izin', is_default: true },
  { id: 20, jenis: 'Dokumen & Izin', label: 'Safety induction plant', ket_tambahan: 'Izin', is_default: true },
  { id: 21, jenis: 'Dokumen & Izin', label: 'Janji temu dengan PIC client', ket_tambahan: 'Koordinasi', is_default: true },
  { id: 22, jenis: 'Dokumen & Izin', label: 'Surat tugas', ket_tambahan: 'Dokumen', is_default: true },
  { id: 23, jenis: 'Dokumen & Izin', label: 'Data proses (tekanan, temperatur, media)', ket_tambahan: 'Data teknis', is_default: true },
  { id: 24, jenis: 'Dokumen & Izin', label: 'Info jadwal shutdown', ket_tambahan: 'Data teknis', is_default: true },
  { id: 25, jenis: 'Dokumen & Izin', label: 'Datasheet / drawing existing', ket_tambahan: 'Dokumen teknis', is_default: true },
  { id: 26, jenis: 'Dokumen & Izin', label: 'Line list / flange list', ket_tambahan: 'Dokumen produk', is_default: true },
  { id: 27, jenis: 'Dokumen & Izin', label: 'Datasheet heat exchanger / vessel', ket_tambahan: 'Dokumen produk', is_default: true },
  { id: 28, jenis: 'Dokumen & Izin', label: 'Datasheet pompa / valve', ket_tambahan: 'Dokumen produk', is_default: true }
];

export const createEmptyPersiapanData = () => ({
  masterData: INITIAL_MASTER_PERSIAPAN,
  state: INITIAL_MASTER_PERSIAPAN.reduce((acc, item) => {
    acc[item.id] = { digunakan: false, qty: 1 };
    return acc;
  }, {})
});

export default function StepPersiapan({ data = createEmptyPersiapanData(), onChange, readOnly = false }) {
  const masterData = data.masterData || INITIAL_MASTER_PERSIAPAN;
  const state = data.state || createEmptyPersiapanData().state;
  const selectMenuPortalTarget = typeof document !== 'undefined' ? document.body : undefined;
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const updateData = (patch) => {
    onChange?.({ ...data, ...patch });
  };

  const setMasterData = (updater) => {
    const nextMasterData = typeof updater === 'function' ? updater(masterData) : updater;
    updateData({ masterData: nextMasterData });
  };

  const setState = (updater) => {
    const nextState = typeof updater === 'function' ? updater(state) : updater;
    updateData({ state: nextState });
  };

  const [addingNew, setAddingNew] = useState(null); // 'Checklist Persiapan' or 'Dokumen & Izin' or null
  const [newItem, setNewItem] = useState({ label: '', ket_tambahan: null });

  const toggleCheck = (id) => {
    setState(prev => ({
      ...prev,
      [id]: { ...prev[id], digunakan: !prev[id].digunakan }
    }));
  };

  const updateQty = (id, newQty) => {
    setState(prev => ({
      ...prev,
      [id]: { ...prev[id], qty: Number(newQty) }
    }));
  };

  const markAllReady = (jenis) => {
    const itemsOfJenis = masterData.filter(i => i.jenis === jenis);
    const newState = { ...state };
    itemsOfJenis.forEach(i => {
      if (newState[i.id]) {
        newState[i.id].digunakan = true;
      }
    });
    setState(newState);
  };

  const handleAddNewSubmit = (jenis) => {
    if (!newItem.label.trim()) return;

    const newId = Date.now(); // temporary ID
    const addedItem = {
      id: newId,
      jenis,
      label: newItem.label,
      ket_tambahan: newItem.ket_tambahan?.value || 'Opsional / Tambahan',
      is_default: false
    };

    updateData({
      masterData: [...masterData, addedItem],
      state: {
        ...state,
        [newId]: { digunakan: true, qty: 1 }
      }
    });

    setAddingNew(null);
    setNewItem({ label: '', ket_tambahan: null });
  };

  const removeItem = (id) => {
    const nextState = { ...state };
    delete nextState[id];

    updateData({
      masterData: masterData.filter(item => item.id !== id),
      state: nextState
    });
  };

  const getCategoryOptions = (jenis) => {
    const uniqueCategories = [...new Set(masterData.filter(i => i.jenis === jenis).map(i => i.ket_tambahan))];
    return uniqueCategories.map(cat => ({ value: cat, label: cat }));
  };

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const buildChecklistRows = (jenis) => {
    const items = masterData.filter(item => item.jenis === jenis);
    return items.map((item, index) => {
      const itemState = state[item.id] || {};
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.ket_tambahan || '-')}</td>
          <td>${escapeHtml(item.label || '-')}</td>
          <td>${itemState.digunakan ? 'Ya' : 'Tidak'}</td>
          <td>${itemState.qty || ''}</td>
          <td class="check"></td>
          <td class="check"></td>
          <td class="check"></td>
        </tr>
      `;
    }).join('');
  };

  const buildChecklistPrintHtml = () => {
    const sections = ['Checklist Persiapan', 'Dokumen & Izin'];
    const sectionTables = sections.map((jenis) => `
      <section>
        <h2>${escapeHtml(jenis)}</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Kategori</th>
              <th>Item</th>
              <th class="center">Siap</th>
              <th class="center">Qty</th>
              <th class="center">Admin</th>
              <th class="center">Logistic</th>
              <th class="center">Surveyor</th>
            </tr>
          </thead>
          <tbody>${buildChecklistRows(jenis)}</tbody>
        </table>
      </section>
    `).join('');

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Checklist Persiapan dan Dokumen Izin</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: #e5e7eb; font-family: Arial, sans-serif; color: #111827; }
          .page { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; padding: 14mm; }
          h1 { margin: 0 0 4px; font-size: 20px; }
          h2 { margin: 22px 0 8px; font-size: 15px; }
          .meta { margin: 0 0 18px; color: #4b5563; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #d1d5db; padding: 7px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
          .center { text-align: center; }
          .check { width: 52px; height: 25px; }
          .signature { margin-top: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; font-size: 12px; text-align: center; }
          .signature div { border-top: 1px solid #9ca3af; padding-top: 8px; margin-top: 56px; }
          @media print {
            body { background: #fff; }
            .page { width: auto; min-height: auto; margin: 0; padding: 10mm; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <h1>Checklist Persiapan dan Dokumen Izin</h1>
          <p class="meta">Form checklist persiapan survey product | Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
          ${sectionTables}
          <section class="signature">
            <div>Admin</div>
            <div>Logistic</div>
            <div>Surveyor</div>
          </section>
        </main>
      </body>
      </html>
    `;
  };

  const printChecklist = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak PDF.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildChecklistPrintHtml().replace('</body>', '<script>window.onload = () => setTimeout(() => window.print(), 300);</script></body>'));
    printWindow.document.close();
  };

  const shareChecklist = async () => {
    if (!navigator.share) {
      alert('Fitur bagikan otomatis tidak didukung. Gunakan tombol Download / Print untuk menyimpan PDF lalu bagikan manual.');
      return;
    }
    try {
      await navigator.share({
        title: 'Checklist Persiapan dan Dokumen Izin',
        text: 'Preview checklist persiapan dan dokumen izin survey product',
        url: window.location.href
      });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        alert('Gagal membagikan checklist.');
      }
    }
  };

  const renderSection = (title, icon, jenis, description, showQty) => {
    const items = masterData.filter(i => i.jenis === jenis);
    
    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.ket_tambahan]) acc[item.ket_tambahan] = [];
      acc[item.ket_tambahan].push(item);
      return acc;
    }, {});

    return (
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${jenis === 'Checklist Persiapan' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <button 
              onClick={() => markAllReady(jenis)}
              className="flex items-center justify-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Tandai Semua Siap
            </button>
          )}
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{group}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupItems.map(item => {
                  const isChecked = state[item.id]?.digunakan;
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors group ${
                        isChecked ? 'bg-white border-green-500 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'
                      } ${readOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      onClick={() => { if (!readOnly) toggleCheck(item.id); }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm truncate select-none ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {showQty && (
                          <div 
                            className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-gray-400 font-medium">Qty</span>
                            <input 
                              type="number" 
                              min="1"
                              value={state[item.id]?.qty || 1}
                              disabled={readOnly}
                              onChange={(e) => updateQty(item.id, e.target.value)}
                              className={`w-10 text-xs font-semibold bg-transparent text-center focus:outline-none ${readOnly ? 'cursor-not-allowed' : ''}`}
                            />
                          </div>
                        )}
                        
                        {!item.is_default && !readOnly && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            title="Hapus item ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add New Item Section */}
          {!readOnly && (
            <div className="pt-4 mt-4 border-t border-dashed border-gray-200">
              {addingNew === jenis ? (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-blue-800">Tambah {jenis === 'Checklist Persiapan' ? 'Persiapan' : 'Dokumen'} Baru</h4>
                    <button onClick={() => setAddingNew(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Nama / Label Item" 
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newItem.label}
                        onChange={e => setNewItem({...newItem, label: e.target.value})}
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                      <CreatableSelect 
                        isClearable
                        menuPortalTarget={selectMenuPortalTarget}
                        menuPosition="fixed"
                        placeholder="Kategori / Ket. Tambahan..."
                        options={getCategoryOptions(jenis)}
                        value={newItem.ket_tambahan}
                        onChange={(newValue) => setNewItem({...newItem, ket_tambahan: newValue})}
                        formatCreateLabel={(inputValue) => `+ Add "${inputValue}"`}
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderColor: '#e5e7eb',
                            borderRadius: '0.5rem',
                            minHeight: '38px',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#3b82f6'
                            }
                          })
                          ,
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 100
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 100
                          })
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => handleAddNewSubmit(jenis)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setAddingNew(jenis)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah {jenis === 'Checklist Persiapan' ? 'Persiapan' : 'Dokumen'} Opsional
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {readOnly && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">Read-Only</span>
            <span className="font-semibold text-emerald-900">Survey sudah selesai.</span>
            <span className="text-emerald-700">Checklist persiapan hanya dapat dilihat.</span>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowPrintPreview(true)}
          className="flex items-center justify-center gap-1.5 text-sm bg-orange-50 text-orange-700 px-4 py-2 rounded-lg font-semibold hover:bg-orange-100 transition-colors whitespace-nowrap border border-orange-100"
        >
          <Printer className="w-4 h-4" /> Print Checklist & Dokumen
        </button>
      </div>

      {renderSection(
        'Checklist Persiapan', 
        <ClipboardCheck className="w-5 h-5" />, 
        'Checklist Persiapan', 
        'Checklist peralatan dan APD dasar sebelum survey.',
        true
      )}

      {renderSection(
        'Dokumen & Izin', 
        <FileCheck className="w-5 h-5" />, 
        'Dokumen & Izin', 
        'Dokumen khusus otomatis mengikuti produk yang direncanakan.',
        false
      )}

      {showPrintPreview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 md:p-8">
          <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:h-[90vh]">
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Preview Print Checklist</h3>
                <p className="text-sm text-gray-500">Checklist Persiapan dan Dokumen & Izin</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={printChecklist}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
                >
                  <Download className="h-4 w-4" /> Download / Print
                </button>
                <button
                  onClick={shareChecklist}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Share2 className="h-4 w-4" /> Bagikan
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-200">
              <iframe
                srcDoc={buildChecklistPrintHtml()}
                className="h-full w-full border-0"
                title="Preview Checklist Persiapan"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
