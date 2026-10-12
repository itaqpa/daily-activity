import React, { useMemo } from 'react';
import './ReportPDF.css';
import { generateReportHTML } from './LegacyReportLogic';
import { mapDataToLegacyState } from '../../utils/pdfExport';

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
