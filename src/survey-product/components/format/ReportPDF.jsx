import React, { useMemo } from 'react';
import './ReportPDF.css';
import { generateReportHTML } from './LegacyReportLogic';

// Map our app's data structure to the legacy app's `S` structure
const mapDataToLegacyState = (stepData, lapanganData) => {
  const info = {
    client: stepData.nama_client || '',
    tanggal: stepData.tanggal_mulai || '',
    plant: stepData.lokasi || '',
    surveyor: '', // Not in stepData?
    products: stepData.selectedProducts || []
  };

  const days = (lapanganData.actualSchedules || []).map(sch => ({
    id: `d${sch.hari_ke || sch.id}`,
    date: sch.tanggal,
    plan: sch.kegiatan || sch.rencana_area || ''
  }));

  const items = (lapanganData.productProgress || []).map(prod => {
    // prod.formData contains the actual values
    // prod.code is the product type (EJR, EJM, etc)
    return {
      id: `i${prod.id}`,
      prod: prod.code,
      f: prod.formData || {},
      fail: prod.formData?.fail || {}, // Handle fail checklist if we have one
      photos: [], // TODO: photos mapping
      gap: prod.formData?.gap || {},
      cref: prod.formData?.custom_refs || []
    };
  });

  const notes = (lapanganData.survey_notes || []).map(n => ({
    id: `n${n.id}`,
    dayId: `d${n.hari_ke}`,
    itemId: n.itemId ? `i${n.itemId}` : '',
    text: n.catatan,
    t: n.id // using id as timestamp roughly
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

export default function ReportPDF({ stepData, lapanganData }) {
  const htmlContent = useMemo(() => {
    try {
      const mappedS = mapDataToLegacyState(stepData || {}, lapanganData || {});
      // Pass an empty photoMap for now, since photos aren't fully implemented or need blob processing
      return generateReportHTML(mappedS, {});
    } catch (err) {
      console.error('Failed to generate report HTML', err);
      return '<div style="color:red">Gagal membuat laporan: ' + err.message + '</div>';
    }
  }, [stepData, lapanganData]);

  return (
    <div className="report-pdf-container">
      <div 
        className="rpt-wrap print-only" 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    </div>
  );
}
