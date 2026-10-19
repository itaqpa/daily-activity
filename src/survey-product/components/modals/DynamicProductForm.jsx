import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, Save, ArrowLeft, Camera, FileText, Plus, Trash2, Check, Image as ImageIcon, Upload } from 'lucide-react';
import { apiUrl } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { offlineEngine } from '../../../offline/offlineEngine';
import { offlineDb } from '../../../offline/db';

export const PHOTO_CATS = [
  'Keseluruhan',
  'Nameplate / marking',
  'Flange / koneksi',
  'Dimensi (dengan meteran)',
  'Kerusakan',
  'Area sekitar',
  'Lainnya'
];

// Urutan resmi section sesuai acuan Survey Produk GTE (Copy).html
export const SECTION_ORDER = [
  'ident',      // Identifikasi
  'acuan',      // Acuan & validasi
  'proses',     // Kondisi operasi
  'komponen',   // Komponen yang diinsulasi (RTI)
  'desain',     // Desain jacket (RTI)
  'dimensi',    // Bentuk & dimensi
  'geom',       // Geometri
  'flange',     // Koneksi: flange
  'clamp',      // Koneksi: clamp
  'weld',       // Koneksi: welded
  'movement',   // Pergerakan
  'gflange',    // Data flange (gasket)
  'gasket',     // Konstruksi & dimensi gasket
  'equip',      // Equipment
  'app',        // Aplikasi
  'box',        // Dimensi stuffing box
  'packing',    // Packing
  'ring',       // Ring graphite
  'material',   // Material & konstruksi
  'instalasi',  // Kondisi instalasi
  'kondisi',    // Kondisi existing
  'komersial',  // Kebutuhan komersial
  'foto'        // Foto dokumentasi
];

// Helper kompresi dan konversi foto
const resizeImageToBlob = (file, max = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
};

// Database Standar Flange
const NPS = [['1/2"',15],['3/4"',20],['1"',25],['1-1/4"',32],['1-1/2"',40],['2"',50],['2-1/2"',65],['3"',80],['4"',100],['5"',125],['6"',150],['8"',200],['10"',250],['12"',300],['14"',350],['16"',400],['18"',450],['20"',500],['24"',600]];
const A150 = [[88.9,60.3,4,15.9],[98.4,69.9,4,15.9],[108,79.4,4,15.9],[117.5,88.9,4,15.9],[127,98.4,4,15.9],[152.4,120.7,4,19.1],[177.8,139.7,4,19.1],[190.5,152.4,4,19.1],[228.6,190.5,8,19.1],[254,215.9,8,22.2],[279.4,241.3,8,22.2],[342.9,298.5,8,22.2],[406.4,362,12,25.4],[482.6,431.8,12,25.4],[533.4,476.3,12,28.6],[596.9,539.8,16,28.6],[635,577.9,16,31.8],[698.5,635,20,31.8],[812.8,749.3,20,34.9]];
const A300 = [[95.3,66.7,4,15.9],[117.5,82.6,4,19.1],[123.8,88.9,4,19.1],[133.4,98.4,4,19.1],[155.6,114.3,4,22.2],[165.1,127,8,19.1],[190.5,149.2,8,22.2],[209.6,168.3,8,22.2],[254,200,8,22.2],[279.4,235,8,22.2],[317.5,269.9,12,22.2],[381,330.2,12,25.4],[444.5,387.4,16,28.6],[520.7,450.8,16,31.8],[584.2,514.4,20,31.8],[647.7,571.5,20,34.9],[711.2,628.7,24,34.9],[774.7,685.8,24,34.9],[914.4,812.8,24,41.3]];
const asmeRows = t => NPS.map((n,i)=>[n[0]+' (DN'+n[1]+')'].concat(t[i]));
const FL = {
  "ASME B16.5 Class 150": asmeRows(A150),
  "ASME B16.5 Class 300": asmeRows(A300),
  "JIS B2220 10K": [['DN25',125,90,4,19],['DN40',140,105,4,19],['DN50',155,120,4,19],['DN65',175,140,4,19],['DN80',185,150,8,19],['DN100',210,175,8,19],['DN125',250,210,8,23],['DN150',280,240,8,23],['DN200',330,290,12,23],['DN250',400,355,12,25],['DN300',445,400,16,25],['DN350',490,445,16,25],['DN400',560,510,16,27],['DN450',620,565,20,27],['DN500',675,620,20,27],['DN600',795,730,24,33]],
  "EN 1092 / DIN PN10": [['DN25',115,85,4,14],['DN40',150,110,4,18],['DN50',165,125,4,18],['DN65',185,145,8,18],['DN80',200,160,8,18],['DN100',220,180,8,18],['DN125',250,210,8,18],['DN150',285,240,8,22],['DN200',340,295,8,22],['DN250',395,350,12,22],['DN300',445,400,12,22],['DN350',505,460,16,22],['DN400',565,515,16,26],['DN450',615,565,20,26],['DN500',670,620,20,26],['DN600',780,725,20,30]],
  "EN 1092 / DIN PN16": [['DN25',115,85,4,14],['DN40',150,110,4,18],['DN50',165,125,4,18],['DN65',185,145,8,18],['DN80',200,160,8,18],['DN100',220,180,8,18],['DN125',250,210,8,18],['DN150',285,240,8,22],['DN200',340,295,12,22],['DN250',405,355,12,26],['DN300',460,410,12,26],['DN350',520,470,16,26],['DN400',580,525,16,30],['DN450',640,585,20,30],['DN500',715,650,20,33],['DN600',840,770,20,36]]
};

