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

export const exportToPDF = (stepData, lapanganData, filterProductCode = null) => {
  try {
    const mappedS = mapDataToLegacyState(stepData || {}, lapanganData || {}, filterProductCode);
    
    // Generate inner report HTML using Legacy logic
    const reportBodyHtml = generateReportHTML(mappedS, {});
    
    // Construct full HTML document
    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Laporan Survey ${mappedS.info.client || ''}</title>
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --body: 'Barlow', system-ui, sans-serif;
            --cond: 'Barlow Condensed', 'Arial Narrow', sans-serif;
          }
          body {
            margin: 0;
            background: #fff;
          }
          /* Inject original template CSS */
          ${cssContent}
          .rpt {
            max-width: 960px;
            margin: 0 auto;
          }
          @media print {
            .rpt { padding: 0; }
            .noprint { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="rpt">
          ${reportBodyHtml}
        </div>
        <script>
          // Wait for fonts/images to load before printing
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // Open in new window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert("Popup diblokir oleh browser. Izinkan popup untuk mencetak PDF.");
    }
  } catch (err) {
    console.error("Gagal export PDF:", err);
    alert("Gagal membuat laporan PDF: " + err.message);
  }
};
