import { generateReportHTML } from '../components/format/LegacyReportLogic';
import cssContent from '../components/format/ReportPDF.css?raw';

export const mapDataToLegacyState = (stepData = {}, lapanganData = {}, filterProductCode = null) => {
  // Susun nama surveyor dari berbagai kemungkinan format
  let surveyorName = stepData.nama_surveyor || stepData.leader_surveyor_name || '';
  if (!surveyorName && Array.isArray(stepData.leader_surveyor) && stepData.leader_surveyor.length > 0) {
    surveyorName = stepData.leader_surveyor.map(l => l.name || l.label).filter(Boolean).join(', ');
  }
  if (Array.isArray(stepData.anggota_surveyor) && stepData.anggota_surveyor.length > 0) {
    const memberNames = stepData.anggota_surveyor.map(m => m.name || m.label).filter(Boolean).join(', ');
    if (memberNames) {
      surveyorName = surveyorName ? `${surveyorName}, ${memberNames}` : memberNames;
    }
  }

  let rawItems = lapanganData.productProgress || [];
  if (filterProductCode) {
    rawItems = rawItems.filter(p => p.code === filterProductCode);
  }

  const selectedProducts = (stepData.selectedProducts && stepData.selectedProducts.length > 0)
    ? [...stepData.selectedProducts]
    : [...new Set(rawItems.map(p => p.code).filter(Boolean))];

  // Pastikan produk yang ada di rawItems juga terdaftar
  rawItems.forEach(p => {
    if (p.code && !selectedProducts.includes(p.code)) {
      selectedProducts.push(p.code);
    }
  });

  const productNames = {};
  rawItems.forEach(p => {
    if (p.code && p.name) {
      productNames[p.code] = p.name;
    }
  });

  const info = {
    client: stepData.nama_client || '',
    plant: stepData.plant_area || stepData.lokasi || '',
    lokasi: stepData.alamat_lokasi || '',
    tanggal: stepData.tanggal_mulai || '',
    surveyor: surveyorName,
    pic: stepData.pic_client || '',
    pic_kontak: stepData.kontak_pic || '',
    ref: stepData.no_inquiry || stepData.no_survey || '',
    tujuan: stepData.tujuan_survey || '',
    products: selectedProducts
  };

  const rawSchedules = (lapanganData.actualSchedules && lapanganData.actualSchedules.length > 0)
    ? lapanganData.actualSchedules
    : (stepData.schedules && stepData.schedules.length > 0 ? stepData.schedules : []);

  const days = rawSchedules.length > 0
    ? rawSchedules.map((sch, idx) => ({
        id: `d${sch.hari_ke || sch.hari || (idx + 1)}`,
        date: sch.tanggal || (idx === 0 ? stepData.tanggal_mulai : '') || '',
        plan: sch.kegiatan || sch.rencana_area || ''
      }))
    : [{ id: 'd1', date: stepData.tanggal_mulai || '', plan: 'Pelaksanaan survey' }];

  // Normalisasi field key: DynamicProductForm menyimpan dengan format "PRODUCT.SECTION.KEY" (mis. "GMG.ident.tag")
  // Sedangkan LegacyReportLogic membaca field key langsung (mis. "tag", "qty", "posisi", dll).
  const normalizeFormData = (formData = {}, prod = {}) => {
    const raw = formData || {};
    const normalized = { ...raw };

    for (const [key, val] of Object.entries(raw)) {
      if (!key) continue;
      const parts = key.split('.');
      const shortKey = parts[parts.length - 1];
      if (shortKey && (normalized[shortKey] === undefined || normalized[shortKey] === '')) {
        normalized[shortKey] = val;
      }
    }

    // Normalisasi 'day' agar cocok dengan id di days (mis. "d1", "d2")
    if (normalized.day) {
      if (typeof normalized.day === 'string') {
        const match = normalized.day.match(/Hari ke\s*(\d+)/i);
        if (match) {
          normalized.day = `d${match[1]}`;
        } else if (!normalized.day.startsWith('d')) {
          normalized.day = `d${normalized.day}`;
        }
      } else if (typeof normalized.day === 'number') {
        normalized.day = `d${normalized.day}`;
      }
    } else {
      normalized.day = `d${prod.hari_ke || 1}`;
    }

    // Fallback tag jika masih kosong
    if (!normalized.tag && (prod.displayId || prod.display_id || prod.name)) {
      normalized.tag = prod.displayId || prod.display_id || prod.name;
    }

    return normalized;
  };

  const items = rawItems
    .filter(prod => prod && (prod.code || prod.name))
    .map(prod => {
      const normF = normalizeFormData(prod.formData || {}, prod);
      const rawPhotos = prod.formData?.photos || prod.photos || normF.photos || prod.formData?.foto || [];
      const photos = Array.isArray(rawPhotos) ? rawPhotos : (typeof rawPhotos === 'object' && rawPhotos ? Object.values(rawPhotos) : []);
      return {
        id: `i${prod.id || Math.random().toString(36).slice(2, 7)}`,
        prod: prod.code || '',
        name: prod.name || prod.code || '',
        percent: prod.percent != null ? prod.percent : null,
        f: normF,
        fail: prod.formData?.fail || normF.fail || {},
        photos: photos,
        gap: prod.formData?.gap || normF.gap || {},
        cref: prod.formData?.custom_refs || normF.custom_refs || []
      };
    });

  // 1. Kumpulkan notes dari survey_notes maupun catatan tiap item produk / survey level
  const notes = [...(lapanganData.survey_notes || []).map(n => ({
    id: `n${n.id}`,
    dayId: n.hari_ke ? (String(n.hari_ke).startsWith('d') ? n.hari_ke : `d${n.hari_ke}`) : 'd1',
    itemId: n.itemId ? `i${n.itemId}` : '',
    text: n.catatan,
    t: n.id 
  }))];

  // Tambahkan catatan umum jika ada
  if (lapanganData.catatan_umum || stepData.catatan_umum) {
    const generalNote = lapanganData.catatan_umum || stepData.catatan_umum;
    notes.push({
      id: `n_general`,
      dayId: 'd1',
      itemId: '',
      text: generalNote,
      t: Date.now()
    });
  }

  // Tambahkan catatan dari masing-masing item produk jika diisi di form
  items.forEach(it => {
    const noteText = it.f.catatan || it.f.ket || it.f.catatan_lapangan || it.f.kondisi_ket;
    if (noteText && String(noteText).trim()) {
      notes.push({
        id: `n_${it.id}`,
        dayId: it.f.day || 'd1',
        itemId: it.id,
        text: String(noteText).trim(),
        t: Date.now()
      });
    }
  });

  // 2. Kumpulkan openItems / outstanding dari survey_outstanding maupun per item produk
  const openItems = [...(lapanganData.survey_outstanding || []).map(o => ({
    id: `o${o.id}`,
    text: o.outstanding || o.text || '',
    done: o.status === 'Selesai' || o.done === true
  }))];

  items.forEach(it => {
    const outText = it.f.outstanding || it.f.perlu_konfirmasi || it.f.konfirmasi_client;
    if (outText && String(outText).trim()) {
      openItems.push({
        id: `o_${it.id}`,
        text: `[${it.prod} ${it.f.tag || ''}] ${String(outText).trim()}`,
        done: it.f.outstanding_status === 'Selesai'
      });
    }
  });

  return {
    info,
    days,
    items,
    notes,
    openItems,
    productNames,
    summary: lapanganData.catatan_umum || stepData.summary || stepData.tujuan_survey || ''
  };
};

