import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, Save, ArrowLeft, Camera, FileText, Plus, Trash2 } from 'lucide-react';
import { apiUrl } from '../../../api';

// Template Engine akan diload dari API berdasarkan product.code
// const MOCK_TEMPLATE = {...} dihapus


export default function DynamicProductForm({ product, onClose, onSave, onChange, existingData = {}, schedules = [], readOnly = false }) {
  const [sections, setSections] = useState([]);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [answers, setAnswers] = useState(existingData);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingOutstanding, setIsEditingOutstanding] = useState(false);

  const onChangeRef = React.useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(apiUrl(`survey-engine/template/${product.code}`));
        if (!res.ok) {
          throw new Error('Template tidak ditemukan');
        }
        const data = await res.json();
        
        // Sesuaikan mapping data dari API ke format UI
        const mappedSections = data.sections.map(sec => ({
          id: sec.id,
          title: sec.name,
          description: '', 
          questions: sec.questions.map(q => ({
            id: q.question_key,
            label: q.label,
            type: q.type,
            unit: q.unit,
            checklist_items: q.checklist_items,
            required: q.required,
            options: q.options || [],
            visibility_rule: q.visibility_rule
          }))
        }));

        setSections(mappedSections);
      } catch (err) {
        console.error('Gagal memuat template:', err);
        // Fallback or show error state if needed
      } finally {
        setIsLoading(false);
      }
    };

    if (product?.code) {
      fetchTemplate();
    }
  }, [product.code]);

  const getAutoTagValue = () => product?.displayId || `${product?.code || 'PRD'}-001`;

  const isTagQuestion = (question = {}) => {
    const label = (question.label || '').toLowerCase();
    const id = (question.id || '').toLowerCase();
    return id === 'tag' || id === 'tag_no' || id === 'tag_number' || id.includes('tag') || label.includes('tag');
  };

  const handleInputChange = (questionId, value) => {
    if (readOnly) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  useEffect(() => {
    // Cari pertanyaan Hari Survey
    let hariSurveyQId = null;
    sections.forEach(sec => {
      sec.questions.forEach(q => {
        const labelL = (q.label || '').toLowerCase();
        const idL = (q.id || '').toLowerCase();
        if (labelL.includes('hari survey') || labelL.includes('hari pelaksanaan') || idL === 'hari_ke' || idL.includes('hari_survey') || idL.includes('hari')) {
          hariSurveyQId = q.id;
        }
      });
    });

    if (hariSurveyQId && !readOnly) {
      if (!answers[hariSurveyQId]) {
        const todayDate = new Date().toISOString().split('T')[0];
        const matchedSch = schedules.find(s => s.tanggal === todayDate) || schedules[0] || { hari_ke: 1, tanggal: todayDate };
        const val = `Hari ke ${matchedSch.hari_ke || 1} - ${matchedSch.tanggal || todayDate} - ${product?.code || ''}`;
        setAnswers(prev => ({ ...prev, [hariSurveyQId]: val }));
      }
    }
  }, [sections, schedules, product?.code, readOnly]);

  useEffect(() => {
    const autoTagValue = getAutoTagValue();
    if (!sections.length || !autoTagValue) return;

    const tagQuestionIds = sections.flatMap(sec => sec.questions || [])
      .filter(isTagQuestion)
      .map(q => q.id);

    if (!tagQuestionIds.length) return;

    setAnswers(prev => {
      let changed = false;
      const next = { ...prev };

      tagQuestionIds.forEach(id => {
        if (next[id] !== autoTagValue) {
          next[id] = autoTagValue;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [sections, product?.displayId, product?.code]);

  const handleAddCustomRef = () => {
    if (readOnly) return;
    setAnswers(prev => ({
      ...prev,
      custom_refs: [...(prev.custom_refs || []), { id: Date.now().toString(), parameter: '', value: '', tolerance: '' }]
    }));
  };

  const handleUpdateCustomRef = (id, field, value) => {
    if (readOnly) return;
    setAnswers(prev => ({
      ...prev,
      custom_refs: (prev.custom_refs || []).map(ref => ref.id === id ? { ...ref, [field]: value } : ref)
    }));
  };

  const handleRemoveCustomRef = (id) => {
    if (readOnly) return;
    setAnswers(prev => ({
      ...prev,
      custom_refs: (prev.custom_refs || []).filter(ref => ref.id !== id)
    }));
  };

  const evaluateVisibility = (q, currentAnswers) => {
    if (!q.visibility_rule || !q.visibility_rule.source_expression) {
      return true;
    }
    const { field_js, section_js } = q.visibility_rule.source_expression;
    if (!field_js && !section_js) return true;

    try {
      const f = {};
      Object.keys(currentAnswers).forEach(k => {
         const shortKey = k.split('.').pop();
         f[shortKey] = currentAnswers[k];
      });
      const CUSTOM = 'Custom (spesifikasi / drawing client)';
      const conditions = {
        isKotak: (fObj) => /Kotak|Oval|Rectangular/.test(fObj.bentuk || ''),
        isRed: (fObj) => /Reducer/.test(fObj.bentuk || ''),
        isFl: (fObj) => fObj.koneksi === 'Flange',
        isAsme: (fObj) => /^ASME/.test(fObj.fl_std || ''),
        hasInner: (fObj) => /CGI|RIR/.test(fObj.g_type || ''),
        hasOuter: (fObj) => /^CG/.test(fObj.g_type || ''),
        isCustom: (fObj) => fObj.acuan === CUSTOM
      };
      conditions.isRound = (fObj) => !conditions.isKotak(fObj);

      const evaluateExpr = (jsStr) => {
        if (!jsStr) return true;
        if (typeof jsStr !== 'string') return Boolean(jsStr);
        let expr = jsStr.replace(/''/g, "'").replace(/^f\s*=>\s*/, '').trim();
        const parts = expr.split('&&').map(p => p.trim());
        
        return parts.every(part => {
          let isNot = false;
          if (part.startsWith('!')) {
             isNot = true;
             part = part.substring(1).trim();
          }
          
          const helperMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(f\)$/);
          if (helperMatch && conditions[helperMatch[1]]) {
            const res = conditions[helperMatch[1]](f);
            return isNot ? !res : res;
          }
          
          // Match regex test: /pattern/.test(f.field || '')
          const regexMatch = part.match(/^\/((?:\\\/|[^/])+)\/([a-z]*)\.test\(f\.([a-zA-Z0-9_]+)/);
          if (regexMatch) {
            const regex = new RegExp(regexMatch[1], regexMatch[2]);
            const fieldName = regexMatch[3];
            const val = f[fieldName] || '';
            const res = regex.test(val);
            return isNot ? !res : res;
          }
          
          // Match equality: f.field === 'value' or f.field === CUSTOM
          const eqMatch = part.match(/^f\.([a-zA-Z0-9_]+)\s*===\s*(.+)$/);
          if (eqMatch) {
            const fieldName = eqMatch[1];
            let val = eqMatch[2].replace(/['"]/g, '').trim();
            if (val === 'CUSTOM') val = CUSTOM;
            const res = (f[fieldName] === val);
            return isNot ? !res : res;
          }
          
          console.warn('Unsupported visibility expression:', jsStr, 'part:', part);
          return false;
        });
      };

      const sectionVisible = evaluateExpr(section_js);
      const fieldVisible = evaluateExpr(field_js);
      return sectionVisible && fieldVisible;
    } catch (e) {
      console.warn('Error evaluating visibility rule:', e);
      return false;
    }
  };

  const getSectionProgress = (section) => {
    const visibleQuestions = section.questions.filter(q => evaluateVisibility(q, answers));
    const totalAll = visibleQuestions.length;
    
    let filledAll = 0;
    let filledRequired = 0;
    let totalRequired = 0;

    visibleQuestions.forEach(q => {
      const isFilled = answers[q.id] !== undefined && answers[q.id] !== '';
      if (isFilled) filledAll++;
      
      if (q.required) {
        totalRequired++;
        if (isFilled) filledRequired++;
      }
    });

    let status = 'red';
    if (totalRequired === 0 || filledRequired === totalRequired) {
      status = 'green';
    } else if (filledRequired > 0) {
      status = 'yellow';
    }

    return { filled: filledAll, total: totalAll, filledRequired, totalRequired, status };
  };

  const getOverallPercent = () => {
    let totalFilledAll = 0;
    let totalAll = 0;
    sections.forEach(sec => {
      const prog = getSectionProgress(sec);
      totalFilledAll += prog.filled;
      totalAll += prog.total;
    });
    if (totalAll === 0) return 0;
    return Math.round((totalFilledAll / totalAll) * 100);
  };

  useEffect(() => {
    if (!readOnly && onChangeRef.current && sections.length > 0) {
      onChangeRef.current(answers, getOverallPercent());
    }
  }, [answers, sections, readOnly]);

  // Tampilan Form Input per Section
  if (currentSectionId) {
    const section = sections.find(s => s.id === currentSectionId);
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header Section */}
          <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-slate-50">
            <button 
              onClick={() => setCurrentSectionId(null)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">{section.title}</h2>
              <p className="text-sm text-gray-500">{product.displayId} - {product.name}</p>
            </div>
          </div>

          {/* Body Section (Form Renderer) */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 bg-white">
            {section.questions.filter(q => evaluateVisibility(q, answers)).map((q) => {
              const labelL = (q.label || '').toLowerCase();
              const idL = (q.id || '').toLowerCase();
              const isHariSurvey = labelL.includes('hari survey') || labelL.includes('hari pelaksanaan') || idL === 'hari_ke' || idL.includes('hari_survey') || idL.includes('hari');
              const isTagField = isTagQuestion(q);

              if (isHariSurvey) {
                return (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={answers[q.id] || ''}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      disabled={readOnly}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="">-- Pilih Hari Survey --</option>
                      {schedules.map((sch, idx) => {
                        const todayDate = new Date().toISOString().split('T')[0];
                        const val = `Hari ke ${sch.hari_ke || idx + 1} - ${sch.tanggal || todayDate} - ${product?.code || ''}`;
                        return <option key={val} value={val}>{val}</option>;
                      })}
                    </select>
                  </div>
                );
              }

              if (isTagField) {
                return (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={answers[q.id] || getAutoTagValue()}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-gray-700 bg-gray-100 cursor-not-allowed"
                      placeholder={getAutoTagValue()}
                    />
                  </div>
                );
              }

              return (
              <div key={q.id} className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  {q.label} {q.required && <span className="text-red-500">*</span>}
                </label>
                
                {q.type === 'text' || q.type === 'number' || q.type === 'date' ? (
                  <div className="relative">
                    <input
                      type={q.type}
                      value={answers[q.id] || ''}
                      disabled={readOnly}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 ${q.unit ? 'pr-16' : ''} ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                      placeholder={`Masukkan ${q.label.toLowerCase()}`}
                    />
                    {q.unit && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{q.unit}</span>
                      </div>
                    )}
                  </div>
                ) : q.type === 'textarea' ? (
                  <textarea
                    value={answers[q.id] || ''}
                    disabled={readOnly}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 min-h-[100px] ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    placeholder="Ketik catatan di sini..."
                  />
                ) : q.type === 'select' ? (
                  <div className="space-y-2">
                    <select
                      value={answers[q.id] || ''}
                      disabled={readOnly}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="">-- Pilih --</option>
                      {q.options.map(opt => {
                        const val = typeof opt === 'string' ? opt : opt.label;
                        return <option key={val} value={val}>{val}</option>;
                      })}
                    </select>
                    {/* Render input tambahan jika memilih Lainnya / Custom */}
                    {answers[q.id] && (answers[q.id].toLowerCase().includes('lainnya') || answers[q.id].toLowerCase().includes('custom')) && (
                      <input
                        type="text"
                        value={answers[`${q.id}_lainnya`] || ''}
                        disabled={readOnly}
                        onChange={(e) => handleInputChange(`${q.id}_lainnya`, e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-lg border border-dashed border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-700 mt-2 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'}`}
                        placeholder={`Sebutkan ${q.label.toLowerCase()} lainnya...`}
                      />
                    )}
                  </div>
                ) : q.type === 'radio' || q.type === 'boolean' ? (
                  <div className="space-y-2">
                    <div className="flex gap-4 mt-2">
                      {(q.type === 'boolean' ? ['Ya', 'Tidak'] : q.options).map(opt => {
                        const val = typeof opt === 'string' ? opt : opt.label;
                        return (
                          <label key={val} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={q.id}
                              value={val}
                              disabled={readOnly}
                              checked={answers[q.id] === val}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className={`w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${readOnly ? 'cursor-not-allowed' : ''}`}
                            />
                            <span className="text-sm text-gray-700">{val}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : q.type === 'checklist' ? (
                  <div className="space-y-2 mt-2">
                    {(q.checklist_items || q.options || []).map(opt => {
                      const itemValue = typeof opt === 'string' ? opt : opt.label;
                      const currentVals = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                      return (
                        <label key={itemValue} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentVals.includes(itemValue)}
                            disabled={readOnly}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const newVals = checked 
                                ? [...currentVals, itemValue]
                                : currentVals.filter(v => v !== itemValue);
                              handleInputChange(q.id, newVals);
                            }}
                            className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${readOnly ? 'cursor-not-allowed' : ''}`}
                          />
                          <span className="text-sm text-gray-700">{itemValue}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
            
            {/* Acuan Custom Table Helper (Only in Acuan & Validasi section) */}
            {section.title.toLowerCase().includes('acuan') && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-800">Acuan custom (drawing / spesifikasi client)</h4>
                  <p className="text-sm text-gray-500">Tambahkan nilai acuan untuk dibandingkan dengan hasil ukur. Berguna untuk ukuran non-standar atau spesifikasi khusus client.</p>
                </div>

                {(answers.custom_refs || []).length > 0 && (
                  <div className="overflow-x-auto mb-4 border border-gray-200 rounded-xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Parameter</th>
                          <th className="px-4 py-3 font-semibold">Nilai Acuan</th>
                          <th className="px-4 py-3 font-semibold">Toleransi (±)</th>
                          <th className="px-4 py-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(answers.custom_refs || []).map(ref => (
                          <tr key={ref.id} className="border-b border-gray-100 last:border-0 bg-white">
                            <td className="px-4 py-2">
                              <select 
                                value={ref.parameter} 
                                disabled={readOnly}
                                onChange={(e) => handleUpdateCustomRef(ref.id, 'parameter', e.target.value)}
                                className={`w-full px-3 py-1.5 rounded-md border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                              >
                                <option value="">Pilih...</option>
                                {sections.flatMap(s => s.questions).filter(q => q.type === 'number').map(q => (
                                  <option key={q.id} value={q.id}>{q.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={ref.value} 
                                disabled={readOnly}
                                onChange={(e) => handleUpdateCustomRef(ref.id, 'value', e.target.value)}
                                className={`w-full px-3 py-1.5 rounded-md border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Nilai"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={ref.tolerance} 
                                disabled={readOnly}
                                onChange={(e) => handleUpdateCustomRef(ref.id, 'tolerance', e.target.value)}
                                className={`w-full px-3 py-1.5 rounded-md border border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Toleransi"
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              {!readOnly && (
                                <button 
                                  onClick={() => handleRemoveCustomRef(ref.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!readOnly && (
                  <button 
                    onClick={handleAddCustomRef}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah acuan custom
                  </button>
                )}
              </div>
            )}

            {/* Helper: Flange / Standar */}
            {section.title.toLowerCase().includes('flange') && (
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-1">Cocokkan standar dari hasil ukur</h4>
                  <p className="text-sm text-gray-500 mb-4">Isi OD, PCD, dan jumlah lubang di form utama, lalu cari standar yang mendekati.</p>
                  {!readOnly && (
                    <button className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Cari standar yang cocok
                    </button>
                  )}
                </div>

                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-3">Hitung PCD dari jarak lubang bersebelahan</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah lubang</label>
                      <input type="number" disabled={readOnly} className={`w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-sm focus:ring-1 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Jarak antar pusat (mm)</label>
                      <input type="number" disabled={readOnly} className={`w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-sm focus:ring-1 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="0" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-600">PCD: -</span>
                    {!readOnly && (
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        Pakai sebagai PCD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Helper: Gap / Celah / Instalasi */}
            {(section.title.toLowerCase().includes('instalasi') || section.title.toLowerCase().includes('gap') || section.title.toLowerCase().includes('celah')) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-1">Ukur celah flange di 4 titik</h4>
                  <p className="text-sm text-gray-500 mb-4">Posisi jam 12, 3, 6, dan 9.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {['Jam 12', 'Jam 3', 'Jam 6', 'Jam 9', 'OD Flange'].map(label => (
                      <div key={label}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{label} (mm)</label>
                        <input type="number" disabled={readOnly} className={`w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-sm focus:ring-1 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="0" />
                      </div>
                    ))}
                  </div>
                  {!readOnly && (
                    <button className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Hitung & Isi panjang terpasang / misalignment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Section */}
          <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
              onClick={() => {
                setCurrentSectionId(null);
              }}
              className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              {readOnly ? 'Kembali' : 'Simpan & Kembali'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Menu Cards (Section List)
  const isAllComplete = sections.every(s => getSectionProgress(s).status === 'green');

  const getMissingCriticalFields = () => {
    let missing = [];
    sections.forEach(sec => {
      sec.questions.forEach(q => {
        if (q.required && evaluateVisibility(q, answers) && (!answers[q.id] || String(answers[q.id]).trim() === '')) {
          missing.push(q.label);
        }
      });
    });
    return missing;
  };
  const missingFields = getMissingCriticalFields();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat template pertanyaan...</p>
        </div>
      </div>
    );
  }

  // Jika tidak ada section setelah loading
  if (!sections || sections.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Template Tidak Tersedia</h2>
          <p className="text-gray-600 mb-6">Belum ada template pertanyaan untuk produk {product.code}.</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Tutup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header Master */}
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start bg-blue-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full border border-blue-200 bg-white flex items-center justify-center text-xs font-bold text-blue-700">
                {product.code}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{product.displayId}</h2>
                <p className="text-sm text-gray-500 font-medium">{product.name}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 shadow-sm transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Cards List */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-700">Form Inspeksi Lapangan</h3>
              <span className="text-xs font-medium text-gray-500">{readOnly ? 'Data hanya dapat dilihat' : 'Pilih modul untuk mengisi data'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.filter(s => s.questions.some(q => evaluateVisibility(q, answers))).map((section) => {
              const progress = getSectionProgress(section);
              
              // Badge colors based on status
              const statusConfig = {
                green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="w-4 h-4" /> },
                yellow: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: <AlertTriangle className="w-4 h-4" /> },
                red: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: <AlertCircle className="w-4 h-4" /> }
              };
              const config = statusConfig[progress.status];

              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSectionId(section.id)}
                  className="flex flex-col text-left bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3 w-full">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                      {config.icon}
                      <span>{progress.filled} / {progress.total} Diisi</span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{section.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{section.description}</p>
                  
                  {/* Info Data Utama */}
                  <div className="mt-3">
                    {progress.totalRequired === 0 ? (
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">Tidak ada data wajib</span>
                    ) : progress.filledRequired < progress.totalRequired ? (
                      <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded">
                        {progress.totalRequired - progress.filledRequired} info utama belum terisi
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        Semua info utama sudah terisi
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute right-4 bottom-4 text-gray-300 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tambahan Catatan & Outstanding */}
          <div className="mt-8 space-y-4">
            {/* Catatan Item */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800">Catatan Item</h4>
                {!readOnly && (
                  <button 
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {isEditingNotes || answers.catatan ? 'Edit Catatan' : '+ Catatan'}
                  </button>
                )}
              </div>
              {isEditingNotes && !readOnly ? (
                <textarea
                  autoFocus
                  value={answers.catatan || ''}
                  onChange={(e) => {
                    if (readOnly) return;
                    setAnswers(prev => ({ ...prev, catatan: e.target.value }));
                  }}
                  onBlur={() => setIsEditingNotes(false)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 min-h-[80px]"
                  placeholder="Masukkan catatan item..."
                />
              ) : (
                <p className="text-gray-500 text-sm">
                  {answers.catatan || 'Belum ada catatan.'}
                </p>
              )}
            </div>

            {/* Perlu Konfirmasi / Outstanding */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800">Perlu Konfirmasi / Outstanding</h4>
                {!readOnly && (
                  <button 
                    onClick={() => setIsEditingOutstanding(!isEditingOutstanding)}
                    className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {isEditingOutstanding || answers.outstanding ? 'Edit Outstanding' : '+ Outstanding'}
                  </button>
                )}
              </div>
              {isEditingOutstanding && !readOnly ? (
                <textarea
                  autoFocus
                  value={answers.outstanding || ''}
                  onChange={(e) => {
                    if (readOnly) return;
                    setAnswers(prev => ({ ...prev, outstanding: e.target.value }));
                  }}
                  onBlur={() => setIsEditingOutstanding(false)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 min-h-[80px]"
                  placeholder="Masukkan outstanding item..."
                />
              ) : (
                <p className="text-gray-500 text-sm">
                  {answers.outstanding || 'Tidak ada outstanding.'}
                </p>
              )}
            </div>

            {/* Field kritis belum lengkap */}
            {missingFields.length > 0 && (
              <div className="bg-white border border-orange-400 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 mb-1">Field kritis belum lengkap</h4>
                <p className="text-gray-500 text-sm">{missingFields.join(' • ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Master */}
        <div className="p-4 md:p-5 border-t border-gray-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 w-full md:w-auto text-center md:text-left">
            {isAllComplete ? (
              <span className="text-emerald-600 font-bold flex items-center justify-center md:justify-start gap-1">
                <CheckCircle2 className="w-4 h-4" /> Seluruh section lengkap
              </span>
            ) : (
              <span className="text-rose-500 font-bold flex items-center justify-center md:justify-start gap-1">
                <AlertCircle className="w-4 h-4" /> Masih ada section yang belum lengkap
              </span>
            )}
          </div>
          {!readOnly ? (
            <button 
              onClick={() => onSave(answers, getOverallPercent())}
              className="flex items-center justify-center w-full md:w-auto gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              Simpan Data Produk
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="flex items-center justify-center w-full md:w-auto gap-2 bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition-colors shadow-sm"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
