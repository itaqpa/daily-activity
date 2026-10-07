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
    'dashboard_view', 'sales_view', 'customer_view', 'aktivitas_view'
);

-- Divisi 4: Management
INSERT INTO divisi_permissions (divisi_id, permission_id)
SELECT 4, id FROM permissions WHERE nama_permission IN (
    'dashboard_view', 'laporan_marketing_view', 'laporan_project_view', 'history_view', 'pengeluaran_view'
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

-- Jabatan 5: Staff (Hanya Create)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 5, id FROM permissions WHERE nama_permission LIKE '%_create';

-- Jabatan 4: Leader
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 4, id FROM permissions WHERE nama_permission LIKE '%_create' OR nama_permission LIKE '%_edit' OR nama_permission IN ('customer_approve', 'laporan_marketing_view_team');

-- Jabatan 3: Spv
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 3, id FROM permissions WHERE nama_permission LIKE '%_create' OR nama_permission LIKE '%_edit' OR nama_permission IN ('customer_approve', 'laporan_marketing_view_team');

-- Jabatan 2: Manager (Create, Edit, Delete, Export, Import)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 2, id FROM permissions WHERE nama_permission NOT LIKE '%_view' 
   AND nama_permission NOT LIKE 'user_%' 
   AND nama_permission NOT LIKE 'akses_%';

-- Jabatan 27: Admin (Create, Edit, Export, Import - no delete)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 27, id FROM permissions WHERE (nama_permission NOT LIKE '%_view' AND nama_permission NOT LIKE '%_delete')
   AND nama_permission NOT LIKE 'user_%' 
   AND nama_permission NOT LIKE 'akses_%';

-- Jabatan 1: Super Admin (ALL ACCESS - GOD MODE)
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT 1, id FROM permissions;
