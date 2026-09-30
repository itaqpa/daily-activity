import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layouts/MainLayout';
import { Users, X } from 'lucide-react';

export default function DataSales() {
  const [salesData, setSalesData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedSales, setSelectedSales] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sales');
      if (!response.ok) {
        throw new Error('Gagal mengambil data sales');
      }
      const data = await response.json();
      setSalesData(data);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat memuat data sales.');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerModal = (sales) => {
    setSelectedSales(sales);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Tim Sales</h2>
          <p className="text-gray-600 mt-1">Daftar seluruh staf dan supervisor di Divisi Sales.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 font-medium text-gray-600">No</th>
                <th className="py-4 px-6 font-medium text-gray-600">Nama Lengkap</th>
                <th className="py-4 px-6 font-medium text-gray-600">Email</th>
                <th className="py-4 px-6 font-medium text-gray-600">Jabatan</th>
                <th className="py-4 px-6 font-medium text-gray-600">Data Customer</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : salesData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    Belum ada data sales.
                  </td>
                </tr>
              ) : (
                salesData.map((sales, index) => (
                  <tr key={sales.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-gray-600">{index + 1}</td>
                    <td className="py-4 px-6 text-gray-800 font-medium">{sales.name}</td>
                    <td className="py-4 px-6 text-gray-600">{sales.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        sales.nama_jabatan === 'Spv' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {sales.nama_jabatan}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => openCustomerModal(sales)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                      >
                        <Users size={16} />
                        <span className="font-semibold">{sales.assigned_customers ? sales.assigned_customers.length : 0} Customer</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer List Modal */}
      {isModalOpen && selectedSales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Daftar Customer</h3>
                <p className="text-sm text-gray-500 mt-1">Assigned ke: <span className="font-semibold text-gray-700">{selectedSales.name}</span></p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              {selectedSales.assigned_customers && selectedSales.assigned_customers.length > 0 ? (
                <div className="space-y-3">
                  {selectedSales.assigned_customers.map(cust => (
                    <div key={cust.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-800 text-sm">{cust.nama_customer}</span>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{cust.no_akun || 'No Akun'}</span>
                      </div>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span> 
                        {cust.site_kota || 'Lokasi tidak diketahui'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Belum ada customer yang di-assign.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
