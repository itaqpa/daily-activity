-- File: 006_assign_default_permissions.sql
-- Tujuan: Memberikan hak akses dasar ke Divisi (View) dan hak CRUD ke Jabatan

-- ==========================================
-- 1. HAK AKSES DIVISI (KUNCI PINTU MASUK)
-- ==========================================

-- Pastikan tabel divisi_permissions ada (jika 001_hak-akses.sql sudah terlewat di database existing)
CREATE TABLE IF NOT EXISTS divisi_permissions (
    divisi_id INTEGER REFERENCES divisis(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (divisi_id, permission_id)
);

-- Hapus settingan divisi lama jika ada
DELETE FROM divisi_permissions;

-- Divisi: Sales
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT d.id, p.id FROM permissions p
JOIN divisis d ON d.nama_divisi = 'Sales'
WHERE p.nama_permission IN (
    'dashboard_view', 'sales_view', 'customer_view', 'aktivitas_view', 'riwayat_aktivitas_view', 'history_view', 'laporan_marketing_view'
);

-- Divisi: Management
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT d.id, p.id FROM permissions p
JOIN divisis d ON d.nama_divisi = 'Management'
WHERE p.nama_permission IN (
    'dashboard_view', 'laporan_marketing_view', 'laporan_marketing_view_team', 'laporan_marketing_view_all', 'laporan_project_view', 'history_view', 'pengeluaran_view', 'install_project_view', 'install_project_progress'
);

-- Divisi: Engineering
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT d.id, p.id FROM permissions p
JOIN divisis d ON d.nama_divisi = 'Engineering'
WHERE p.nama_permission IN (
    'install_project_view', 'install_project_progress', 'daily_progress_view', 'pengeluaran_view'
);

-- ==========================================
-- 2. HAK AKSES JABATAN (LEVEL WEWENANG / CRUD)
-- ==========================================
-- Hapus settingan jabatan lama jika ada
DELETE FROM jabatan_permissions;

-- Jabatan: Super Admin (ALL ACCESS - GOD MODE)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id FROM permissions p
JOIN jabatans j ON j.nama_jabatan = 'Super Admin';

-- Jabatan: Admin (ALL ACCESS)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id FROM permissions p
JOIN jabatans j ON j.nama_jabatan = 'Admin';

-- Jabatan: Staff (Sales Staff)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id FROM permissions p
JOIN jabatans j ON j.nama_jabatan = 'Staff'
WHERE p.nama_permission IN (
    'dashboard_view', 
    'customer_view', 'customer_create',
    'aktivitas_view', 'aktivitas_create',
    'riwayat_aktivitas_view', 'history_view',
    'laporan_marketing_view'
);

-- Jabatan: Leader
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id FROM permissions p
JOIN jabatans j ON j.nama_jabatan = 'Leader'
WHERE p.nama_permission IN (
    'dashboard_view', 
    'customer_view', 'customer_create', 'customer_edit', 'customer_approve',
    'aktivitas_view', 'aktivitas_create',
    'riwayat_aktivitas_view', 'history_view',
    'laporan_marketing_view', 'laporan_marketing_view_team',
    'pengeluaran_view', 'pengeluaran_create', 'pengeluaran_edit', 'pengeluaran_delete', 'pengeluaran_export'
);

-- Jabatan: Spv (Sales SPV)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id FROM permissions p
JOIN jabatans j ON j.nama_jabatan = 'Spv'
WHERE p.nama_permission IN (
    'dashboard_view',
    'customer_view', 'customer_create', 'customer_edit', 'customer_delete', 'customer_export', 'customer_import', 'customer_approve',
    'sales_view', 'sales_create', 'sales_edit', 'sales_delete', 'sales_export', 'sales_import',
    'aktivitas_view', 'aktivitas_create', 'aktivitas_edit', 'aktivitas_delete',
    'riwayat_aktivitas_view', 'history_view', 'riwayat_aktivitas_export',
    'laporan_marketing_view', 'laporan_marketing_view_team', 'laporan_marketing_export'
);

-- Jabatan: Manager (Sales Manager)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id FROM permissions p
JOIN jabatans j ON j.nama_jabatan = 'Manager'
WHERE p.nama_permission IN (
    'dashboard_view',
    'customer_view', 'customer_create', 'customer_edit', 'customer_delete', 'customer_export', 'customer_import', 'customer_approve',
    'sales_view', 'sales_create', 'sales_edit', 'sales_delete', 'sales_export', 'sales_import',
    'aktivitas_view', 'aktivitas_create', 'aktivitas_edit', 'aktivitas_delete',
    'riwayat_aktivitas_view', 'history_view', 'riwayat_aktivitas_export',
    'laporan_marketing_view', 'laporan_marketing_view_team', 'laporan_marketing_view_all', 'laporan_marketing_export'
);
