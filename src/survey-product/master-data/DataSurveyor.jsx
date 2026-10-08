import React from 'react';
import MainLayout from '../../components/layouts/MainLayout';

export default function DataSurveyor() {
  return (
    <MainLayout currentModule="Survey Product">
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-800">Data Surveyor</h1>
        <p className="mt-2 text-gray-600">Halaman ini digunakan untuk mengelola data surveyor.</p>
        
        {/* Placeholder for Data Surveyor list/form */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-gray-500">Fitur sedang dalam pengembangan...</p>
        </div>
      </div>
    </MainLayout>
  );
}
