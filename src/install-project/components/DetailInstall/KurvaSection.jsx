import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function KurvaSection({ project = {} }) {
  const { 
    tgl_mulai, 
    durasi_hari = 30, 
    progress_actual = 0, 
    areas = [] 
  } = project;

  const actualTotal = parseFloat(progress_actual || 0);

  // Palette warna untuk unit di Kurva 2
  const unitColors = [
    '#b91c1c', // Red
    '#b45309', // Amber / Gold
    '#15803d', // Green
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#0d9488', // Teal
    '#db2777', // Pink
    '#ea580c'  // Orange
  ];

  // Helper formatting MM-DD
  const formatMMDD = (d) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };

  // Generate timeline date points
  const timeline = useMemo(() => {
    const totalDays = parseInt(durasi_hari || 30);
    const startDate = tgl_mulai ? new Date(tgl_mulai) : new Date();
    
    // Buat interval tanggal (misal 7-10 titik tanggal)
    const pointsCount = Math.max(5, Math.min(10, Math.ceil(totalDays / 7)));
    const labels = [];
    const dateObjects = [];

    for (let i = 0; i <= pointsCount; i++) {
      const d = new Date(startDate);
      const daysOffset = Math.min(totalDays, Math.round((i / pointsCount) * totalDays));
      d.setDate(d.getDate() + daysOffset);
      labels.push(formatMMDD(d));
      dateObjects.push(d);
    }

    const today = new Date();
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((today - startDate) / (1000 * 60 * 60 * 24))));
    const currentPointFloat = (elapsedDays / totalDays) * pointsCount;

    // 1. Data Plan S-Curve total project
    const planTotalData = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      // Sigmoid S-curve: 3*t^2 - 2*t^3
      const sVal = Math.round((3 * Math.pow(t, 2) - 2 * Math.pow(t, 3)) * 1000) / 10;
      planTotalData.push(sVal);
    }

    // 2. Data Actual total project (up to today)
    const actualTotalData = [];
    for (let i = 0; i <= pointsCount; i++) {
      if (i <= Math.ceil(currentPointFloat)) {
        if (i === Math.ceil(currentPointFloat)) {
          actualTotalData.push(actualTotal);
        } else {
          const ratio = currentPointFloat > 0 ? (i / currentPointFloat) : 0;
          actualTotalData.push(parseFloat((ratio * actualTotal).toFixed(1)));
        }
      } else {
        actualTotalData.push(null);
      }
    }

    // 3. Data Actual per unit
    const unitDatasets = [];
    let colorIdx = 0;

    areas.forEach((area) => {
      (area.units || []).forEach((unit) => {
        const uCap = parseFloat(unit.capaian_unit || 0);
        const color = unitColors[colorIdx % unitColors.length];
        colorIdx++;

        const unitData = [];
        for (let i = 0; i <= pointsCount; i++) {
          if (i <= Math.ceil(currentPointFloat)) {
            if (i === Math.ceil(currentPointFloat)) {
              unitData.push(uCap);
            } else {
              const ratio = currentPointFloat > 0 ? (i / currentPointFloat) : 0;
              unitData.push(parseFloat((ratio * uCap).toFixed(1)));
            }
          } else {
            unitData.push(null);
          }
        }

        unitDatasets.push({
          label: `${area.nama || 'Area'} - ${unit.nama || 'Unit'}`,
          data: unitData,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.2,
          spanGaps: false
        });
      });
    });

    return {
      labels,
      planTotalData,
      actualTotalData,
      unitDatasets
    };
  }, [tgl_mulai, durasi_hari, actualTotal, areas]);

  // Options umum untuk chart
  const createChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start',
        labels: {
          usePointStyle: false,
          boxWidth: 16,
          boxHeight: 2,
          font: {
            size: 11,
            family: 'system-ui, sans-serif'
          },
          color: '#4b5563',
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 8,
        callbacks: {
          label: function (ctx) {
            if (ctx.raw === null || ctx.raw === undefined) return null;
            return ` ${ctx.dataset.label}: ${ctx.raw}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          }
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#9ca3af',
          font: {
            size: 10
          },
          callback: function (val) {
            return val + '%';
          }
        },
        grid: {
          color: 'rgba(243, 244, 246, 1)'
        }
      }
    }
  });

  // Chart 1: Total Project Plan vs Actual
  const totalChartData = {
    labels: timeline.labels,
    datasets: [
      {
        label: 'Plan (Rencana Kerja)',
        data: timeline.planTotalData,
        borderColor: '#1e3a8a', // Dark blue
        backgroundColor: '#1e3a8a',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3
      },
      {
        label: 'Actual (Input Harian)',
        data: timeline.actualTotalData,
        borderColor: '#b45309', // Warm brown / gold
        backgroundColor: '#b45309',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        spanGaps: false
      }
    ]
  };

  // Chart 2: Tiap Unit Actual
  const unitChartData = {
    labels: timeline.labels,
    datasets: timeline.unitDatasets.length > 0 ? timeline.unitDatasets : [
      {
        label: 'Tidak ada data unit',
        data: [0, 0, 0, 0, 0],
        borderColor: '#9ca3af',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Card 1: Kurva S total project, plan vs actual */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <h3 className="font-bold text-gray-900 text-sm mb-3">
          Kurva S total project, plan vs actual
        </h3>
        <div className="h-60 w-full relative">
          <Line data={totalChartData} options={createChartOptions()} />
        </div>
      </div>

      {/* Card 2: Kurva S tiap unit, actual */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <h3 className="font-bold text-gray-900 text-sm mb-3">
          Kurva S tiap unit, actual
        </h3>
        <div className="h-60 w-full relative">
          <Line data={unitChartData} options={createChartOptions()} />
        </div>
      </div>
    </div>
  );
}
