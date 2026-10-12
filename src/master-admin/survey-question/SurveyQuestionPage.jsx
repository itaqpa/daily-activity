import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Filter,
  Edit,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Tag,
  RotateCcw,
  GitBranch
} from 'lucide-react';
import MainLayout from '../../components/layouts/MainLayout';
import { apiUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';
import ModalQuestionForm from './components/ModalQuestionForm';

export default function SurveyQuestionPage() {
  const { hasPermission, user } = useAuth();

  const isSuperAdmin = user?.role === 'admin'
    || (user?.role || '').toLowerCase().includes('super')
    || (user?.nama_jabatan || '').toLowerCase().includes('super')
    || hasPermission('survey_question_view');

  const canCreate = isSuperAdmin || hasPermission('survey_question_create');
  const canEdit = isSuperAdmin || hasPermission('survey_question_edit');
  const canDelete = isSuperAdmin || hasPermission('survey_question_delete');

  // Data states
  const [questions, setQuestions] = useState([]);
  const [allQuestionsPool, setAllQuestionsPool] = useState([]);
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterActive, setFilterActive] = useState('ALL');
  const [filterRequired, setFilterRequired] = useState('ALL');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Feedback Toast state
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch initial products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prodRes = await fetch(apiUrl('survey-engine/admin/products'));
        if (prodRes.ok) setProducts(await prodRes.json());
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch sections correlated with selected filterProduct
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const url = filterProduct && filterProduct !== 'ALL'
          ? apiUrl(`survey-engine/admin/sections?product_code=${filterProduct}`)
          : apiUrl('survey-engine/admin/sections');
        const secRes = await fetch(url);
        if (secRes.ok) {
          const data = await secRes.json();
          setSections(data);
          // Jika section yang sedang dipilih tidak ada di produk yang baru dipilih, reset ke 'ALL'
          setFilterSection(current => {
            if (current !== 'ALL' && !data.some(s => s.name === current)) {
              return 'ALL';
            }
            return current;
          });
        }
      } catch (err) {
        console.error('Failed to fetch sections for product:', err);
      }
    };
    fetchSections();
  }, [filterProduct]);

  // Fetch pool pertanyaan lengkap (unfiltered) untuk referensi percabangan
  const fetchAllQuestionsPool = async () => {
    try {
      const params = new URLSearchParams();
      if (filterProduct && filterProduct !== 'ALL') params.append('product_code', filterProduct);
      const res = await fetch(apiUrl(`survey-engine/admin/questions?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setAllQuestionsPool(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch all questions pool:', err);
    }
  };

  useEffect(() => {
    fetchAllQuestionsPool();
  }, [filterProduct]);

  // Fetch questions
  const fetchQuestions = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (filterProduct && filterProduct !== 'ALL') params.append('product_code', filterProduct);
      if (filterSection && filterSection !== 'ALL') params.append('section', filterSection);
      if (filterActive && filterActive !== 'ALL') params.append('is_active', filterActive);
      if (searchTerm && searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(apiUrl(`survey-engine/admin/questions?${params.toString()}`));
      if (!res.ok) {
        throw new Error('Gagal mengambil daftar pertanyaan');
      }
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch questions error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memuat data');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    setPage(1);
  }, [filterProduct, filterSection, filterActive, searchTerm]);

  // Client-side additional filter for required status
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filterRequired === 'true' && !q.is_required) return false;
      if (filterRequired === 'false' && q.is_required) return false;
      return true;
    });
  }, [questions, filterRequired]);

  // Pagination calculation
  const totalItems = filteredQuestions.length;
  const totalPages = limit === 'all' ? 1 : Math.ceil(totalItems / (Number(limit) || 20));
  const paginatedData = useMemo(() => {
    if (limit === 'all') return filteredQuestions;
    const startIndex = (page - 1) * Number(limit);
    return filteredQuestions.slice(startIndex, startIndex + Number(limit));
  }, [filteredQuestions, page, limit]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = questions.length;
    const active = questions.filter(q => q.is_active).length;
    const required = questions.filter(q => q.is_required).length;
    return { total, active, required, productsCount: products.length };
  }, [questions, products]);

  // Fast Toggle Active (Masih Butuh / Tidak)
  const handleToggleActive = async (item) => {
    if (!canEdit) return;

    // Optimistic Update
    const prevStatus = item.is_active;
    const nextStatus = !prevStatus;

    setQuestions(prev => prev.map(q => q.id === item.id ? { ...q, is_active: nextStatus } : q));

    try {
      const res = await fetch(apiUrl(`survey-engine/admin/questions/${item.id}/toggle-active`), {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Gagal mengubah status aktif');
      showToast(`Pertanyaan "${item.label}" sekarang ${nextStatus ? 'Aktif' : 'Non-Aktif'}`);
    } catch (err) {
      // Rollback
      setQuestions(prev => prev.map(q => q.id === item.id ? { ...q, is_active: prevStatus } : q));
      showToast(err.message || 'Gagal mengubah status', 'error');
    }
  };

  // Fast Toggle Required (Requirement atau Tidak)
  const handleToggleRequired = async (item) => {
    if (!canEdit) return;

    // Optimistic Update
    const prevRequired = item.is_required;
    const nextRequired = !prevRequired;

    setQuestions(prev => prev.map(q => q.id === item.id ? { ...q, is_required: nextRequired } : q));

    try {
      const res = await fetch(apiUrl(`survey-engine/admin/questions/${item.id}/toggle-required`), {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Gagal mengubah status required');
      showToast(`Pertanyaan "${item.label}" sekarang ${nextRequired ? 'Wajib diisi (Required)' : 'Opsional'}`);
    } catch (err) {
      // Rollback
      setQuestions(prev => prev.map(q => q.id === item.id ? { ...q, is_required: prevRequired } : q));
      showToast(err.message || 'Gagal mengubah requirement', 'error');
    }
  };

  // Delete Action
  const handleDelete = async (item) => {
    if (!canDelete) return;

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menonaktifkan / menghapus pertanyaan "${item.label}"?\n\nPertanyaan tidak akan dihapus fisik dari riwayat survei, namun tidak akan muncul lagi di survei baru.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(apiUrl(`survey-engine/admin/questions/${item.id}`), {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus pertanyaan');
      showToast('Pertanyaan berhasil dihapus');
      fetchQuestions();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingQuestion(item);
    setIsModalOpen(true);
  };

  const getShortKey = (qKey) => {
    if (!qKey) return '';
    return qKey.split('.').pop();
  };

  // Kumpulan key pertanyaan yang menjadi pemicu percabangan bagi pertanyaan lain
  const parentTriggerKeys = useMemo(() => {
    const keys = new Set();
    const pool = allQuestionsPool.length > 0 ? allQuestionsPool : questions;
    pool.forEach(q => {
      let vr = q.visibility_rule;
      if (typeof vr === 'string') {
        try { vr = JSON.parse(vr); } catch(e) { vr = {}; }
      }
      if (vr && typeof vr === 'object') {
        if (vr.depends_on) {
          keys.add(vr.depends_on);
        }
        if (vr.source_expression) {
          const s = (vr.source_expression.section_js || '') + ' ' + (vr.source_expression.field_js || '');
          const m = s.match(/f(?:\.([a-zA-Z0-9_]+)|\['([a-zA-Z0-9_]+)'\])/g);
          if (m) {
            m.forEach(match => {
              const cleaned = match.replace(/f\.|\['|'\]/g, '').trim();
              if (cleaned) keys.add(cleaned);
            });
          }
        }
      }
    });
    return keys;
  }, [allQuestionsPool, questions]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <span>{toast.text}</span>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a5f] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Master Admin • Dynamic Survey Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Master Survey Question
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Konfigurasi dinamis seluruh pertanyaan survei per produk. Kelola keaktifan pertanyaan (masih butuh / tidak), keharusan pengisian (required), serta relasi template secara instan.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={handleOpenAdd}
              className="relative z-10 self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pertanyaan</span>
            </button>
          )}

          {/* Decorative Background Glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Pertanyaan</span>
              <div className="text-xl font-black text-gray-900">{stats.total}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Aktif (Masih Butuh)</span>
              <div className="text-xl font-black text-emerald-700">{stats.active}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Wajib Diisi (Required)</span>
              <div className="text-xl font-black text-amber-700">{stats.required}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Produk Tercover</span>
              <div className="text-xl font-black text-indigo-700">{stats.productsCount} Produk</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari label pertanyaan atau kode key..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter by Product */}
            <div className="w-full md:w-56">
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
              >
                <option value="ALL">Semua Produk</option>
                {products.map(p => (
                  <option key={p.code} value={p.code}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Section */}
            <div className="w-full md:w-56">
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
              >
                <option value="ALL">
                  {filterProduct !== 'ALL' ? `Semua Section (${filterProduct})` : 'Semua Section'}
                </option>
                {sections.map(s => (
                  <option key={s.name} value={s.name}>
                    {s.name} {s.total_questions ? `(${s.total_questions})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Cepat:</span>
              </span>

              {/* Filter Status Aktif */}
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setFilterActive('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    filterActive === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActive('true')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    filterActive === 'true' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActive('false')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    filterActive === 'false' ? 'bg-gray-700 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Non-Aktif
                </button>
              </div>

              {/* Filter Requirement */}
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setFilterRequired('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    filterRequired === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRequired('true')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    filterRequired === 'true' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Wajib (Required)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRequired('false')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    filterRequired === 'false' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Opsional
                </button>
              </div>

              {(filterProduct !== 'ALL' || filterSection !== 'ALL' || filterActive !== 'ALL' || filterRequired !== 'ALL' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterProduct('ALL');
                    setFilterSection('ALL');
                    setFilterActive('ALL');
                    setFilterRequired('ALL');
                    setSearchTerm('');
                  }}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 font-semibold px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            <div className="text-gray-500 font-medium">
              Menampilkan <span className="font-bold text-gray-800">{filteredQuestions.length}</span> pertanyaan
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {errorMessage}
          </div>
        )}

        {/* Content Table / Cards */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold">Memuat data pertanyaan...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center p-16 text-gray-400">
              <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300 stroke-1" />
              <h3 className="text-base font-bold text-gray-700">Tidak ada pertanyaan ditemukan</h3>
              <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang dipilih.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Pertanyaan & Key</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Section</th>
                      <th className="py-3.5 px-4 min-w-[120px]">Tipe Input</th>
                      <th className="py-3.5 px-4 min-w-[160px]">Produk Terkait</th>
                      <th className="py-3.5 px-4 text-center w-28">Wajib (Required)</th>
                      <th className="py-3.5 px-4 text-center w-28">Status (Aktif)</th>
                      <th className="py-3.5 px-4 text-center w-20">Urutan</th>
                      <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.map((item, idx) => {
                      const itemNumber = limit === 'all' ? idx + 1 : (page - 1) * Number(limit) + idx + 1;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            !item.is_active ? 'bg-gray-50/50 opacity-70' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-mono text-gray-400">
                            {itemNumber}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 text-sm">
                              {item.label}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-gray-400">
                                {item.question_key}
                              </span>
                              {item.helper_instruction && (
                                <span
                                  title={item.helper_instruction}
                                  className="inline-flex items-center text-blue-500 hover:text-blue-700 cursor-help"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {/* Badge Bersyarat */}
                              {item.visibility_rule && (item.visibility_rule.depends_on || item.visibility_rule.source_expression?.field_js || item.visibility_rule.source_expression?.section_js) && (
                                <span
                                  title={`Bersyarat: Muncul jika ${item.visibility_rule.depends_on || 'jawaban pertanyaan acuan'} terpenuhi`}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                                >
                                  <GitBranch className="w-3 h-3 text-purple-600" />
                                  <span>Bersyarat</span>
                                </span>
                              )}
                              {/* Badge Pemicu Cabang */}
                              {(parentTriggerKeys.has(getShortKey(item.question_key)) || parentTriggerKeys.has(item.question_key)) && (
                                <span
                                  title="Pertanyaan ini memiliki opsi pilihan yang memicu pembukaan kelompok/pertanyaan lain"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                  <GitBranch className="w-3 h-3 text-indigo-600" />
                                  <span>Pemicu Cabang</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px]">
                              {item.section_name || item.section_code}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-700 capitalize">
                              {item.input_type}
                            </div>
                            {item.unit && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                Satuan: {item.unit}
                              </span>
                            )}
                            {Array.isArray(item.options) && item.options.length > 0 && (
                              <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                                {item.options.length} opsi pilihan
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {(() => {
                                const activeList = Array.isArray(item.products)
                                  ? item.products.filter(p => p.is_active !== false)
                                  : [];
                                if (activeList.length === 0) {
                                  return <span className="text-gray-400 italic text-[11px]">-</span>;
                                }
                                if (products.length > 0 && activeList.length >= products.length) {
                                  return (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                                      Semua Produk ({activeList.length})
                                    </span>
                                  );
                                }
                                return activeList.map(p => (
                                  <span
                                    key={p.code}
                                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[10px] font-semibold"
                                  >
                                    {p.code}
                                  </span>
                                ));
                              })()}
                            </div>
                          </td>

                          {/* Switch Wajib (Required) */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleRequired(item)}
                              disabled={!canEdit}
                              title={item.is_required ? 'Klik untuk ubah jadi opsional' : 'Klik untuk jadikan wajib'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                item.is_required
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 ring-1 ring-amber-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              } ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${item.is_required ? 'bg-amber-600' : 'bg-gray-400'}`} />
                              <span>{item.is_required ? 'Wajib' : 'Opsional'}</span>
                            </button>
                          </td>

                          {/* Switch Status Aktif (Masih Butuh) */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              disabled={!canEdit}
                              title={item.is_active ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                item.is_active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 ring-1 ring-emerald-400'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              } ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                              <span>{item.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono text-gray-500">
                            {item.sort_order}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Pertanyaan"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus / Nonaktifkan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedData.map((item, idx) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">
                          {item.section_name || item.section_code}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {item.label}
                        </h4>
                        <span className="text-[11px] font-mono text-gray-400">
                          {item.question_key}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="px-2 py-0.5 bg-gray-100 rounded font-semibold capitalize">
                        {item.input_type} {item.unit && `(${item.unit})`}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">
                        Urutan #{item.sort_order}
                      </span>
                      {(() => {
                        const activeList = Array.isArray(item.products)
                          ? item.products.filter(p => p.is_active !== false)
                          : [];
                        if (activeList.length === 0) return null;
                        if (products.length > 0 && activeList.length >= products.length) {
                          return (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                              Semua Produk
                            </span>
                          );
                        }
                        return activeList.map(p => (
                          <span
                            key={p.code}
                            className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[10px] font-semibold"
                          >
                            {p.code}
                          </span>
                        ));
                      })()}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      {/* Required Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleRequired(item)}
                        disabled={!canEdit}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                          item.is_required
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${item.is_required ? 'bg-amber-600' : 'bg-gray-400'}`} />
                        <span>{item.is_required ? 'Wajib' : 'Opsional'}</span>
                      </button>

                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        disabled={!canEdit}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                        <span>{item.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {!isLoading && filteredQuestions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/50 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <span>Tampilkan</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">Semua</option>
                </select>
                <span>data per halaman</span>
              </div>

              {limit !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-semibold text-gray-700">
                    Halaman {page} dari {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Tambah / Edit */}
        <ModalQuestionForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchQuestions();
            fetchAllQuestionsPool();
            showToast(editingQuestion ? 'Pertanyaan berhasil diperbarui' : 'Pertanyaan baru berhasil ditambahkan');
          }}
          questionData={editingQuestion}
          products={products}
          sections={sections}
          allQuestions={allQuestionsPool.length > 0 ? allQuestionsPool : questions}
        />
      </div>
    </MainLayout>
  );
}