export const generatePreviewHTML = (stepData, lapanganData, filterProductCode = null, scale = 1) => {
  const mappedS = mapDataToLegacyState(stepData || {}, lapanganData || {}, filterProductCode);
  const reportBodyHtml = generateReportHTML(mappedS, {});
  
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Survey ${mappedS.info.client || ''}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --body: 'Barlow', system-ui, sans-serif;
          --cond: 'Barlow Condensed', 'Arial Narrow', sans-serif;
        }
        body {
          margin: 0;
          background: #fff; 
          zoom: ${scale};
        }
        /* Inject original template CSS */
        ${cssContent}
        .rpt {
          width: 794px; /* A4 width */
          min-height: 100vh;
          margin: 0 auto;
          background: #fff;
          padding: 10mm;
          box-sizing: border-box;
        }
        @media print {
          body { zoom: 1 !important; }
          .rpt { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
          .noprint { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="rpt">
        ${reportBodyHtml}
      </div>
    </body>
    </html>
  `;
};

export const exportToPDF = (stepData, lapanganData, filterProductCode = null) => {
  try {
    const html = generatePreviewHTML(stepData, lapanganData, filterProductCode);
    const htmlWithPrint = html.replace('</body>', '<script>window.onload = () => setTimeout(() => window.print(), 500);</script></body>');

    // Open in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlWithPrint);
      printWindow.document.close();
    } else {
      alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak PDF.");
    }
  } catch (err) {
    console.error("Gagal export PDF:", err);
    alert("Gagal membuat laporan PDF: " + err.message);
  }
};
