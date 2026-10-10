import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 mb-8">
          Anda tidak memiliki akses ke halaman ini. Harap menuju Portal, sistem akan otomatis mengarahkan Anda ke modul yang diizinkan.
        </p>
        <button
          onClick={() => navigate('/portal')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          Kembali ke Portal
        </button>
      </div>
    </div>
  );
}
