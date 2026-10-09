import React, { useState } from 'react';
import { X, Key, ArrowRight } from 'lucide-react';
import { apiUrl } from '../../../api';
import { useNavigate } from 'react-router-dom';

export default function TokenInputModal({ isOpen, onClose, surveyId, noSurvey, userId }) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Token harus diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl(`survey-engine/product-drafts/${surveyId}/tokens/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: token.trim(), userId })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        onClose();
        navigate(`/survey-product/create?id=${surveyId}`);
      } else {
        setError(result.error || 'Token tidak valid');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memverifikasi token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Input Token</h3>
              <p className="text-xs text-gray-500 font-medium">{noSurvey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token Akses Survey
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Masukkan token akses..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? 'Memverifikasi...' : 'Verifikasi Token'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
