import React from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SCurveChart({ reportData, chartData, chartOptions }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900">Kurva Aktual vs Perencanaan (S-Curve)</h3>
      </div>
      <div className="w-full h-[400px] mt-4 overflow-x-auto overflow-y-hidden rounded-lg">
        <div className="min-w-[750px] w-full h-full relative">
          {reportData && reportData.length > 0 ? (
            <Chart type="line" data={chartData} options={chartOptions} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                Belum ada data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
