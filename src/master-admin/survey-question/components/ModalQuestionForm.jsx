import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle, HelpCircle, Layers, Settings, Tag, GitBranch } from 'lucide-react';
import { apiUrl } from '../../../api';

export default function ModalQuestionForm({
  isOpen,
  onClose,
  onSuccess,
  questionData,
  products = [],
  sections = [],
  allQuestions = []
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
    options: [{ key: 'opt_1', label: '', value: '' }],
    has_condition: false,
    condition_parent_key: '',
    condition_operator: 'eq',
    condition_value: '',
    preserved_section_js: null,
    preserved_field_js: null,
    raw_custom_rule: null
  });

  const [isCustomSection, setIsCustomSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper untuk mengambil short key (misal 'EJR.dimensi.koneksi' -> 'koneksi')
  const getShortKey = (qKey) => {
    if (!qKey) return '';
    return qKey.split('.').pop();
  };

  const [internalAllQuestions, setInternalAllQuestions] = useState(allQuestions);

  useEffect(() => {
    if (Array.isArray(allQuestions) && allQuestions.length > 5) {
      setInternalAllQuestions(allQuestions);
    }
  }, [allQuestions]);

  // Fallback: Jika allQuestions yang dioper dari luar terpotong oleh filter search/section, ambil seluruh pool
  useEffect(() => {
    if (isOpen && (!internalAllQuestions || internalAllQuestions.length <= 5)) {
      fetch(apiUrl('survey-engine/admin/questions'))
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setInternalAllQuestions(data);
          }
        })
        .catch(err => console.error('Failed to fetch full questions in modal:', err));
    }
  }, [isOpen]);

  // Saring pertanyaan lain yang bisa dijadikan parent trigger
  const candidateParentQuestions = useMemo(() => {
    const list = internalAllQuestions && internalAllQuestions.length > 0 ? internalAllQuestions : allQuestions;
    return list.filter(q => {
      if (questionData && (q.id === questionData.id || q.question_key === questionData.question_key)) {
        return false;
      }
      return true;
    });
  }, [internalAllQuestions, allQuestions, questionData]);

  // Deteksi percabangan (Downstream branches):
  // Menghitung apakah opsi-opsi pada pertanyaan ini menjadi pemicu (trigger) untuk pertanyaan/section lain
  const downstreamBranches = useMemo(() => {
    if (!formData.options || !Array.isArray(formData.options) || formData.options.length === 0) {
      return { byOption: {}, allBranches: [], totalQuestionsCount: 0 };
    }

    const activeKey = formData.question_key || questionData?.question_key || '';
    const currentShortKey = getShortKey(activeKey);
    const currentFullKey = activeKey;
    if (!currentShortKey && !currentFullKey) {
      return { byOption: {}, allBranches: [], totalQuestionsCount: 0 };
    }

    const questionPool = internalAllQuestions && internalAllQuestions.length > 0 ? internalAllQuestions : allQuestions;
    const byOption = {};
    let totalQuestionsCount = 0;

    formData.options.forEach((opt, idx) => {
      const optVal = String(opt.value || opt.label || '').trim();
      const optLbl = String(opt.label || opt.value || '').trim();
      if (!optVal && !optLbl) return;

      const matchedSections = {}; // { [sectionName]: [question] }
      let countForOpt = 0;

      questionPool.forEach(q => {
        // Jangan cek diri sendiri
        if (questionData && (q.id === questionData.id || q.question_key === questionData.question_key)) return;
        if (q.question_key === activeKey) return;

        let vr = q.visibility_rule;
        if (typeof vr === 'string') {
          try { vr = JSON.parse(vr); } catch (e) { vr = {}; }
        }
        if (!vr || typeof vr !== 'object') return;

        let isMatch = false;

        // 1. Cek depends_on
        if (vr.depends_on) {
          const depKey = vr.depends_on;
          if (depKey === currentShortKey || depKey === currentFullKey) {
            const ruleVal = String(vr.value !== undefined ? vr.value : '').trim().toLowerCase();
            const operator = vr.operator || 'eq';
            if (operator === 'eq' && (ruleVal === optVal.toLowerCase() || ruleVal === optLbl.toLowerCase())) {
              isMatch = true;
            }
          }
        }

        // 2. Cek source_expression (section_js / field_js)
        if (!isMatch && vr.source_expression) {
          const sJs = (vr.source_expression.section_js || '').replace(/''/g, "'");
          const fJs = (vr.source_expression.field_js || '').replace(/''/g, "'");

          // Regex equality: f.koneksi === 'Flange' atau f['koneksi'] === 'Flange'
          if (currentShortKey) {
            const regexEq = new RegExp(`f(?:\\.${currentShortKey}|\\['${currentShortKey}'\\])\\s*(?:===|==)\\s*['"]?([^'"]+)['"]?`);
            const mS = sJs.match(regexEq);
            const mF = fJs.match(regexEq);

            if (mS) {
              const targetVal = mS[1].trim().toLowerCase();
              if (targetVal === optVal.toLowerCase() || targetVal === optLbl.toLowerCase() || (targetVal === 'custom' && optLbl.toLowerCase().includes('custom'))) {
                isMatch = true;
              }
            }
            if (!isMatch && mF) {
              const targetVal = mF[1].trim().toLowerCase();
              if (targetVal === optVal.toLowerCase() || targetVal === optLbl.toLowerCase() || (targetVal === 'custom' && optLbl.toLowerCase().includes('custom'))) {
                isMatch = true;
              }
            }

            // Fallback string matching jika format regex sedikit berbeda
            if (!isMatch) {
              const sLower = sJs.toLowerCase();
              const fLower = fJs.toLowerCase();
              const optVLower = optVal.toLowerCase();
              const optLLower = optLbl.toLowerCase();
              const kLower = currentShortKey.toLowerCase();

              if (
                (sLower.includes(kLower) || fLower.includes(kLower)) &&
                (
                  sLower.includes(`'${optVLower}'`) || sLower.includes(`"${optVLower}"`) || sLower.includes(`===${optVLower}`) ||
                  sLower.includes(`'${optLLower}'`) || sLower.includes(`"${optLLower}"`) || sLower.includes(`===${optLLower}`) ||
                  fLower.includes(`'${optVLower}'`) || fLower.includes(`"${optVLower}"`) || fLower.includes(`===${optVLower}`) ||
                  fLower.includes(`'${optLLower}'`) || fLower.includes(`"${optLLower}"`) || fLower.includes(`===${optLLower}`) ||
                  (optLLower.includes('custom') && (sLower.includes('custom') || fLower.includes('custom')))
                )
              ) {
                isMatch = true;
              }
            }

            // Regex pattern: /Reducer/.test(f.bentuk)
            if (!isMatch) {
              const regexTest = new RegExp(`/([^/]+)/\\.test\\(f\\.${currentShortKey}\\b`);
              const testS = sJs.match(regexTest);
              const testF = fJs.match(regexTest);
              if (testS) {
                try {
                  const r = new RegExp(testS[1], 'i');
                  if (r.test(optVal) || r.test(optLbl)) isMatch = true;
                } catch (e) {}
              }
              if (!isMatch && testF) {
                try {
                  const r = new RegExp(testF[1], 'i');
                  if (r.test(optVal) || r.test(optLbl)) isMatch = true;
                } catch (e) {}
              }
            }
          }
        }

        if (isMatch) {
          const secName = q.section_name || q.section_label || 'Lainnya';
          if (!matchedSections[secName]) {
            matchedSections[secName] = [];
          }
          matchedSections[secName].push(q);
          countForOpt++;
        }
      });

      if (countForOpt > 0) {
        byOption[idx] = {
          optionLabel: optLbl,
          optionValue: optVal,
          sections: matchedSections,
          count: countForOpt
        };
        totalQuestionsCount += countForOpt;
      }
    });

    const allBranches = Object.values(byOption);
    return { byOption, allBranches, totalQuestionsCount };
  }, [formData.options, formData.question_key, internalAllQuestions, allQuestions, questionData]);

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

      // Parse existing visibility_rule 1:1
      let hasCond = false;
      let condParent = '';
      let condOp = 'eq';
      let condVal = '';
      let pSecJs = null;
      let pFieldJs = null;
      let rawRule = null;

      let vr = questionData.visibility_rule;
      if (typeof vr === 'string') {
        try { vr = JSON.parse(vr); } catch (e) { vr = {}; }
      }

      if (vr && typeof vr === 'object' && Object.keys(vr).length > 0) {
        rawRule = vr;
        if (vr.depends_on) {
          hasCond = true;
          condParent = vr.depends_on;
          condOp = vr.operator || 'eq';
          condVal = vr.value !== undefined ? String(vr.value) : '';
          pSecJs = vr.source_expression?.section_js || null;
          pFieldJs = vr.source_expression?.field_js || null;
        } else if (vr.source_expression) {
          const sJs = (vr.source_expression.section_js || '').replace(/''/g, "'");
          const fJs = (vr.source_expression.field_js || '').replace(/''/g, "'");
          pSecJs = vr.source_expression.section_js || null;
          pFieldJs = vr.source_expression.field_js || null;

          // Cek di section_js (contoh: f => f.koneksi==='Flange' atau f=>f.koneksi==='Clamp')
          const secMatch = sJs.match(/f(?:\.([a-zA-Z0-9_]+)|\['([a-zA-Z0-9_]+)'\])\s*(===|!==|==|!=)\s*['"]?([^'"]+)['"]?/);
          // Cek di field_js (contoh: f => f.koneksi==='Flange' atau f => f.acuan===CUSTOM)
          const fieldMatch = fJs.match(/f(?:\.([a-zA-Z0-9_]+)|\['([a-zA-Z0-9_]+)'\])\s*(===|!==|==|!=)\s*['"]?([^'"]+)['"]?/);

          if (secMatch) {
            hasCond = true;
            condParent = secMatch[1] || secMatch[2];
            condOp = (secMatch[3] === '!==' || secMatch[3] === '!=') ? 'neq' : 'eq';
            condVal = secMatch[4].replace(/['"]/g, '').trim();
          } else if (fieldMatch) {
            hasCond = true;
            condParent = fieldMatch[1] || fieldMatch[2];
            condOp = (fieldMatch[3] === '!==' || fieldMatch[3] === '!=') ? 'neq' : 'eq';
            condVal = fieldMatch[4].replace(/['"]/g, '').trim();
            if (condVal === 'CUSTOM') condVal = 'Custom (spesifikasi / drawing client)';
          } else if (sJs || fJs) {
            // Ada ekspresi khusus bawaan (misal helper !isKotak(f) atau regex)
            hasCond = true;
          }
        }
      }

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
        options: opts,
        has_condition: hasCond,
        condition_parent_key: condParent,
        condition_operator: condOp,
        condition_value: condVal,
        preserved_section_js: pSecJs,
        preserved_field_js: pFieldJs,
        raw_custom_rule: rawRule
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
        options: [{ key: 'opt_1', label: '', value: '' }, { key: 'opt_2', label: '', value: '' }],
        has_condition: false,
        condition_parent_key: '',
        condition_operator: 'eq',
        condition_value: '',
        preserved_section_js: null,
        preserved_field_js: null,
        raw_custom_rule: null
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

      let visibilityRulePayload = {};
      if (formData.has_condition) {
        if (formData.condition_parent_key && formData.condition_value) {
          const opSymbol = formData.condition_operator === 'neq' ? '!==' : '===';
          const cleanVal = formData.condition_value.trim();
          const targetExpr = `f => f.${formData.condition_parent_key} ${opSymbol} '${cleanVal}'`;

          // Jika pertanyaan ini bagian dari section yang bergantung pada koneksi/parent (seperti section Flange/Clamp/Weld),
          // set section_js agar modul card di DynamicProductForm juga terpengaruh.
          const isSectionTrigger = formData.condition_parent_key === 'koneksi' || !!formData.preserved_section_js;

          visibilityRulePayload = {
            ...(formData.raw_custom_rule || {}),
            depends_on: formData.condition_parent_key,
            operator: formData.condition_operator,
            value: cleanVal,
            source_expression: {
              section_js: isSectionTrigger ? targetExpr : (formData.preserved_section_js || null),
              field_js: !isSectionTrigger ? targetExpr : (formData.preserved_field_js || null)
            }
          };
        } else if (formData.raw_custom_rule) {
          // Pertahankan rule bawaan jika tidak diubah
          visibilityRulePayload = formData.raw_custom_rule;
        }
      } else {
        // Jika sengaja dinonaktifkan oleh admin
        visibilityRulePayload = {};
      }

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
        options: cleanedOptions,
        visibility_rule: visibilityRulePayload
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

              <div className="space-y-2.5">
                {formData.options.map((opt, idx) => {
                  const branchInfo = downstreamBranches.byOption[idx];
                  return (
                    <div key={idx} className="space-y-1.5 bg-white/70 p-2 rounded-xl border border-blue-100/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          placeholder="Label Opsi (Teks yang tampil)"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                          value={opt.label}
                          onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Nilai Value"
                          className="w-1/3 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-400 outline-none"
                          value={opt.value}
                          onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus opsi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Indikator Percabangan jika opsi ini memicu Section / Pertanyaan lain */}
                      {branchInfo && (
                        <div className="flex flex-wrap items-center gap-1.5 ml-7 text-[11px] text-purple-800 bg-purple-50/90 border border-purple-200/80 rounded-lg px-2.5 py-1">
                          <GitBranch className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span className="font-semibold text-purple-950">Memicu:</span>
                          {Object.entries(branchInfo.sections).map(([sec, qList]) => (
                            <span key={sec} className="inline-flex items-center gap-1 bg-white border border-purple-200 px-1.5 py-0.5 rounded text-purple-900 font-medium shadow-2xs">
                              <span>Kelompok <strong>"{sec}"</strong></span>
                              <span className="text-[10px] text-purple-600 font-semibold">({qList.length} pertanyaan)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Opsi Pilihan</span>
                </button>
              </div>

              {/* Rangkuman Peta Percabangan Terdeteksi (Branching Map) */}
              {downstreamBranches.allBranches.length > 0 && (
                <div className="mt-3 bg-linear-to-r from-purple-50 via-indigo-50/50 to-blue-50/50 border border-purple-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                        Peta Percabangan Form Terhubung (Branching Map)
                      </h4>
                      <p className="text-[11px] text-purple-800/80">
                        Opsi pilihan pada pertanyaan ini menjadi pemicu bagi kelompok & pertanyaan lain:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {downstreamBranches.allBranches.map((br, bIdx) => (
                      <div key={bIdx} className="bg-white/90 border border-purple-100 rounded-lg p-2.5 text-xs shadow-2xs">
                        <div className="font-semibold text-purple-900 flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <span>Ketika surveyor memilih <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">"{br.optionLabel}"</span> :</span>
                        </div>
                        <div className="pl-3.5 space-y-1 text-[11px] text-gray-700 border-l-2 border-purple-200 ml-1">
                          {Object.entries(br.sections).map(([sec, qList]) => (
                            <div key={sec} className="flex items-baseline gap-1.5">
                              <span className="text-purple-600 font-bold">➔</span>
                              <span>Membuka Kelompok / Section: <strong className="text-gray-900">{sec}</strong></span>
                              <span className="text-gray-500 font-mono text-[10px]">
                                ({qList.length} pertanyaan: {qList.slice(0, 3).map(q => q.label).join(', ')}{qList.length > 3 ? ', dll.' : ''})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Section 5: Logika Tampil Bersyarat (Conditional Logic / Branching) */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Logika Tampil Bersyarat (Conditional Logic)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Atur apakah pertanyaan ini hanya muncul jika pertanyaan lain memiliki jawaban tertentu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  has_condition: !prev.has_condition,
                  condition_parent_key: !prev.has_condition && candidateParentQuestions.length > 0 ? (candidateParentQuestions[0].question_key || candidateParentQuestions[0].code) : prev.condition_parent_key
                }))}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  formData.has_condition ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {!formData.has_condition && downstreamBranches.allBranches.length > 0 && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 animate-in fade-in duration-200">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed space-y-1">
                  <div>
                    <span className="font-bold text-amber-900">Pertanyaan ini adalah Pemicu Utama (Parent Trigger):</span> Pertanyaan ini selalu tampil di formulir awal untuk dijawab oleh surveyor, dan opsi pilihannya memicu pembukaan <strong>{downstreamBranches.totalQuestionsCount} pertanyaan</strong> di kelompok form lain (lihat <em>Peta Percabangan</em> di bagian atas).
                  </div>
                  <div className="text-[11px] text-amber-800/80">
                    💡 Switch di atas berstatus non-aktif karena pertanyaan ini sendiri tidak disembunyikan oleh pertanyaan lain.
                  </div>
                </div>
              </div>
            )}

            {formData.has_condition && (
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Pilih Pertanyaan Induk */}
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Pertanyaan Pemicu (Acuan)
                    </label>
                    <select
                      value={formData.condition_parent_key}
                      onChange={(e) => {
                        const selKey = e.target.value;
                        const matchedQ = candidateParentQuestions.find(q => {
                          const sKey = getShortKey(q.question_key || q.code);
                          return sKey === selKey || q.question_key === selKey || q.code === selKey;
                        });
                        let defaultVal = '';
                        if (matchedQ && Array.isArray(matchedQ.options) && matchedQ.options.length > 0) {
                          const firstOpt = matchedQ.options[0];
                          defaultVal = typeof firstOpt === 'string' ? firstOpt : (firstOpt.label || firstOpt.value || '');
                        }
                        setFormData(prev => ({
                          ...prev,
                          condition_parent_key: selKey,
                          condition_value: defaultVal
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-purple-300 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                    >
                      <option value="">-- Pilih Pertanyaan --</option>
                      {/* Opsi khusus jika condition_parent_key belum ada di list (misal: 'koneksi') */}
                      {formData.condition_parent_key && !candidateParentQuestions.some(q => getShortKey(q.question_key || q.code) === formData.condition_parent_key || q.question_key === formData.condition_parent_key) && (
                        <option value={formData.condition_parent_key}>
                          {formData.condition_parent_key.toUpperCase()} ({formData.condition_parent_key})
                        </option>
                      )}
                      {candidateParentQuestions.map(q => {
                        const sKey = getShortKey(q.question_key || q.code);
                        return (
                          <option key={q.id || q.question_key || sKey} value={sKey}>
                            {q.label} ({sKey})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Kondisi / Operator
                    </label>
                    <select
                      value={formData.condition_operator}
                      onChange={(e) => setFormData(prev => ({ ...prev, condition_operator: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-purple-300 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                    >
                      <option value="eq">Sama Dengan (===)</option>
                      <option value="neq">Tidak Sama Dengan (!==)</option>
                    </select>
                  </div>

                  {/* Nilai Pemicu */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Nilai Jawaban Pemicu
                    </label>
                    {(() => {
                      const matchedParent = candidateParentQuestions.find(q => {
                        const sKey = getShortKey(q.question_key || q.code);
                        return sKey === formData.condition_parent_key || q.question_key === formData.condition_parent_key;
                      });
                      let parentOptions = matchedParent && Array.isArray(matchedParent.options) && matchedParent.options.length > 0 ? matchedParent.options : null;

                      // Preset cadangan jika koneksi belum ada di options list
                      if (!parentOptions && formData.condition_parent_key === 'koneksi') {
                        parentOptions = ['Flange', 'Clamp', 'Welded'];
                      }

                      if (parentOptions) {
                        return (
                          <select
                            value={formData.condition_value}
                            onChange={(e) => setFormData(prev => ({ ...prev, condition_value: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-purple-300 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                          >
                            <option value="">-- Pilih Nilai --</option>
                            {parentOptions.map((opt, i) => {
                              const val = typeof opt === 'string' ? opt : (opt.value || opt.label);
                              const lbl = typeof opt === 'string' ? opt : opt.label;
                              return (
                                <option key={i} value={val}>{lbl}</option>
                              );
                            })}
                          </select>
                        );
                      }

                      return (
                        <input
                          type="text"
                          value={formData.condition_value}
                          onChange={(e) => setFormData(prev => ({ ...prev, condition_value: e.target.value }))}
                          placeholder="Misal: Ya / Tidak / Flange"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-purple-300 bg-white focus:ring-2 focus:ring-purple-400 outline-none"
                        />
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-purple-800 bg-purple-100/70 px-2.5 py-1.5 rounded-lg">
                  <span className="font-semibold">Logika:</span>
                  <span>
                    Pertanyaan ini hanya muncul jika <strong>{formData.condition_parent_key || '[Pilih Pertanyaan]'}</strong>{' '}
                    {formData.condition_operator === 'neq' ? 'TIDAK sama dengan' : 'bernilai'}{' '}
                    <strong>"{formData.condition_value || '...'}"</strong>.
                  </span>
                </div>

                {(formData.preserved_field_js || formData.preserved_section_js) && (
                  <div className="text-[10px] text-purple-700/80 font-mono bg-white/80 p-2 rounded border border-purple-200">
                    <span className="font-sans font-bold">Rule Asli Database (1:1 Dijaga): </span>
                    {formData.preserved_section_js && <span>Section: {formData.preserved_section_js} </span>}
                    {formData.preserved_field_js && <span>Field: {formData.preserved_field_js}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 6: Status Keaktifan & Requirement Switches */}
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
