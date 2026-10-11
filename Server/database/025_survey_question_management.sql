-- File: 025_survey_question_management.sql
-- Tujuan: Menambahkan dukungan pengelolaan dinamis Survey Questions untuk Master Admin
-- Serta mendaftarkan hak akses (permissions) untuk Super Admin

BEGIN;

-- 1. Tambah kolom is_active dan deleted_at pada tabel template pertanyaan jika belum ada
ALTER TABLE survey_engine.template_questions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE survey_engine.template_questions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE survey_engine.template_product_questions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE survey_engine.template_product_questions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Modifikasi fungsi assert_draft_template agar mengizinkan penyesuaian runtime oleh admin
CREATE OR REPLACE FUNCTION survey_engine.assert_draft_template() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE version_id_value bigint; state survey_engine.template_status;
BEGIN
 -- Izinkan jika sesi menandai override admin
 IF current_setting('survey_engine.allow_admin_override', true) = 'on' THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;

 -- Izinkan update operasional kolom aktif/required/sort/label tanpa merusak histori
 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'template_questions' THEN
  IF (OLD.version_id = NEW.version_id AND OLD.id = NEW.id) THEN
   RETURN NEW;
  END IF;
 END IF;

 IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'template_product_questions' THEN
  IF (OLD.id = NEW.id AND OLD.template_product_id = NEW.template_product_id AND OLD.template_question_id = NEW.template_question_id) THEN
   RETURN NEW;
  END IF;
 END IF;

 CASE TG_TABLE_NAME
 WHEN 'template_products','template_questions' THEN
  version_id_value := CASE WHEN TG_OP='DELETE' THEN OLD.version_id ELSE NEW.version_id END;
 WHEN 'template_product_questions','template_product_parameters','template_report_fields' THEN
  SELECT version_id INTO version_id_value FROM survey_engine.template_products WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.template_product_id ELSE NEW.template_product_id END;
 WHEN 'template_question_options','template_checklist_items' THEN
  SELECT version_id INTO version_id_value FROM survey_engine.template_questions WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.template_question_id ELSE NEW.template_question_id END;
 WHEN 'template_parameter_mappings' THEN
  SELECT tp.version_id INTO version_id_value FROM survey_engine.template_product_questions pq JOIN survey_engine.template_products tp ON tp.id=pq.template_product_id
  WHERE pq.id=CASE WHEN TG_OP='DELETE' THEN OLD.template_product_question_id ELSE NEW.template_product_question_id END;
 END CASE;

 SELECT status INTO state FROM survey_engine.survey_template_versions WHERE id=version_id_value FOR UPDATE;
 IF state IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'Published/retired template is immutable'; END IF;

 IF TG_OP='UPDATE' THEN
  CASE TG_TABLE_NAME
  WHEN 'template_products','template_questions' THEN version_id_value := OLD.version_id;
  WHEN 'template_product_questions','template_product_parameters','template_report_fields' THEN
   SELECT version_id INTO version_id_value FROM survey_engine.template_products WHERE id=OLD.template_product_id;
  WHEN 'template_question_options','template_checklist_items' THEN
   SELECT version_id INTO version_id_value FROM survey_engine.template_questions WHERE id=OLD.template_question_id;
  WHEN 'template_parameter_mappings' THEN
   SELECT tp.version_id INTO version_id_value FROM survey_engine.template_product_questions pq JOIN survey_engine.template_products tp ON tp.id=pq.template_product_id
   WHERE pq.id=OLD.template_product_question_id;
  END CASE;
  SELECT status INTO state FROM survey_engine.survey_template_versions WHERE id=version_id_value FOR UPDATE;
  IF state IS DISTINCT FROM 'draft' THEN RAISE EXCEPTION 'Cannot move or change a published/retired template record'; END IF;
 END IF;

 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;

-- 3. Master Permissions untuk Modul Survey Question
INSERT INTO permissions (nama_permission, deskripsi) VALUES
('survey_question_view', 'Melihat Master Survey Question'),
('survey_question_create', 'Menambah Master Survey Question'),
('survey_question_edit', 'Mengubah Master Survey Question'),
('survey_question_delete', 'Menghapus Master Survey Question')
ON CONFLICT (nama_permission) DO NOTHING;

-- 4. Berikan Hak Akses ke Jabatan Super Admin
INSERT INTO jabatan_permissions (jabatan_id, permission_id)
SELECT j.id, p.id
FROM permissions p
CROSS JOIN jabatans j
WHERE p.nama_permission IN ('survey_question_view', 'survey_question_create', 'survey_question_edit', 'survey_question_delete')
  AND (LOWER(j.nama_jabatan) = 'super admin' OR LOWER(j.nama_jabatan) LIKE '%super admin%')
ON CONFLICT DO NOTHING;

-- 5. Berikan Hak Akses langsung ke user_permissions untuk user yang bertindak sebagai Super Admin
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM permissions p
CROSS JOIN users u
LEFT JOIN jabatans j ON u.jabatan_id = j.id
WHERE p.nama_permission IN ('survey_question_view', 'survey_question_create', 'survey_question_edit', 'survey_question_delete')
  AND (
    LOWER(COALESCE(u.role, '')) IN ('superadmin', 'super admin', 'super-admin')
    OR LOWER(COALESCE(j.nama_jabatan, '')) = 'super admin'
  )
ON CONFLICT DO NOTHING;

COMMIT;
