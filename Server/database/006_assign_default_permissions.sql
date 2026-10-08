-- File: 006_assign_default_permissions.sql
-- Tujuan: Memberikan hak akses dasar ke Divisi (View) dan hak CRUD ke Jabatan

-- ==========================================
-- 1. HAK AKSES DIVISI (KUNCI PINTU MASUK)
-- ==========================================
-- Hapus settingan divisi lama jika ada
DELETE FROM divisi_permissions;

-- Divisi 1: Sales
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT 1, id FROM permissions WHERE nama_permission IN (
    'dashboard_view', 'sales_view', 'customer_view', 'aktivitas_view', 'riwayat_aktivitas_view', 'history_view', 'laporan_marketing_view'
);

-- Divisi 4: Management
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT 4, id FROM permissions WHERE nama_permission IN (
    'dashboard_view', 'laporan_marketing_view', 'laporan_marketing_view_team', 'laporan_marketing_view_all', 'laporan_project_view', 'history_view', 'pengeluaran_view'
);

-- Divisi 9: Engineering
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT 9, id FROM permissions WHERE nama_permission IN (
    'install_project_view', 'daily_progress_view'
);

-- ==========================================
-- 2. HAK AKSES JABATAN (LEVEL WEWENANG / CRUD)
-- ==========================================
-- Hapus settingan jabatan lama jika ada
DELETE FROM jabatan_permissions;

-- Jabatan 1: Super Admin (ALL ACCESS - GOD MODE)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 1, id FROM permissions;

-- Jabatan 27: Admin (ALL ACCESS)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 27, id FROM permissions;

-- Jabatan 5: Sales Staff
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 5, id FROM permissions WHERE nama_permission IN (
    'dashboard_view', 
    'customer_view', 'customer_create',
    'aktivitas_view', 'aktivitas_create',
    'riwayat_aktivitas_view', 'history_view',
    'laporan_marketing_view'
);

-- Jabatan 4: Leader
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 4, id FROM permissions WHERE nama_permission IN (
    'dashboard_view', 
    'customer_view', 'customer_create', 'customer_edit', 'customer_approve',
    'aktivitas_view', 'aktivitas_create',
    'riwayat_aktivitas_view', 'history_view',
    'laporan_marketing_view', 'laporan_marketing_view_team'
);

-- Jabatan 3: Spv (Sales SPV)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 3, id FROM permissions WHERE nama_permission IN (
    'dashboard_view',
    'customer_view', 'customer_create', 'customer_edit', 'customer_delete', 'customer_export', 'customer_import', 'customer_approve',
    'sales_view', 'sales_create', 'sales_edit', 'sales_delete', 'sales_export', 'sales_import',
    'aktivitas_view', 'aktivitas_create', 'aktivitas_edit', 'aktivitas_delete',
    'riwayat_aktivitas_view', 'history_view', 'riwayat_aktivitas_export',
    'laporan_marketing_view', 'laporan_marketing_view_team', 'laporan_marketing_export'
);

-- Jabatan 2: Manager (Sales Manager)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 2, id FROM permissions WHERE nama_permission IN (
    'dashboard_view',
    'customer_view', 'customer_create', 'customer_edit', 'customer_delete', 'customer_export', 'customer_import', 'customer_approve',
    'sales_view', 'sales_create', 'sales_edit', 'sales_delete', 'sales_export', 'sales_import',
    'aktivitas_view', 'aktivitas_create', 'aktivitas_edit', 'aktivitas_delete',
    'riwayat_aktivitas_view', 'history_view', 'riwayat_aktivitas_export',
    'laporan_marketing_view', 'laporan_marketing_view_team', 'laporan_marketing_view_all', 'laporan_marketing_export'
);
