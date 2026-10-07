import React from 'react';
import { Plus, X } from 'lucide-react';
import Select from 'react-select';

export default function FormCustomerPage({
  isModalOpen,
  setIsModalOpen,
  isEditing,
  formData,
  handleInputChange,
  handleAddSite,
  handleSiteTextChange,
  handleRemoveSite,
  isSuperAdminOrAdmin,
  isManager,
  salesList,
  handleSelectChange,
  handleSubmit
}) {
  if (!isModalOpen) return null;

  const isReadOnlyForm = isEditing && !isSuperAdminOrAdmin;
  const canAssignSales = isSuperAdminOrAdmin || isManager;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-4 sm:p-6"
      style={{ alignItems: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
    >
      <div
        className="bg-white rounded-2xl w-full sm:max-w-lg shadow-xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(90dvh, 90vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">
            {isEditing ? '✏️ Edit Customer' : '➕ Tambah Customer'}
          </h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* No Akun & Nama Customer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">No. Akun</label>
                <input
                  type="text"
                  name="no_akun"
                  value={formData.no_akun}
                  onChange={handleInputChange}
                  disabled={isReadOnlyForm}
                  placeholder="Contoh: 1001"
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnlyForm ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nama Customer</label>
                <input
                  type="text"
                  name="nama_customer"
                  value={formData.nama_customer}
                  onChange={handleInputChange}
                  disabled={isReadOnlyForm}
                  placeholder="Nama perusahaan"
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnlyForm ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                />
              </div>
            </div>

            {/* Site / Kota */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Site / Kota</label>
                {!isReadOnlyForm && (
                  <button
                    type="button"
                    onClick={handleAddSite}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Tambah Site
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {formData.site_kota.map((site, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={site}
                      onChange={(e) => handleSiteTextChange(idx, e.target.value)}
                      disabled={isReadOnlyForm}
                      placeholder={`Site ${idx + 1}`}
                      className={`flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnlyForm ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {formData.site_kota.length > 1 && !isReadOnlyForm && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSite(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Note
              </label>
              <select
                name="note"
                value={formData.note || ''}
                onChange={handleInputChange}
                disabled={isReadOnlyForm}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isReadOnlyForm ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              >
                <option value="">-- Pilih Note (Opsional) --</option>
                <option value="Register">Register</option>
                <option value="Not Register">Not Register</option>
                {formData.note && formData.note !== 'Register' && formData.note !== 'Not Register' && (
                  <option value={formData.note}>{formData.note}</option>
                )}
              </select>
            </div>

            {/* Assign Sales */}
            {canAssignSales && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Assign ke Sales</label>
                <Select
                  isMulti
                  name="sales"
                  options={salesList.map(sales => ({
                    value: sales.id,
                    label: `${sales.name} (${sales.nama_jabatan})`
                  }))}
                  className="basic-multi-select text-sm"
                  classNamePrefix="select"
                  placeholder="Cari dan pilih sales..."
                  menuPosition="fixed"
                  menuShouldScrollIntoView={false}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    menu: base => ({ ...base, zIndex: 9999 }),
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
                      '&:hover': { borderColor: '#3b82f6' },
                      borderRadius: '0.5rem',
                      fontSize: '14px',
                    }),
                    multiValue: base => ({ ...base, backgroundColor: '#eff6ff', borderRadius: '6px' }),
                    multiValueLabel: base => ({ ...base, color: '#1d4ed8', fontWeight: 600 }),
                  }}
                  menuPortalTarget={document.body}
                  value={salesList
                    .filter(sales => formData.sales_ids.includes(sales.id))
                    .map(sales => ({
                      value: sales.id,
                      label: `${sales.name} (${sales.nama_jabatan})`
                    }))}
                  onChange={handleSelectChange}
                />
                <p className="text-xs text-gray-400 mt-1">Pilih lebih dari satu sales jika perlu (Tandem).</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/80 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="customerForm"
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
          >
            {isEditing ? 'Simpan Perubahan' : 'Tambah Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
