import React from 'react';

export default function ProjectListTable({ computedMetrics, dateFrom, dateTo, formatCurrency }) {
  if (!computedMetrics || computedMetrics.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-lg">Daftar Semua Project <span className="text-sm font-normal text-blue-200 ml-2">(Dari {dateFrom} Hingga {dateTo})</span></h3>
          <span className="text-sm text-blue-200">{computedMetrics.length} Project Ditemukan</span>
      </div>
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Plan (%)</th>
                  <th className="px-4 py-3 font-semibold text-right">Actual (%)</th>
                  <th className="px-4 py-3 font-semibold text-right">Budget (Rp)</th>
                  <th className="px-4 py-3 font-semibold text-right">Cost (Rp)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {computedMetrics.map((p, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{p.no_project}</div>
                      <div className="text-gray-500 text-xs">{p.nama}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.customer || '-'}</td>
                    <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'running' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                          {p.status}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.computed_plan.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{p.computed_actual.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(p.budget_biaya)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.computed_cost > p.budget_biaya ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(p.computed_cost)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}
