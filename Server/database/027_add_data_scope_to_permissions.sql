-- File: 027_add_data_scope_to_permissions.sql
-- Tujuan: Menambahkan kolom data_scope ('ALL', 'DIVISION', 'OWN') ke jabatan_permissions dan user_permissions,
-- serta memastikan master permissions untuk survey_question terdaftar lengkap dengan scope default.

BEGIN;

-- 1. Tambah kolom data_scope ke jabatan_permissions
ALTER TABLE jabatan_permissions 
ADD COLUMN IF NOT EXISTS data_scope VARCHAR(20) NOT NULL DEFAULT 'ALL';

-- Beri constraint validasi enum value jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_jabatan_permissions_data_scope'
  ) THEN
    ALTER TABLE jabatan_permissions
    ADD CONSTRAINT chk_jabatan_permissions_data_scope
    CHECK (data_scope IN ('ALL', 'DIVISION', 'OWN'));
  END IF;
END $$;

-- 2. Tambah kolom data_scope ke user_permissions
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS data_scope VARCHAR(20) NOT NULL DEFAULT 'ALL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_permissions_data_scope'
  ) THEN
    ALTER TABLE user_permissions
    ADD CONSTRAINT chk_user_permissions_data_scope
    CHECK (data_scope IN ('ALL', 'DIVISION', 'OWN'));
  END IF;
END $$;

-- 3. Pastikan Master Permissions untuk survey_question terdaftar
INSERT INTO permissions (nama_permission, deskripsi) VALUES
('survey_question_view', 'Melihat Master Survey Question'),
('survey_question_create', 'Menambah Master Survey Question'),
('survey_question_edit', 'Mengubah Master Survey Question'),
('survey_question_delete', 'Menghapus Master Survey Question')
ON CONFLICT (nama_permission) DO NOTHING;

-- 4. Berikan Hak Akses ke Jabatan Super Admin jika belum ada
INSERT INTO jabatan_permissions (jabatan_id, permission_id, data_scope)
SELECT j.id, p.id, 'ALL'
FROM permissions p
CROSS JOIN jabatans j
WHERE p.nama_permission IN ('survey_question_view', 'survey_question_create', 'survey_question_edit', 'survey_question_delete')
  AND (LOWER(j.nama_jabatan) = 'super admin' OR LOWER(j.nama_jabatan) LIKE '%super admin%')
ON CONFLICT (jabatan_id, permission_id) DO UPDATE SET data_scope = 'ALL';

-- 5. Berikan Hak Akses ke user_permissions untuk user Super Admin
INSERT INTO user_permissions (user_id, permission_id, data_scope)
SELECT u.id, p.id, 'ALL'
FROM permissions p
CROSS JOIN users u
LEFT JOIN jabatans j ON u.jabatan_id = j.id
WHERE p.nama_permission IN ('survey_question_view', 'survey_question_create', 'survey_question_edit', 'survey_question_delete')
  AND (
    LOWER(COALESCE(u.role, '')) IN ('superadmin', 'super admin', 'super-admin')
    OR LOWER(COALESCE(j.nama_jabatan, '')) = 'super admin'
  )
ON CONFLICT (user_id, permission_id) DO UPDATE SET data_scope = 'ALL';

COMMIT;
