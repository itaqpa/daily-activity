import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Building2, MapPin, Calendar, User, Phone, FileText, Target, Plus, Trash2, PackageOpen, CalendarDays, Users, Printer, ClipboardCheck } from 'lucide-react';
import { apiUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';

export const PRODUCT_LIST = [
  { code: 'EJR', name: 'Expansion Joint Rubber', category: 'Expansion joint' },
  { code: 'EJM', name: 'Expansion Joint Metal', category: 'Expansion joint' },
  { code: 'EJF', name: 'Expansion Joint Fabric', category: 'Expansion joint' },
  { code: 'SWG', name: 'Spiral Wound Gasket', category: 'Gasket' },
  { code: 'GMG', name: 'Grooved Metal Gasket', category: 'Gasket' },
  { code: 'RTI', name: 'Removable Thermal Insulation', category: 'Insulasi' },
  { code: 'GPP', name: 'Gland Packing', category: 'Packing' },
  { code: 'DFG', name: 'Die Formed Graphite', category: 'Packing' }
];

export const createEmptyStepData = () => ({
  created_by: '',
  nama_client: '',
  plant_area: '',
  alamat_lokasi: '',
  tanggal_mulai: '',
  nama_surveyor: '',
  leader_surveyor_id: '',
  leader_surveyor_name: '',
  leader_surveyor: [],
  anggota_surveyor: [],
  nama_marketing: '',
  no_inquiry: '',
  pic_client: '',
  kontak_pic: '',
  tujuan_survey: '',
  selectedProducts: [],
  schedules: [
    { id: 1, hari: '', tanggal: '', rencana_area: '', target_item: '' }
  ]
});

export default function StepData({ data = createEmptyStepData(), persiapanData = null, onChange, readOnly = false }) {
  const { user } = useAuth();
  
  // Constants
  const selectedProducts = data.selectedProducts || [];
  const schedules = (data.schedules?.length ? data.schedules : createEmptyStepData().schedules)
    .map((schedule, index) => ({ ...schedule, hari: index + 1 }));
  const persiapanMasterData = persiapanData?.masterData || [];
  const persiapanState = persiapanData?.state || {};
  const getPersiapanCount = (jenis) => {
    const items = persiapanMasterData.filter(item => item.jenis === jenis);
    const ready = items.filter(item => Boolean(persiapanState[item.id]?.digunakan)).length;
    return { ready, total: items.length };
  };
  const checklistCount = getPersiapanCount('Checklist Persiapan');
  const dokumenCount = getPersiapanCount('Dokumen & Izin');
  
  useEffect(() => {
    if (!readOnly && user && !data.created_by) {
      onChange?.({ ...data, created_by: user.name || user.username || user.email || 'Unknown' });
    }
  }, [readOnly, user, data.created_by, onChange]);

  const leaderSurveyor = data.leader_surveyor?.length
    ? data.leader_surveyor
    : (data.leader_surveyor_id || data.leader_surveyor_name
      ? [{ id: data.leader_surveyor_id, name: data.leader_surveyor_name || data.nama_surveyor }]
      : []);
  const anggotaSurveyor = data.anggota_surveyor || [];
  const [userOptions, setUserOptions] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await fetch(apiUrl('/users'));
        const users = await response.json().catch(() => []);
        if (!response.ok) throw new Error('Gagal memuat user');
        if (!isMounted) return;
        setUserOptions(
          users
            .filter(user => user.is_active !== false)
            .map(user => ({
              value: user.id,
              label: user.name || user.username || user.email,
              email: user.email || '',
              username: user.username || '',
              name: user.name || user.username || user.email
            }))
        );
      } catch (error) {
        if (isMounted) setUserOptions([]);
      } finally {
        if (isMounted) setIsLoadingUsers(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const leaderOptions = useMemo(() => {
    return leaderSurveyor.map(leader => (
      userOptions.find(option => String(option.value) === String(leader.id)) || {
        value: leader.id || leader.name,
        label: leader.name || leader.email || 'Leader Surveyor',
        email: leader.email || '',
        name: leader.name || leader.email || 'Leader Surveyor'
      }
    ));
  }, [leaderSurveyor, userOptions]);

  const memberOptions = useMemo(() => {
    return anggotaSurveyor.map(member => (
      userOptions.find(option => String(option.value) === String(member.id)) || {
        value: member.id || member.name,
        label: member.name || member.email || 'Surveyor',
        email: member.email || '',
        name: member.name || member.email || 'Surveyor'
      }
    ));
  }, [anggotaSurveyor, userOptions]);

  const availableMemberOptions = useMemo(() => (
    userOptions.filter(option => !leaderSurveyor.some(leader => String(leader.id) === String(option.value)))
  ), [leaderSurveyor, userOptions]);

  const buildSurveyorName = (leaders, members) => {
    const names = [
      ...leaders.map(leader => leader.name || leader.label).filter(Boolean),
      ...members.map(member => member.name || member.label).filter(Boolean)
    ].filter(Boolean);
    return names.join(', ');
  };

  const updateData = (patch) => {
    if (readOnly) return;
    onChange?.({ ...data, ...patch });
  };

  const updateField = (field, value) => {
    updateData({ [field]: value });
  };

  const toggleProduct = (code) => {
    const nextProducts = selectedProducts.includes(code)
      ? selectedProducts.filter(c => c !== code)
      : [...selectedProducts, code];
    updateData({ selectedProducts: nextProducts });
  };

  const updateSchedule = (id, field, value) => {
    updateData({
      schedules: schedules.map(schedule =>
        schedule.id === id ? { ...schedule, [field]: value } : schedule
      )
    });
  };

  const addSchedule = () => {
    updateData({
      schedules: [
        ...schedules,
        { id: Date.now(), hari: schedules.length + 1, tanggal: '', rencana_area: '', target_item: '' }
      ]
    });
  };

  const removeSchedule = (id) => {
    const nextSchedules = schedules.length === 1
      ? schedules
      : schedules.filter(s => s.id !== id).map((schedule, index) => ({ ...schedule, hari: index + 1 }));

    updateData({
      schedules: nextSchedules
    });
  };

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const printPersiapanSummary = () => {
    const rows = persiapanMasterData.map((item, index) => {
      const itemState = persiapanState[item.id] || {};
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.jenis || '-')}</td>
          <td>${escapeHtml(item.ket_tambahan || '-')}</td>
          <td>${escapeHtml(item.label || '-')}</td>
          <td>${itemState.digunakan ? 'Ya' : 'Tidak'}</td>
          <td>${itemState.qty || ''}</td>
        </tr>
      `;
    }).join('');
    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ringkasan Persiapan Survey</title>
        <style>
          body { margin: 24px; font-family: Arial, sans-serif; color: #111827; }
          h1 { margin: 0 0 4px; font-size: 20px; }
          .meta { margin: 0 0 18px; color: #4b5563; font-size: 12px; }
          .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 18px; }
          .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; }
          .label { color: #4b5563; font-size: 12px; font-weight: 700; }
          .value { margin-top: 4px; font-size: 24px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #d1d5db; padding: 7px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
          @media print { body { margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>Ringkasan Persiapan Survey Product</h1>
        <p class="meta">${escapeHtml(data.no_survey || '-')} | ${escapeHtml(data.nama_client || '-')} | ${escapeHtml(data.plant_area || '-')}</p>
        <section class="cards">
          <div class="card"><div class="label">Peralatan / APD siap</div><div class="value">${checklistCount.ready} / ${checklistCount.total}</div></div>
          <div class="card"><div class="label">Dokumen & izin siap</div><div class="value">${dokumenCount.ready} / ${dokumenCount.total}</div></div>
        </section>
        <table>
          <thead>
            <tr><th>No</th><th>Jenis</th><th>Kategori</th><th>Item</th><th>Siap</th><th>Qty</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak PDF.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleLeadersChange = (selectedOptions = []) => {
    const nextLeaders = selectedOptions.map(option => ({
      id: option.value,
      name: option.name || option.label,
      email: option.email || ''
    }));
    const nextMembers = anggotaSurveyor.filter(member =>
      !nextLeaders.some(leader => String(leader.id) === String(member.id))
    );
    const firstLeader = nextLeaders[0];
    updateData({
      leader_surveyor: nextLeaders,
      leader_surveyor_id: firstLeader?.id || '',
      leader_surveyor_name: firstLeader?.name || '',
      anggota_surveyor: nextMembers,
      nama_surveyor: buildSurveyorName(nextLeaders, nextMembers)
    });
  };

  const handleMembersChange = (selectedOptions = []) => {
    const nextMembers = selectedOptions.map(option => ({
      id: option.value,
      name: option.name || option.label,
      email: option.email || ''
    }));
    updateData({
      anggota_surveyor: nextMembers,
      nama_surveyor: buildSurveyorName(leaderOptions, nextMembers)
    });
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.75rem',
      borderColor: readOnly ? '#e5e7eb' : (state.isFocused ? '#3b82f6' : '#e5e7eb'),
      boxShadow: !readOnly && state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
      backgroundColor: readOnly ? '#f3f4f6' : '#fff',
      '&:hover': { borderColor: '#3b82f6' },
      fontSize: '0.875rem'
    }),
    placeholder: (base) => ({ ...base, color: '#9ca3af' }),
    multiValue: (base) => ({
      ...base,
      borderRadius: '999px',
      backgroundColor: '#eff6ff',
      paddingLeft: '4px'
    }),
    multiValueLabel: (base) => ({ ...base, color: '#1d4ed8', fontWeight: 600 }),
    multiValueRemove: (base) => ({ ...base, borderRadius: '999px' }),
    menu: (base) => ({ ...base, zIndex: 30, borderRadius: '0.75rem', overflow: 'hidden' })
  };

  return (
    <div className="space-y-8">
      {readOnly && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">Read-Only</span>
            <span className="font-semibold text-emerald-900">Survey sudah selesai.</span>
            <span className="text-emerald-700">Data pada step ini hanya dapat dilihat.</span>
          </div>
        </div>
      )}

      {/* Section 1: Data Survey */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Data Survey</h2>
            <p className="text-sm text-gray-500">Informasi utama terkait identitas dan lokasi survey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Client / Perusahaan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data Client / Perusahaan <span className="text-red-500">*</span></label>
            <div className="relative">
              <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={data.nama_client || ''} disabled={readOnly} onChange={(e) => updateField('nama_client', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Nama Perusahaan Client" />
            </div>
          </div>

          {/* Plant / Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Plant / Area <span className="text-red-500">*</span></label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={data.plant_area || ''} disabled={readOnly} onChange={(e) => updateField('plant_area', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Area Plant" />
            </div>
          </div>

          {/* Alamat Lokasi */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lokasi <span className="text-red-500">*</span></label>
            <textarea rows="3" value={data.alamat_lokasi || ''} disabled={readOnly} onChange={(e) => updateField('alamat_lokasi', e.target.value)} className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Alamat lengkap lokasi survey..."></textarea>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" value={data.tanggal_mulai || ''} disabled={readOnly} onChange={(e) => updateField('tanggal_mulai', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {/* Tim Surveyor */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Tim Surveyor</h3>
                <p className="text-xs text-gray-500">Pilih leader yang bertanggung jawab dan anggota yang ikut survey.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Leader Surveyor <span className="text-red-500">*</span></label>
                <Select
                  options={userOptions}
                  value={leaderOptions}
                  onChange={handleLeadersChange}
                  placeholder={isLoadingUsers ? 'Memuat user...' : 'Pilih leader surveyor'}
                  isMulti
                  isSearchable
                  isLoading={isLoadingUsers}
                  isDisabled={readOnly}
                  closeMenuOnSelect={false}
                  styles={selectStyles}
                  noOptionsMessage={() => 'User tidak ditemukan'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Anggota Surveyor</label>
                <Select
                  options={availableMemberOptions}
                  value={memberOptions}
                  onChange={handleMembersChange}
                  placeholder={isLoadingUsers ? 'Memuat user...' : 'Pilih anggota surveyor'}
                  isMulti
                  isSearchable
                  isLoading={isLoadingUsers}
                  isDisabled={readOnly}
                  closeMenuOnSelect={false}
                  styles={selectStyles}
                  noOptionsMessage={() => 'User tidak ditemukan'}
                />
              </div>
            </div>
          </div>

          {/* Marketing / Sales */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Marketing / Sales <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={data.nama_marketing || ''} disabled={readOnly} onChange={(e) => updateField('nama_marketing', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Nama Marketing" />
            </div>
          </div>

          {/* No Inquiry / Referensi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">No Inquiry / Referensi</label>
            <div className="relative">
              <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={data.no_inquiry || ''} disabled={readOnly} onChange={(e) => updateField('no_inquiry', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Nomor referensi (opsional)" />
            </div>
          </div>

          {/* PIC Client */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">PIC Client <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={data.pic_client || ''} disabled={readOnly} onChange={(e) => updateField('pic_client', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Nama PIC dari Client" />
            </div>
          </div>

          {/* Kontak PIC */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kontak PIC <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={data.kontak_pic || ''} disabled={readOnly} onChange={(e) => updateField('kontak_pic', e.target.value)} className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="No HP / Email PIC" />
            </div>
          </div>

          {/* Tujuan Survey */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tujuan Survey <span className="text-red-500">*</span></label>
            <div className="relative">
              <Target className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <textarea rows="3" value={data.tujuan_survey || ''} disabled={readOnly} onChange={(e) => updateField('tujuan_survey', e.target.value)} className={`w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Sebutkan tujuan pelaksanaan survey..."></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Produk yang direncanakan */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Produk Terencana</h2>
            <p className="text-sm text-gray-500">Pilih produk yang direncanakan untuk disurvey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCT_LIST.map((product) => {
            const isSelected = selectedProducts.includes(product.code);
            return (
              <label 
                key={product.code} 
                className={`relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200 ${readOnly ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                    {product.code}
                  </span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <div className="mt-1">
                  <h3 className={`font-semibold text-sm ${isSelected ? 'text-purple-900' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isSelected}
                  disabled={readOnly}
                  onChange={() => toggleProduct(product.code)}
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 3: Rencana Jadwal Survey */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Rencana Jadwal</h2>
              <p className="text-sm text-gray-500">Alokasi hari dan target item di lapangan</p>
            </div>
          </div>
          {!readOnly && (
            <button onClick={addSchedule} className="flex items-center gap-1.5 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-200 transition-colors">
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </button>
          )}
        </div>

        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <div key={schedule.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hari ke:</label>
                <input type="number" min="1" value={index + 1} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal</label>
                <input type="date" value={schedule.tanggal || ''} disabled={readOnly} onChange={(e) => updateSchedule(schedule.id, 'tanggal', e.target.value)} className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Rencana / Area</label>
                <input type="text" value={schedule.rencana_area || ''} disabled={readOnly} onChange={(e) => updateSchedule(schedule.id, 'rencana_area', e.target.value)} className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Cth: Area Produksi 1" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Target Item</label>
                <input type="number" value={schedule.target_item || ''} disabled={readOnly} onChange={(e) => updateSchedule(schedule.id, 'target_item', e.target.value)} className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Jml Target" />
              </div>
              {!readOnly && (
              <div className="md:col-span-1 flex justify-end md:justify-center pt-5">
                <button 
                  onClick={() => removeSchedule(schedule.id)}
                  disabled={schedules.length === 1}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {persiapanMasterData.length > 0 && (
        <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ringkasan Persiapan</h2>
                <p className="text-sm text-gray-500">Checklist peralatan/APD serta dokumen dan izin sebelum survey.</p>
              </div>
            </div>
            <button
              onClick={printPersiapanSummary}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-700"
            >
              <Printer className="h-4 w-4" /> Unduh PDF
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-orange-500">Peralatan / APD siap</div>
              <div className="mt-1 text-2xl font-extrabold text-gray-900">{checklistCount.ready} / {checklistCount.total}</div>
            </div>
            <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-orange-500">Dokumen & izin siap</div>
              <div className="mt-1 text-2xl font-extrabold text-gray-900">{dokumenCount.ready} / {dokumenCount.total}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