const parseNum = v => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
};

const findFlangeCandidates = (f) => {
  const od = parseNum(f.f_od ?? f.od);
  const pcd = parseNum(f.pcd);
  const n = parseNum(f.n_bolt ?? f.bolt_n);
  const hole = parseNum(f.hole ?? f.hole_dia);
  if (od == null && pcd == null) return null;
  const res = [];
  Object.keys(FL).forEach(std => {
    FL[std].forEach(r => {
      let sc = 0;
      if (od != null) sc += Math.abs(od - r[1]);
      if (pcd != null) sc += 2 * Math.abs(pcd - r[2]);
      if (n != null && n !== r[3]) sc += 40;
      if (hole != null) sc += Math.abs(hole - r[4]);
      res.push({ std, r, sc });
    });
  });
  return res.sort((a, b) => a.sc - b.sc).slice(0, 4);
};

const getFlangeRow = (std, size) => {
  const rows = FL[std];
  if (!rows || !size) return null;
  const norm = x => String(x).replace(/\s/g, '').toUpperCase();
  const sz = norm(size);
  return rows.find(x => {
    const m = x[0].match(/\((.*)\)/);
    return sz === norm(x[0]) || sz === norm(x[0].split(' ')[0]) || (m && sz === norm(m[1]));
  }) || null;
};

// Template Engine akan diload dari API berdasarkan product.code
// const MOCK_TEMPLATE = {...} dihapus

