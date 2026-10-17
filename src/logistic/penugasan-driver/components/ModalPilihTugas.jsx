import React, { useState } from 'react';
import {
  X,
  Search,
  CheckSquare,
  Square,
  ArrowUpRight,
  ArrowDownLeft,
  MapPin,
  Clock,
  Layers,
  Check
} from 'lucide-react';

export default function ModalPilihTugas({
  isOpen,
  onClose,
  poolTasks = [],
  initialSelectedIds = [],
  onConfirm
}) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRute, setFilterRute] = useState('ALL');

  if (!isOpen) return null;

  const filteredTasks = poolTasks.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (t.ref || t.nomor_ref || '').toLowerCase().includes(q) ||
      (t.customer || t.customer_vendor || '').toLowerCase().includes(q) ||
      (t.dest || t.lokasi_tujuan || '').toLowerCase().includes(q) ||
      (t.item_name || t.item_description || '').toLowerCase().includes(q);

    const isOutOfCity = t.out_of_city || t.is_out_of_city;
    const matchRute =
      filterRute === 'ALL' ||
      (filterRute === 'LUAR_KOTA' && isOutOfCity) ||
      (filterRute === 'DALAM_KOTA' && !isOutOfCity);

    return matchSearch && matchRute;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(t => t.id));
    }
  };

  const handleSave = () => {
    const selectedObjects = poolTasks.filter(t => selectedIds.includes(t.id));
    if (onConfirm) {
      onConfirm(selectedIds, selectedObjects);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Pilih Antrean Tugas Logistik (DO/PO)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700">
                  {selectedIds.length} Terpilih
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Centang surat jalan yang akan digabungkan ke penugasan ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Search & Filter */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
            >
              {selectedIds.length === filteredTasks.length && filteredTasks.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Pilih Semua ({filteredTasks.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No SO/PO, customer, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 sm:w-64"
              />
            </div>

            <select
              value={filterRute}
              onChange={(e) => setFilterRute(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Rute</option>
              <option value="DALAM_KOTA">Dalam Kota</option>
              <option value="LUAR_KOTA">Luar Kota</option>
            </select>
          </div>
        </div>

        {/* List Tugas Antrean */}
        <div className="overflow-y-auto p-6 space-y-2.5 flex-1 max-h-[50vh]">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Tidak ada antrean tugas logistik yang sesuai filter.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isChecked = selectedIds.includes(task.id);
              const isOut = task.out_of_city || task.is_out_of_city;
              return (
                <div
                  key={task.id}
                  onClick={() => toggleSelect(task.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex-shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-black ${
                          task.type === 'delivery'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {task.type === 'delivery' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {(task.type || 'delivery').toUpperCase()}
                        </span>
                        <span className="font-extrabold text-blue-700 font-mono text-xs">
                          {task.ref || task.nomor_ref}
                        </span>
                        {isOut && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Luar Kota
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-xs">
                        {task.customer || task.customer_vendor}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{task.origin || task.lokasi_awal}</span>
                        <span>→</span>
                        <strong className="text-slate-700">{task.dest || task.lokasi_tujuan}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-extrabold text-slate-800 text-xs block">
                      {task.qty || task.jumlah_barang}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {task.item_name || task.item_description || 'Item Muatan'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-600">
            Total {selectedIds.length} tugas akan dimasukkan ke form
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Gunakan Tugas Terpilih
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
