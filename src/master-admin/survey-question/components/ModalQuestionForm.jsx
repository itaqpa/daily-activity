import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, HelpCircle, Layers, Settings, Tag } from 'lucide-react';
import { apiUrl } from '../../../api';

export default function ModalQuestionForm({
  isOpen,
  onClose,
  onSuccess,
  questionData,
  products = [],
  sections = []
}) {
  const isEdit = !!questionData;

  const [formData, setFormData] = useState({
    label: '',
    question_key: '',
    section_code: '',
    section_name: '',
    custom_section_name: '',
    input_type: 'text',
    unit: '',
    helper_instruction: '',
    is_required: false,
    is_active: true,
    sort_order: 100,
    product_codes: ['ALL'],
    options: [{ key: 'opt_1', label: '', value: '' }]
  });

  const [isCustomSection, setIsCustomSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (questionData) {
      const pCodes = Array.isArray(questionData.products) && questionData.products.length > 0
        ? questionData.products.map(p => p.code)
        : ['ALL'];

      const opts = Array.isArray(questionData.options) && questionData.options.length > 0
        ? questionData.options.map(o => ({
            key: o.key || '',
            label: o.label || '',
            value: o.value !== undefined ? (typeof o.value === 'string' ? o.value : JSON.stringify(o.value)) : o.label || ''
          }))
        : [{ key: 'opt_1', label: '', value: '' }];

      setFormData({
        label: questionData.label || '',
        question_key: questionData.question_key || '',
        section_code: questionData.section_code || '',
        section_name: questionData.section_name || '',
        custom_section_name: '',
        input_type: questionData.input_type || 'text',
        unit: questionData.unit || '',
        helper_instruction: questionData.helper_instruction || '',
        is_required: !!questionData.is_required,
        is_active: questionData.is_active !== undefined ? !!questionData.is_active : true,
        sort_order: questionData.sort_order || 100,
        product_codes: pCodes,
        options: opts
      });
      setIsCustomSection(false);
    } else {
      // Default Add Form
      const defaultSec = sections[0] || { code: 'general', name: 'General' };
      setFormData({
        label: '',
        question_key: '',
        section_code: defaultSec.code || 'general',
        section_name: defaultSec.name || 'General',
        custom_section_name: '',
        input_type: 'text',
        unit: '',
        helper_instruction: '',
        is_required: false,
        is_active: true,
        sort_order: 100,
        product_codes: ['ALL'],
        options: [{ key: 'opt_1', label: '', value: '' }, { key: 'opt_2', label: '', value: '' }]
      });
      setIsCustomSection(false);
    }
    setErrorMsg('');
  }, [questionData, isOpen, sections]);

  if (!isOpen) return null;

  const handleProductToggle = (code) => {
    setFormData(prev => {
      let current = [...prev.product_codes];
      if (code === 'ALL') {
        return { ...prev, product_codes: ['ALL'] };
      }
      
      current = current.filter(c => c !== 'ALL');
      if (current.includes(code)) {
        current = current.filter(c => c !== code);
      } else {
        current.push(code);
      }

      // Jika kosong, balik ke ALL
      if (current.length === 0) {
        current = ['ALL'];
      }
      return { ...prev, product_codes: current };
    });
  };

  const isAllProductsSelected = formData.product_codes.includes('ALL');

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { key: `opt_${prev.options.length + 1}`, label: '', value: '' }
      ]
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData(prev => {
      const nextOpts = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: nextOpts.length > 0 ? nextOpts : [{ key: 'opt_1', label: '', value: '' }] };
    });
  };

  const handleOptionChange = (index, field, val) => {
    setFormData(prev => {
      const nextOpts = [...prev.options];
      nextOpts[index] = { ...nextOpts[index], [field]: val };
      if (field === 'label' && !nextOpts[index].value) {
        nextOpts[index].value = val;
      }
      return { ...prev, options: nextOpts };
    });
  };

  const handlePresetOptions = (preset) => {
    let newOpts = [];
    if (preset === 'yes_no') {
      newOpts = [
        { key: 'ya', label: 'Ya', value: 'Ya' },
        { key: 'tidak', label: 'Tidak', value: 'Tidak' }
      ];
    } else if (preset === 'ada_tidak') {
      newOpts = [
        { key: 'ada', label: 'Ada', value: 'Ada' },
        { key: 'tidak_ada', label: 'Tidak Ada', value: 'Tidak Ada' }
      ];
    } else if (preset === 'kondisi') {
      newOpts = [
        { key: 'baik', label: 'Baik', value: 'Baik' },
        { key: 'rusak_ringan', label: 'Rusak Ringan', value: 'Rusak Ringan' },
        { key: 'rusak_berat', label: 'Rusak Berat', value: 'Rusak Berat' }
      ];
    }
    setFormData(prev => ({ ...prev, options: newOpts }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      setErrorMsg('Label pertanyaan wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const finalSectionCode = isCustomSection
        ? `sec_${formData.custom_section_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
        : formData.section_code;

      const finalSectionName = isCustomSection
        ? formData.custom_section_name.trim()
        : formData.section_name;

      const cleanedOptions = formData.options
        .filter(o => o.label && o.label.trim())
        .map((o, idx) => ({
          key: o.key && o.key.trim() ? o.key.trim() : `opt_${idx + 1}`,
          label: o.label.trim(),
          value: o.value && o.value.trim() ? o.value.trim() : o.label.trim()
        }));

      const payload = {
        label: formData.label.trim(),
        question_key: formData.question_key ? formData.question_key.trim() : undefined,
        section_code: finalSectionCode,
        section_name: finalSectionName,
        input_type: formData.input_type,
        unit: formData.unit ? formData.unit.trim() : '',
        helper_instruction: formData.helper_instruction ? formData.helper_instruction.trim() : '',
        is_required: formData.is_required,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order) || 100,
        product_codes: formData.product_codes,
        options: cleanedOptions
      };

      const url = isEdit
        ? apiUrl(`survey-engine/admin/questions/${questionData.id}`)
        : apiUrl('survey-engine/admin/questions');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pertanyaan');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Submit question error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showOptionsConfig = ['select', 'radio', 'multi_select'].includes(formData.input_type);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-blue-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isEdit ? 'Edit Survey Question' : 'Tambah Pertanyaan Dinamis Baru'}
              </h2>
              <p className="text-xs text-blue-200/80">
                {isEdit ? `Mengubah konfigurasi pertanyaan [${formData.question_key || '...'}]` : 'Atur label, tipe input, requirement, dan produk yang berelasi.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Data Pokok Pertanyaan */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Informasi Utama Pertanyaan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Label / Teks Pertanyaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diameter Luar Flange (OD), Tekanan Operasi, dll."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                  value={formData.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      label: val,
                      question_key: isEdit ? prev.question_key : val.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
                    }));
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kode Identifikasi (Key)
                </label>
                <input
                  type="text"
                  placeholder="otomatis dibuat jika kosong"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono text-gray-600"
                  value={formData.question_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, question_key: e.target.value }))}
                  disabled={isEdit}
                />
                <span className="text-[11px] text-gray-400">Digunakan sebagai key data saat surveyor menyimpan nilai.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tipe Input Kolom <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  value={formData.input_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, input_type: e.target.value }))}
                >
                  <option value="text">Teks Singkat (Text)</option>
                  <option value="number">Angka / Numerik (Number)</option>
                  <option value="textarea">Teks Panjang / Catatan (Textarea)</option>
                  <option value="select">Pilihan Dropdown (Select)</option>
                  <option value="radio">Pilihan Radio (Radio Button)</option>
                  <option value="date">Tanggal (Date)</option>
                  <option value="boolean">Switch Ya / Tidak (Boolean)</option>
                  <option value="checklist">Daftar Checklist Khusus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Satuan / Unit (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="mis. mm, bar, °C, pcs, meter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Urutan Tampilan (Sort Order)
                </label>
                <input
                  type="number"
                  placeholder="10, 20, 100..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan Section / Kategori */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Kelompok / Section Form</span>
            </h3>

            {!isCustomSection ? (
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  value={formData.section_code}
                  onChange={(e) => {
                    const selSec = sections.find(s => s.code === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      section_code: e.target.value,
                      section_name: selSec?.name || e.target.value
                    }));
                  }}
                >
                  {sections.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCustomSection(true)}
                  className="px-3.5 py-2.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors"
                >
                  + Section Baru
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama section baru (mis. Inspeksi Khusus)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={formData.custom_section_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_section_name: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsCustomSection(false)}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold"
                >
                  Pilih yang Ada
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Petunjuk Pengisian / Helper (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Instruksi tambahan bagi surveyor saat mengisi form..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={formData.helper_instruction}
                onChange={(e) => setFormData(prev => ({ ...prev, helper_instruction: e.target.value }))}
              />
            </div>
          </div>

          {/* Section 3: Opsi Pilihan (Jika Tipe Select / Radio) */}
          {showOptionsConfig && (
            <div className="space-y-3 pt-3 border-t border-gray-100 bg-blue-50/40 p-4 rounded-xl border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Daftar Opsi Pilihan ({formData.input_type})
                  </h4>
                  <p className="text-[11px] text-blue-700/70">
                    Tambahkan pilihan yang dapat dipilih oleh surveyor.
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetOptions('yes_no')}
                    className="px-2 py-1 bg-white border border-blue-200 rounded text-[11px] font-medium text-blue-800 hover:bg-blue-100"
                  >
                    Preset: Ya/Tidak
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetOptions('kondisi')}
                    className="px-2 py-1 bg-white border border-blue-200 rounded text-[11px] font-medium text-blue-800 hover:bg-blue-100"
                  >
                    Preset: Kondisi
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Label Opsi (Teks yang tampil)"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                      value={opt.label}
                      onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Nilai Value"
                      className="w-1/3 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono"
                      value={opt.value}
                      onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Opsi Pilihan</span>
              </button>
            </div>
          )}

          {/* Section 4: Relasi Produk */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Relasi Produk Survei
                </h3>
                <p className="text-[11px] text-gray-500">
                  Tentukan pertanyaan ini berlaku untuk produk apa saja saat survei lapangan dibuka.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleProductToggle('ALL')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  isAllProductsSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isAllProductsSelected ? '✓ Berlaku Semua Produk' : 'Pilih Semua Produk'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {products.map(p => {
                const isSelected = isAllProductsSelected || formData.product_codes.includes(p.code);
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => handleProductToggle(p.code)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 text-blue-950 font-semibold ring-1 ring-blue-500'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-normal'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-blue-600 text-white' : 'border border-gray-300'
                    }`}>
                      {isSelected && '✓'}
                    </div>
                    <div className="truncate text-xs">
                      <span className="font-bold">{p.code}</span>
                      <span className="block text-[10px] text-gray-500 truncate">{p.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Status Keaktifan & Requirement Switches */}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Switch 1: Requirement */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-gray-800">
                  Wajib Diisi (Required)
                </span>
                <span className="text-[11px] text-gray-500">
                  Surveyor tidak bisa lanjut jika pertanyaan ini kosong.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_required: !prev.is_required }))}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  formData.is_required ? 'bg-amber-500 justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Switch 2: Is Active (Masih Butuh atau Tidak) */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-gray-800">
                  Status Aktif (Masih Butuh)
                </span>
                <span className="text-[11px] text-gray-500">
                  Jika non-aktif, pertanyaan disembunyikan dari form surveyor.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  formData.is_active ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isEdit ? 'Simpan Perubahan' : 'Buat Pertanyaan'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
