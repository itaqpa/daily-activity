import React from 'react';

export default function KpiSection({ project = {} }) {
  const {
    tgl_mulai,
    durasi_hari,
    nilai_kontrak = 0,
    budget_biaya = 0,
    total_biaya = 0,
    progress_actual = 0,
    areas = []
  } = project;

  const actualNum = parseFloat(progress_actual || 0);

  // 1. Current Date
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];

  // 2. Timeline & Hari Berjalan
  const startDate = tgl_mulai ? new Date(tgl_mulai) : new Date();
  const totalDays = parseInt(durasi_hari || 1);
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.floor((today - startDate) / (1000 * 60 * 60 * 24))));
  const remainingDays = Math.max(0, totalDays - elapsedDays);

  // 3. Progress Plan (Rencana s.d. hari ini menggunakan model S-Curve atau linear)
  const calculatePlanProgress = () => {
    if (!totalDays || totalDays <= 0) return 0;
    if (today < startDate) return 0;
    if (elapsedDays >= totalDays) return 100.0;
    const ratio = elapsedDays / totalDays;
    // Sigmoid S-Curve: 3*t^2 - 2*t^3
    const sValue = (3 * Math.pow(ratio, 2) - 2 * Math.pow(ratio, 3)) * 100;
    return parseFloat(sValue.toFixed(1));
  };

  const planNum = calculatePlanProgress();

  // 4. Deviasi (actual - plan)
  const deviasiNum = parseFloat((actualNum - planNum).toFixed(1));

  // 5. Forecast Selesai (dari laju rata-rata)
  const calculateForecastDate = () => {
    if (!startDate || isNaN(startDate.getTime())) return '-';
    if (actualNum >= 100) {
      // Proyek sudah selesai
      return todayFormatted;
    }
    if (actualNum > 0 && elapsedDays > 0) {
      const dailyRate = actualNum / elapsedDays; // % per hari
      const totalEstimatedDays = Math.round(100 / dailyRate);
      const forecastDate = new Date(startDate);
      forecastDate.setDate(forecastDate.getDate() + totalEstimatedDays);
      return forecastDate.toISOString().split('T')[0];
    }
    // Jika belum ada actual, default ke target finish rencana
    const defaultFinish = new Date(startDate);
    defaultFinish.setDate(defaultFinish.getDate() + (totalDays - 1));
    return defaultFinish.toISOString().split('T')[0];
  };

  const forecastDate = calculateForecastDate();

  // 6. Total Biaya & % dari budget
  const budgetNum = parseFloat(budget_biaya || 0);
  const costsNum = parseFloat(total_biaya || 0);
  const budgetRatio = budgetNum > 0 ? ((costsNum / budgetNum) * 100).toFixed(1) : '0.0';

  const formatRupiah = (val) => {
    return Math.round(val).toLocaleString('id-ID');
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* Card 1: Progress actual */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Progress actual</p>
          <p className="text-xl xl:text-2xl font-bold tracking-tight text-gray-900 mt-1">
            {actualNum.toFixed(1)}%
          </p>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          s.d. {todayFormatted}
        </p>
      </div>

      {/* Card 2: Progress plan */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Progress plan</p>
          <p className="text-xl xl:text-2xl font-bold tracking-tight text-gray-900 mt-1">
            {planNum.toFixed(1)}%
          </p>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          rencana s.d. hari ini
        </p>
      </div>

      {/* Card 3: Deviasi */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Deviasi</p>
          <p className={`text-xl xl:text-2xl font-bold tracking-tight mt-1 ${deviasiNum < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {deviasiNum >= 0 ? `+${deviasiNum.toFixed(1)}%` : `${deviasiNum.toFixed(1)}%`}
          </p>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          actual - plan
        </p>
      </div>

      {/* Card 4: Hari berjalan */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Hari berjalan</p>
          <p className="text-xl xl:text-2xl font-bold tracking-tight text-gray-900 mt-1">
            {elapsedDays} / {totalDays}
          </p>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          sisa {remainingDays} hari
        </p>
      </div>

      {/* Card 5: Forecast selesai */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Forecast selesai</p>
          <p className="text-xl xl:text-2xl font-bold tracking-tight text-gray-900 mt-1 truncate" title={forecastDate}>
            {forecastDate}
          </p>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          dari laju rata-rata
        </p>
      </div>

      {/* Card 6: Total biaya */}
      <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Total biaya</p>
          <p className="text-xl xl:text-2xl font-bold tracking-tight text-gray-900 mt-1 truncate" title={`Rp ${formatRupiah(costsNum)}`}>
            Rp {formatRupiah(costsNum)}
          </p>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-2">
          {budgetRatio}% dari budget
        </p>
      </div>
    </div>
  );
}
