import React from 'react';

export default function GlobalSummary({ computedMetrics, dateFrom, dateTo, formatCurrency, title = "Global Executive Summary" }) {
  if (!computedMetrics || computedMetrics.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">
        {title} <span className="text-sm font-normal text-gray-500 ml-2">(Dari {dateFrom} Hingga {dateTo})</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="text-xs font-semibold text-blue-800 uppercase">Rata-rata Plan Progress</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {(computedMetrics.reduce((acc, p) => acc + (p.computed_plan || 0), 0) / computedMetrics.length).toFixed(1)}%
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="text-xs font-semibold text-blue-800 uppercase">Rata-rata Actual Progress</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {(computedMetrics.reduce((acc, p) => acc + (p.computed_actual || 0), 0) / computedMetrics.length).toFixed(1)}%
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
          <div className="text-xs font-semibold text-green-800 uppercase">Total Budget (Semua Project)</div>
          <div className="text-xl font-bold text-green-900 mt-1">
            {formatCurrency(computedMetrics.reduce((acc, p) => acc + parseFloat(p.budget_biaya || 0), 0))}
          </div>
          <div className="text-xs text-green-700 mt-1">
            Kontrak: {formatCurrency(computedMetrics.reduce((acc, p) => acc + parseFloat(p.nilai_kontrak || 0), 0))}
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="text-xs font-semibold text-amber-800 uppercase">Total Cost Actual</div>
          <div className="text-xl font-bold text-amber-900 mt-1">
            {formatCurrency(computedMetrics.reduce((acc, p) => acc + (p.computed_cost || 0), 0))}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Sisa Budget: {formatCurrency(
              computedMetrics.reduce((acc, p) => acc + parseFloat(p.budget_biaya || 0), 0) - 
              computedMetrics.reduce((acc, p) => acc + (p.computed_cost || 0), 0)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
