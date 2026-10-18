import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function DateFilterCard({ 
  filterPeriod = 'daily', // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'
  onChangePeriod,
  selectedDate = new Date().toISOString().split('T')[0],
  onChangeDate
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const periods = [
    { id: 'daily', label: 'Harian', desc: 'Per Hari Kalender' },
    { id: 'weekly', label: 'Mingguan', desc: 'Senin - Minggu' },
    { id: 'monthly', label: 'Bulanan', desc: '1 Bulan Penuh' },
    { id: 'yearly', label: 'Tahunan', desc: '1 Tahun Penuh' },
    { id: 'all', label: 'Semua', desc: 'Semua Riwayat' }
  ];

  const currentPeriodObj = periods.find(p => p.id === filterPeriod) || periods[0];

  // Helper geser tanggal (H-1 / H+1 atau Minggu/Bulan/Tahun)
  const handleShiftDate = (direction) => {
    const current = new Date(selectedDate);
    if (filterPeriod === 'daily') {
      current.setDate(current.getDate() + direction);
    } else if (filterPeriod === 'weekly') {
      current.setDate(current.getDate() + (direction * 7));
    } else if (filterPeriod === 'monthly') {
      current.setMonth(current.getMonth() + direction);
    } else if (filterPeriod === 'yearly') {
      current.setFullYear(current.getFullYear() + direction);
    }
    onChangeDate(current.toISOString().split('T')[0]);
  };

  // Format Tampilan Label Periode Terpilih
  const formatPeriodLabel = () => {
    const d = new Date(selectedDate);
    if (filterPeriod === 'all') {
      return <span className="text-slate-700">Semua Waktu Penugasan</span>;
    }
    if (filterPeriod === 'daily') {
      const isToday = selectedDate === new Date().toISOString().split('T')[0];
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="text-slate-900 font-extrabold text-sm">
            {d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {isToday && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-200 shadow-2xs">
              HARI INI
            </span>
          )}
        </div>
      );
    }
    if (filterPeriod === 'weekly') {
      const day = d.getDay() || 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - day + 1);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return (
        <span className="text-slate-900 font-extrabold text-xs sm:text-sm">
          {mon.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {sun.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      );
    }
    if (filterPeriod === 'monthly') {
      return (
        <span className="text-slate-900 font-extrabold text-sm">
          {d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
      );
    }
    if (filterPeriod === 'yearly') {
      return (
        <span className="text-slate-900 font-extrabold text-sm">
          Tahun {d.getFullYear()}
        </span>
      );
    }
    return selectedDate;
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-3.5 transition-all">
      {/* Baris Atas: Label Periode & Dropdown Pilihan Mode */}
      <div className="flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Filter Jadwal Tugas
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black text-slate-900">
                Mode: {currentPeriodObj.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Dropdown Pilih Periode & Kalender */}
        <div className="flex items-center gap-1.5">
          {/* Tombol Dropdown Periode (Harian, Mingguan, Bulanan, Tahunan) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsCalendarOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 shadow-2xs transition-all active:scale-95"
            >
              <span>{currentPeriodObj.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-600' : 'text-slate-500'}`} />
            </button>

            {/* Menu Popover Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pilih Rentang Waktu
                </div>
                {periods.map(p => {
                  const isSelected = filterPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onChangePeriod(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                        isSelected 
                          ? 'bg-emerald-50 text-emerald-800 font-bold' 
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div>
                        <div className="leading-tight">{p.label}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{p.desc}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tombol Kalender / Tanggal Langsung */}
          <button
            type="button"
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsDropdownOpen(false);
            }}
            title="Buka Kalender"
            className={`p-2 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
              isCalendarOpen 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Baris Navigasi Utama: Panah Kiri, Tampilan Tanggal, Panah Kanan */}
      <div className="flex items-center justify-between bg-slate-50/80 p-2 rounded-2xl border border-slate-200/90 shadow-inner">
        {filterPeriod !== 'all' ? (
          <>
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              aria-label="Sebelumnya"
              className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 px-2 text-center">
              {formatPeriodLabel()}
            </div>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              aria-label="Berikutnya"
              className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full text-center py-1 text-xs font-bold text-slate-600">
            Menampilkan seluruh tugas tanpa filter tanggal
          </div>
        )}
      </div>

      {/* Popover Input Kalender */}
      {isCalendarOpen && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Pilih Tanggal Langsung:</span>
            {!isToday && (
              <button
                type="button"
                onClick={() => {
                  onChangeDate(new Date().toISOString().split('T')[0]);
                  setIsCalendarOpen(false);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kembali ke Hari Ini</span>
              </button>
            )}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onChangeDate(e.target.value);
                setIsCalendarOpen(false);
              }
            }}
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>
      )}
    </div>
  );
}
