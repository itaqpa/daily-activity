import { generateReportHTML } from '../components/format/LegacyReportLogic';
import cssContent from '../components/format/ReportPDF.css?raw';

const mapDataToLegacyState = (stepData, lapanganData, filterProductCode) => {
  const info = {
    client: stepData.nama_client || '',
    tanggal: stepData.tanggal_mulai || '',
    plant: stepData.lokasi || '',
    surveyor: '', 
    products: stepData.selectedProducts || []
  };

  const days = (lapanganData.actualSchedules || []).map(sch => ({
    id: `d${sch.hari_ke || sch.id}`,
    date: sch.tanggal,
    plan: sch.kegiatan || sch.rencana_area || ''
  }));

  let rawItems = lapanganData.productProgress || [];
  
  if (filterProductCode) {
    rawItems = rawItems.filter(p => p.code === filterProductCode);
  }

  const items = rawItems.map(prod => {
    return {
      id: `i${prod.id}`,
      prod: prod.code,
      f: prod.formData || {},
      fail: prod.formData?.fail || {},
      photos: [], // TODO: mapping photos if available
      gap: prod.formData?.gap || {},
      cref: prod.formData?.custom_refs || []
    };
  });

  const notes = (lapanganData.survey_notes || []).map(n => ({
    id: `n${n.id}`,
    dayId: `d${n.hari_ke}`,
    itemId: n.itemId ? `i${n.itemId}` : '',
    text: n.catatan,
    t: n.id 
  }));

  const openItems = (lapanganData.survey_outstanding || []).map(o => ({
    id: `o${o.id}`,
    text: o.outstanding,
    done: o.status === 'Selesai'
  }));

  return {
    info,
    days,
    items,
    notes,
    openItems,
    summary: lapanganData.catatan_umum || stepData.summary || ''
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
