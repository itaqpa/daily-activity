import React from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { Truck } from 'lucide-react';

export default function LogisticPlaceholderPage({ title = 'Halaman Logistik', description = 'Fitur dalam tahap pengembangan' }) {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 mb-6">{description}</p>
          <div className="inline-flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            Modul Logistik • Connected to driver_apps database
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
