-- Migration: 029_add_divisi_id_to_jabatan_permissions.sql
-- Tujuan: Menambahkan kolom divisi_id ke jabatan_permissions agar pengaturan hak akses jabatan terikat pada divisi tertentu

-- 1. Tambah kolom divisi_id jika belum ada
ALTER TABLE jabatan_permissions 
ADD COLUMN IF NOT EXISTS divisi_id INTEGER REFERENCES divisis(id) ON DELETE CASCADE;

-- 2. Untuk data existing di jabatan_permissions yang divisi_id-nya masih NULL:
-- Hubungkan data sales lama ke Divisi Sales agar settingan Sales tidak hilang
UPDATE jabatan_permissions
SET divisi_id = (SELECT id FROM divisis WHERE kode_divisi = 'SLS' LIMIT 1)
WHERE divisi_id IS NULL 
  AND jabatan_id != COALESCE((SELECT id FROM jabatans WHERE nama_jabatan = 'Super Admin' LIMIT 1), 0);

-- 3. Hapus primary key lama (jabatan_id, permission_id) jika masih ada
ALTER TABLE jabatan_permissions DROP CONSTRAINT IF EXISTS jabatan_permissions_pkey;

-- 4. Buat unique index untuk (COALESCE(divisi_id, 0), jabatan_id, permission_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_jabatan_permissions_divisi_jabatan_perm 
ON jabatan_permissions (COALESCE(divisi_id, 0), jabatan_id, permission_id);