export default function DynamicProductForm({ product, onClose, onSave, onChange, existingData = {}, schedules = [], readOnly = false, noSurvey = null }) {
  const { user: currentUser } = useAuth() || {};
  const [sections, setSections] = useState([]);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [answers, setAnswers] = useState(existingData);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingOutstanding, setIsEditingOutstanding] = useState(false);

  // Sync answers saat produk yang dipilih berganti agar tidak bocor dari produk sebelumnya
  useEffect(() => {
    setAnswers(existingData || {});
  }, [product?.id]);

  // Helper State
  const [matchCandidates, setMatchCandidates] = useState(null);
  const [matchMessage, setMatchMessage] = useState(null);
  const [appliedMessage, setAppliedMessage] = useState(null);

  // PCD Calculator state
  const [pcdN, setPcdN] = useState('');
  const [pcdC, setPcdC] = useState('');

  // Gap Calculator state
  const [gapPoints, setGapPoints] = useState({ g12: '', g3: '', g6: '', g9: '', od: '' });
  const [gapResultMsg, setGapResultMsg] = useState(null);

  const onChangeRef = React.useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        let data = null;
        try {
          const res = await fetch(apiUrl(`survey-engine/template/${product.code}`));
          if (res.ok) {
            data = await res.json();
            await offlineEngine.cacheReference(`survey_template_${product.code}`, 'survey_product', data);
          }
        } catch (netErr) {
          console.warn(`Network error fetching template ${product.code}, reading cache:`, netErr);
          data = await offlineEngine.getReference(`survey_template_${product.code}`);
        }

        if (!data) {
          throw new Error('Template tidak ditemukan secara online maupun lokal');
        }
        
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
      } finally {
        setIsLoading(false);
      }
    };

    if (product?.code) {
      fetchTemplate();
    }
  }, [product.code]);

  const getAutoTagValue = () => product?.displayId || `${product?.code || 'PRD'}-001`;

  const isProductTagQuestion = (question = {}) => {
    const label = (question.label || '').toLowerCase();
    const id = (question.id || '').toLowerCase();
    if (id === 'eq_tag' || label.includes('equipment')) return false;
    return id === 'tag' || id === 'tag_no' || id === 'tag_number' || label.includes('tag number');
  };

  const isEqTagQuestion = (question = {}) => {
    const label = (question.label || '').toLowerCase();
    const id = (question.id || '').toLowerCase();
    return id === 'eq_tag' || (label.includes('tag') && label.includes('equipment'));
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
    if (!sections.length || !autoTagValue || readOnly) return;

    const tagQuestionIds = sections.flatMap(sec => sec.questions || [])
      .filter(isProductTagQuestion)
      .map(q => q.id);

    if (!tagQuestionIds.length) return;

    setAnswers(prev => {
      let changed = false;
      const next = { ...prev };

      tagQuestionIds.forEach(id => {
        if (!next[id] || String(next[id]).trim() === '') {
          next[id] = autoTagValue;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [sections, product?.displayId, product?.code, readOnly]);

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

  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const handleAddPhotos = async (files) => {
    if (readOnly || !files || files.length === 0) return;
    setIsProcessingPhoto(true);
    try {
      const newPhotos = [];
      const currentPhotos = answers.photos || [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await resizeImageToBlob(file, 1200, 0.75);
        const photoCat = (currentPhotos.length + newPhotos.length === 0) ? 'Keseluruhan' : 'Lainnya';
        let uploadedUrl = null;

        // Upload ke backend MinIO / S3
        try {
          const username = currentUser?.username || currentUser?.nama || currentUser?.name || 'user';
          const surveyNumber = noSurvey || answers.no_survey || answers.survey_no || product?.no_survey || 'general-survey';
          const code = product?.code || product?.id || 'product';

          const res = await fetch(apiUrl('survey-engine/upload-photo'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: dataUrl,
              filename: file.name || 'photo.jpg',
              category: photoCat,
              noSurvey: surveyNumber,
              user: username,
              productCode: code
            })
          });
          if (res.ok) {
            const uploadResult = await res.json();
            if (uploadResult?.url) {
              uploadedUrl = uploadResult.url;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Server error upload ke MinIO:', res.status, errData);
          }
        } catch (uploadErr) {
          console.warn('Network error upload ke MinIO, simpan lokal sementara:', uploadErr);
        }

        const photoId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        // Jika upload gagal / offline, simpan Blob ke IndexedDB
        if (!uploadedUrl) {
          try {
            await offlineEngine.saveSurveyPhotoOffline({
              surveyId: noSurvey || answers.no_survey || product?.id || 'survey',
              photoItem: {
                id: photoId,
                blob: file,
                data: dataUrl,
                filename: file.name || 'photo.jpg',
                cat: photoCat,
                productCode: code,
                noSurvey: surveyNumber
              },
              userId: currentUser?.id
            });
          } catch (storageErr) {
            console.error('Gagal menyimpan foto ke IndexedDB:', storageErr);
          }
        }

        newPhotos.push({
          id: photoId,
          url: uploadedUrl || null,
          data: uploadedUrl ? null : dataUrl, // Jika URL MinIO berhasil, tidak perlu simpan base64 besar
          cat: photoCat,
          cap: '',
          created_at: Date.now()
        });
      }
      if (newPhotos.length > 0) {
        setAnswers(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...newPhotos]
        }));
      }
    } catch (err) {
      console.error('Gagal memproses foto:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleUpdatePhoto = (id, field, value) => {
    if (readOnly) return;
    setAnswers(prev => ({
      ...prev,
      photos: (prev.photos || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleDeletePhoto = (id) => {
    if (readOnly) return;
    setAnswers(prev => ({
      ...prev,
      photos: (prev.photos || []).filter(p => p.id !== id)
    }));
  };

  const findQuestionKey = (preferredKeys, labelKeywords = []) => {
    for (const sec of sections) {
      for (const q of (sec.questions || [])) {
        if (preferredKeys.includes(q.id)) return q.id;
      }
    }
    for (const sec of sections) {
      for (const q of (sec.questions || [])) {
        const lowerLabel = (q.label || '').toLowerCase();
        if (labelKeywords.some(kw => lowerLabel.includes(kw))) return q.id;
      }
    }
    return preferredKeys[0];
  };

  const handleFindFlangeMatch = () => {
    const odKey = findQuestionKey(['f_od', 'od'], ['diameter luar', 'od flange']);
    const pcdKey = findQuestionKey(['pcd', 'f_pcd'], ['pcd', 'bolt circle']);
    const nKey = findQuestionKey(['n_bolt', 'bolt_n'], ['jumlah lubang']);
    const holeKey = findQuestionKey(['hole', 'hole_dia'], ['diameter lubang']);

    const fData = {
      f_od: answers[odKey] ?? answers.f_od ?? answers.od,
      pcd: answers[pcdKey] ?? answers.pcd,
      n_bolt: answers[nKey] ?? answers.n_bolt,
      hole: answers[holeKey] ?? answers.hole
    };

    const candidates = findFlangeCandidates(fData);
    if (!candidates) {
      setMatchMessage('Isi OD flange atau PCD di form terlebih dahulu.');
      setMatchCandidates([]);
      return;
    }
    setMatchMessage(null);
    setMatchCandidates(candidates);
  };

  const handleApplyFlangeCandidate = (cand) => {
    if (readOnly) return;
    const stdKey = findQuestionKey(['std', 'fl_std'], ['standar flange']);
    const sizeKey = findQuestionKey(['size1', 'size'], ['ukuran nominal', 'ukuran flange']);
    const nKey = findQuestionKey(['n_bolt', 'bolt_n'], ['jumlah lubang']);
    const holeKey = findQuestionKey(['hole', 'hole_dia'], ['diameter lubang']);

    setAnswers(prev => ({
      ...prev,
      [stdKey]: cand.std,
      [sizeKey]: cand.r[0],
      [nKey]: prev[nKey] ? prev[nKey] : String(cand.r[3]),
      [holeKey]: prev[holeKey] ? prev[holeKey] : String(cand.r[4])
    }));

    setAppliedMessage(`Standar ${cand.std} ${cand.r[0]} berhasil diterapkan ke form.`);
    setTimeout(() => setAppliedMessage(null), 4000);
  };

  const calculatedPcd = React.useMemo(() => {
    const n = parseNum(pcdN || answers[findQuestionKey(['n_bolt', 'bolt_n'], ['jumlah lubang'])]);
    const c = parseNum(pcdC);
    if (!n || n < 3 || !c) return null;
    const p = c / Math.sin(Math.PI / n);
    return p.toFixed(1);
  }, [pcdN, pcdC, answers, sections]);

  const handleApplyPcd = () => {
    if (readOnly || !calculatedPcd) return;
    const pcdKey = findQuestionKey(['pcd', 'f_pcd'], ['pcd', 'bolt circle']);
    handleInputChange(pcdKey, calculatedPcd);
    setAppliedMessage(`PCD ${calculatedPcd} mm berhasil diterapkan.`);
    setTimeout(() => setAppliedMessage(null), 4000);
  };

  const handleCalcGap = () => {
    if (readOnly) return;
    const g12 = parseNum(gapPoints.g12);
    const g3 = parseNum(gapPoints.g3);
    const g6 = parseNum(gapPoints.g6);
    const g9 = parseNum(gapPoints.g9);
    const odVal = parseNum(gapPoints.od || answers[findQuestionKey(['f_od', 'od'], ['diameter luar', 'od flange'])]);

    if ([g12, g3, g6, g9].some(x => x == null) || !odVal) {
      setGapResultMsg({ type: 'error', text: 'Isi keempat titik celah (jam 12, 3, 6, 9) dan OD flange.' });
      return;
    }

    const avg = (g12 + g3 + g6 + g9) / 4;
    const dv = Math.abs(g12 - g6);
    const dh = Math.abs(g3 - g9);
    const ang = Math.atan(Math.sqrt(dv * dv + dh * dh) / odVal) * 180 / Math.PI;

    const ftfKey = findQuestionKey(['ftf', 'f2f', 'panjang_terpasang'], ['face-to-face', 'panjang terpasang']);
    const angKey = findQuestionKey(['ang_mis', 'mis_ang'], ['misalignment angular']);
    const movSrcKey = findQuestionKey(['mov_src'], ['sumber data pergerakan']);

    setAnswers(prev => ({
      ...prev,
      [ftfKey]: avg.toFixed(1),
      [angKey]: ang.toFixed(2),
      [movSrcKey]: prev[movSrcKey] || 'Pengukuran lapangan'
    }));

    setGapResultMsg({
      type: 'success',
      text: `Celah rata-rata ${avg.toFixed(1)} mm, misalignment angular ${ang.toFixed(2)}° telah diisikan ke form.`
    });
    setTimeout(() => setGapResultMsg(null), 5000);
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
          
          // Match inequality: f.field !== 'value'
          const neqMatch = part.match(/^f\.([a-zA-Z0-9_]+)\s*!==\s*(.+)$/);
          if (neqMatch) {
            const fieldName = neqMatch[1];
            let val = neqMatch[2].replace(/['"]/g, '').trim();
            if (val === 'CUSTOM') val = CUSTOM;
            const res = (f[fieldName] !== val);
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

  const isPhotoSection = (sec) => {
    return (sec.id && String(sec.id).toLowerCase().includes('foto')) ||
      (sec.title && String(sec.title).toLowerCase().includes('foto')) ||
      (sec.questions || []).some(q => q.type === 'photo');
  };

  const getSectionProgress = (section) => {
    const isPhotoSec = isPhotoSection(section);
    const visibleQuestions = section.questions.filter(q => evaluateVisibility(q, answers));
    const totalAll = isPhotoSec ? Math.max(visibleQuestions.length, 1) : visibleQuestions.length;
    
    let filledAll = 0;
    let filledRequired = 0;
    let totalRequired = 0;

    visibleQuestions.forEach(q => {
      const isFilled = q.type === 'photo' 
        ? ((answers.photos || []).length > 0 || (answers[q.id] && answers[q.id].length > 0))
        : (answers[q.id] !== undefined && answers[q.id] !== '');

      if (isFilled) filledAll++;
      
      if (q.required) {
        totalRequired++;
        if (isFilled) filledRequired++;
      }
    });

    if (isPhotoSec && visibleQuestions.length === 0) {
      if ((answers.photos || []).length > 0) {
        filledAll = 1;
      }
    }

    let status = 'red';
    if (totalRequired === 0) {
      if (isPhotoSec) {
        status = (answers.photos || []).length > 0 ? 'green' : 'yellow';
      } else {
        status = 'green';
      }
    } else if (filledRequired === totalRequired) {
      status = 'green';
    } else if (filledRequired > 0) {
      status = 'yellow';
    }

    return { filled: filledAll, total: totalAll, filledRequired, totalRequired, status };
  };

  const getOverallPercent = () => {
    let totalRequired = 0;
    let filledRequired = 0;

    sections.forEach(sec => {
      const prog = getSectionProgress(sec);
      totalRequired += prog.totalRequired;
      filledRequired += prog.filledRequired;
    });

    // Jika ada pertanyaan wajib (requirement)
    if (totalRequired > 0) {
      return Math.round((filledRequired / totalRequired) * 100);
    }

    // Fallback jika suatu template tidak memiliki pertanyaan required
    let totalAll = 0;
    let filledAll = 0;
    sections.forEach(sec => {
      const prog = getSectionProgress(sec);
      totalAll += prog.total;
      filledAll += prog.filled;
    });
    if (totalAll === 0) return 100;
    return Math.round((filledAll / totalAll) * 100);
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
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 md:p-6">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] overflow-hidden">
          {/* Header Section */}
          <div className="px-4 py-3 sm:p-5 border-b border-gray-100 flex items-center gap-3 bg-slate-50 shrink-0">
            <button 
              onClick={() => setCurrentSectionId(null)}
              className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 shrink-0"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">{section.title}</h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{product.displayId} - {product.name}</p>
            </div>
            <button
              onClick={() => setCurrentSectionId(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 sm:hidden rounded-lg hover:bg-gray-200 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Section (Form Renderer) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 bg-white">
            {section.questions.filter(q => evaluateVisibility(q, answers)).map((q) => {
              const labelL = (q.label || '').toLowerCase();
              const idL = (q.id || '').toLowerCase();
              const isHariSurvey = labelL.includes('hari survey') || labelL.includes('hari pelaksanaan') || idL === 'hari_ke' || idL.includes('hari_survey') || idL.includes('hari');
              const isProductTag = isProductTagQuestion(q);
              const isEqTag = isEqTagQuestion(q);

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

              if (isProductTag) {
                return (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={answers[q.id] !== undefined ? answers[q.id] : getAutoTagValue()}
                      disabled={readOnly}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                      placeholder={getAutoTagValue()}
                    />
                  </div>
                );
              }

              if (isEqTag) {
                return (
                  <div key={q.id} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      disabled={readOnly}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                      placeholder="mis. P-101A, E-201, TK-01"
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
                    {/* Render input tambahan jika memilih Lainnya / Custom pada Radio */}
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
                ) : (q.type === 'photo' || q.type === 'file') ? (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs text-gray-500">
                      Lampirkan foto/dokumen untuk {q.label}. File foto juga akan otomatis tercatat ke galeri dokumentasi item ini.
                    </p>
                    {!readOnly && (
                      <div className="flex flex-wrap gap-2">
                        <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-2xs">
                          <Camera className="w-4 h-4" />
                          <span>Ambil Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                handleAddPhotos(e.target.files);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50 transition-colors shadow-2xs">
                          <Upload className="w-4 h-4" />
                          <span>Pilih Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                handleAddPhotos(e.target.files);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
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
                    <button 
                      type="button"
                      onClick={handleFindFlangeMatch}
                      className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
                    >
                      Cari standar yang cocok
                    </button>
                  )}

                  {matchMessage && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{matchMessage}</span>
                    </div>
                  )}

                  {appliedMessage && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">{appliedMessage}</span>
                    </div>
                  )}

                  {matchCandidates && matchCandidates.length > 0 && (
                    <div className="mt-4 overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-gray-600 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-3.5 py-2.5">Standar & ukuran</th>
                            <th className="px-3.5 py-2.5">OD / PCD (mm)</th>
                            <th className="px-3.5 py-2.5">Lubang</th>
                            <th className="px-3.5 py-2.5 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {matchCandidates.map((cand, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-3.5 py-2.5">
                                <span className="text-gray-500 block text-[11px]">{cand.std}</span>
                                <span className="font-bold text-gray-900">{cand.r[0]}</span>
                              </td>
                              <td className="px-3.5 py-2.5 font-medium text-gray-700">
                                {cand.r[1]} / {cand.r[2]}
                              </td>
                              <td className="px-3.5 py-2.5 text-gray-700">
                                {cand.r[3]} × Ø{cand.r[4]} mm
                              </td>
                              <td className="px-3.5 py-2.5 text-center">
                                {!readOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyFlangeCandidate(cand)}
                                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md border border-blue-200 transition-colors shadow-2xs"
                                  >
                                    Pakai
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(() => {
                    const stdKey = findQuestionKey(['std', 'fl_std'], ['standar flange']);
                    const sizeKey = findQuestionKey(['size1', 'size'], ['ukuran nominal', 'ukuran flange']);
                    const curStd = answers[stdKey];
                    const curSize = answers[sizeKey];
                    const curRef = curStd && curSize ? getFlangeRow(curStd, curSize) : null;
                    if (!curRef) return null;
                    return (
                      <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg text-xs text-gray-700">
                        <span className="font-semibold text-blue-800">Nilai referensi {curStd} {curRef[0]}:</span>{' '}
                        OD {curRef[1]} mm, PCD {curRef[2]} mm, {curRef[3]} lubang Ø{curRef[4]} mm.
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-3">Hitung PCD dari jarak lubang bersebelahan</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah lubang</label>
                      <input 
                        type="number" 
                        disabled={readOnly} 
                        value={pcdN}
                        onChange={(e) => setPcdN(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-sm focus:ring-1 focus:ring-blue-500 bg-white ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                        placeholder={answers[findQuestionKey(['n_bolt', 'bolt_n'], ['jumlah lubang'])] || "0"} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Jarak antar pusat (mm)</label>
                      <input 
                        type="number" 
                        disabled={readOnly} 
                        value={pcdC}
                        onChange={(e) => setPcdC(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-sm focus:ring-1 focus:ring-blue-500 bg-white ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                        placeholder="0" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-600">
                      {calculatedPcd ? `PCD ≈ ${calculatedPcd} mm` : 'PCD: -'}
                    </span>
                    {!readOnly && (
                      <button 
                        type="button"
                        onClick={handleApplyPcd}
                        disabled={!calculatedPcd}
                        className={`px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {[
                      { key: 'g12', label: 'Jam 12' },
                      { key: 'g3', label: 'Jam 3' },
                      { key: 'g6', label: 'Jam 6' },
                      { key: 'g9', label: 'Jam 9' },
                      { key: 'od', label: 'OD Flange', defaultVal: answers[findQuestionKey(['f_od', 'od'], ['diameter luar', 'od flange'])] }
                    ].map(item => (
                      <div key={item.key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{item.label} (mm)</label>
                        <input 
                          type="number" 
                          disabled={readOnly} 
                          value={gapPoints[item.key] ?? ''}
                          onChange={(e) => setGapPoints(prev => ({ ...prev, [item.key]: e.target.value }))}
                          placeholder={item.defaultVal ? String(item.defaultVal) : '0'}
                          className={`w-full px-3 py-2 rounded-md border border-gray-200 outline-none text-sm focus:ring-1 focus:ring-blue-500 bg-white ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                        />
                      </div>
                    ))}
                  </div>

                  {gapResultMsg && (
                    <div className={`mb-3 p-3 rounded-lg text-xs flex items-center gap-2 ${gapResultMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                      {gapResultMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />}
                      <span>{gapResultMsg.text}</span>
                    </div>
                  )}

                  {!readOnly && (
                    <button 
                      type="button"
                      onClick={handleCalcGap}
                      className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
                    >
                      Hitung & Isi panjang terpasang / misalignment
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Foto Dokumentasi Section Dedicated UI */}
            {isPhotoSection(section) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-blue-600" />
                      Galeri Foto Dokumentasi Lapangan
                    </h4>
                    <p className="text-sm text-gray-500">
                      Ambil foto kondisi eksisting, marking/nameplate, flange, dimensi (sertakan meteran), atau kerusakan.
                    </p>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                        <Camera className="w-4 h-4" />
                        <span>Ambil Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleAddPhotos(e.target.files);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                        <Upload className="w-4 h-4" />
                        <span>Pilih Galeri</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleAddPhotos(e.target.files);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {isProcessingPhoto && (
                  <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2 animate-pulse">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600"></div>
                    <span>Mengompresi dan menyimpan foto...</span>
                  </div>
                )}

                {(!answers.photos || answers.photos.length === 0) ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-slate-50">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">Belum ada foto yang diunggah</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Klik tombol Ambil Foto atau Pilih Galeri di atas untuk menambahkan dokumentasi.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {answers.photos.map((p, idx) => (
                      <div key={p.id || idx} className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={p.data || p.url}
                            alt={p.cap || p.cat || 'Foto'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Kategori</label>
                            <select
                              value={p.cat || 'Keseluruhan'}
                              disabled={readOnly}
                              onChange={(e) => handleUpdatePhoto(p.id, 'cat', e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                            >
                              {PHOTO_CATS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Keterangan Foto</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={p.cap || ''}
                                disabled={readOnly}
                                onChange={(e) => handleUpdatePhoto(p.id, 'cap', e.target.value)}
                                placeholder="mis. Tampak flange retak..."
                                className={`flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-blue-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                              />
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(p.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                  title="Hapus foto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Section */}
          <div className="p-3 sm:p-4 md:p-5 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
            <button 
              onClick={() => {
                setCurrentSectionId(null);
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm text-sm"
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

  const overallPercent = getOverallPercent();

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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 md:p-6">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-3xl flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] overflow-hidden">
        
        {/* Header Master */}
        <div className="px-4 py-3 sm:p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50 shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-blue-200 bg-white flex items-center justify-center text-xs font-bold text-blue-700 shadow-2xs shrink-0">
                {product.code}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">{product.displayId}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 ${
                    overallPercent === 100 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                      : overallPercent >= 50 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {overallPercent}%
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{product.name}</p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-1.5 sm:hidden text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/80 border border-gray-200 shadow-2xs shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="text-left sm:text-right grow sm:grow-0">
              <span className="text-[11px] sm:text-xs font-semibold text-gray-600 block">
                {missingFields.length === 0 ? 'Semua data wajib lengkap' : `${missingFields.length} data wajib belum lengkap`}
              </span>
              <div className="w-full sm:w-32 bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${overallPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="hidden sm:flex p-2 bg-white text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 shadow-sm transition-colors shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Cards List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-700 text-sm sm:text-base">Form Inspeksi Lapangan</h3>
            <span className="text-[11px] sm:text-xs font-medium text-gray-500">{readOnly ? 'Hanya lihat' : 'Pilih modul'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {sections
              .filter(s => isPhotoSection(s) || s.questions.some(q => evaluateVisibility(q, answers)))
              .sort((a, b) => {
                const getOrderIndex = (sec) => {
                  const idL = (sec.id || '').toLowerCase();
                  const titleL = (sec.title || '').toLowerCase();
                  const idx = SECTION_ORDER.findIndex(key => idL.includes(key) || titleL.includes(key));
                  return idx !== -1 ? idx : 999;
                };
                return getOrderIndex(a) - getOrderIndex(b);
              })
              .map((section) => {
              const progress = getSectionProgress(section);
              const isPhoto = isPhotoSection(section);
              const photoCount = (answers.photos || []).length;
              
              // Badge colors based on status
              const statusConfig = {
                green: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                yellow: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                red: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: <AlertCircle className="w-3.5 h-3.5" /> }
              };
              const config = statusConfig[progress.status];

              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSectionId(section.id)}
                  className="flex flex-col text-left bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 hover:border-blue-400 active:bg-blue-50/20 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2 sm:mb-3 w-full">
                    <div className="bg-blue-50 p-1.5 sm:p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {isPhoto ? <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                      {config.icon}
                      <span>
                        {isPhoto 
                          ? `${photoCount} Foto`
                          : progress.totalRequired > 0 
                          ? `${progress.filledRequired}/${progress.totalRequired} Wajib` 
                          : `${progress.filled}/${progress.total} Diisi`}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base mb-0.5">{section.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1 sm:line-clamp-2">{section.description || (isPhoto ? 'Dokumentasi foto lapangan, nameplate, dan hasil ukur' : '')}</p>
                  
                  {/* Info Data Utama */}
                  <div className="mt-2.5">
                    {isPhoto ? (
                      photoCount > 0 ? (
                        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {photoCount} foto tersimpan
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          Belum ada foto
                        </span>
                      )
                    ) : progress.totalRequired === 0 ? (
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Tidak ada data wajib</span>
                    ) : progress.filledRequired < progress.totalRequired ? (
                      <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {progress.totalRequired - progress.filledRequired} info wajib belum
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Lengkap
                      </span>
                    )}
                  </div>
                  
                  <div className="absolute right-3 bottom-3 text-gray-300 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tambahan Catatan & Outstanding */}
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            {/* Catatan Item */}
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4">
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="font-bold text-gray-800 text-sm sm:text-base">Catatan Item</h4>
                {!readOnly && (
                  <button 
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm text-gray-700 min-h-[70px]"
                  placeholder="Masukkan catatan item..."
                />
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">
                  {answers.catatan || 'Belum ada catatan.'}
                </p>
              )}
            </div>

            {/* Perlu Konfirmasi / Outstanding */}
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4">
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="font-bold text-gray-800 text-sm sm:text-base">Perlu Konfirmasi / Outstanding</h4>
                {!readOnly && (
                  <button 
                    onClick={() => setIsEditingOutstanding(!isEditingOutstanding)}
                    className="text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm text-gray-700 min-h-[70px]"
                  placeholder="Masukkan outstanding item..."
                />
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">
                  {answers.outstanding || 'Tidak ada outstanding.'}
                </p>
              )}
            </div>

            {/* Field kritis belum lengkap */}
            {missingFields.length > 0 && (
              <div className="bg-white border border-orange-400 rounded-xl p-3.5 sm:p-4">
                <h4 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm">Field kritis belum lengkap</h4>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{missingFields.join(' • ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Master */}
        <div className="p-3 sm:p-4 md:p-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs sm:text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
            {isAllComplete ? (
              <span className="text-emerald-600 font-bold flex items-center justify-center sm:justify-start gap-1">
                <CheckCircle2 className="w-4 h-4" /> Seluruh section lengkap
              </span>
            ) : (
              <span className="text-rose-500 font-bold flex items-center justify-center sm:justify-start gap-1">
                <AlertCircle className="w-4 h-4" /> Masih ada section belum lengkap
              </span>
            )}
          </div>
          {!readOnly ? (
            <button 
              onClick={() => onSave(answers, getOverallPercent())}
              className="flex items-center justify-center w-full sm:w-auto gap-2 bg-blue-600 text-white px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              Simpan Data Produk
            </button>
          ) : (
            <button 
              onClick={onClose} 
              className="flex items-center justify-center w-full sm:w-auto gap-2 bg-slate-200 text-slate-700 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-300 active:bg-slate-400 transition-colors shadow-sm"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
