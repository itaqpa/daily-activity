import React, { useState, useEffect } from 'react';
import { X, Key, Copy, Check, RefreshCw } from 'lucide-react';
import { apiUrl } from '../../../api';

export default function TokenAccessModal({ isOpen, onClose, surveyId, noSurvey }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isOpen && surveyId) {
      fetchTokens();
    }
  }, [isOpen, surveyId]);

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`survey-engine/product-drafts/${surveyId}/tokens`));
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setUsers(result.tokens || []);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTokens = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(apiUrl(`survey-engine/product-drafts/${surveyId}/tokens/generate`), {
        method: 'POST',
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setUsers(result.tokens || []);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error generating tokens:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (token, id) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Token Access</h3>
              <p className="text-xs text-gray-500 font-medium">{noSurvey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <span className="text-gray-500 text-sm">Memuat data...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm mb-4">Belum ada token untuk survey ini.</p>
              <button
                onClick={generateTokens}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Generate Token
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Daftar akses surveyor:</p>
                <button
                  onClick={generateTokens}
                  disabled={isGenerating}
                  className="text-purple-600 hover:text-purple-700 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate All
                </button>
              </div>
              
              {users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-mono text-sm font-bold text-gray-700 tracking-widest">
                      {user.token || '------'}
                    </div>
                    <button
                      onClick={() => handleCopy(user.token, idx)}
                      disabled={!user.token}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Salin Token"
                    >
                      {copiedId === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
