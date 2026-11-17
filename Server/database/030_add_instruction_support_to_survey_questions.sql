-- File: 030_add_instruction_support_to_survey_questions.sql
-- Tujuan: Menambahkan dukungan Foto/Diagram Instruksi dan Catatan Khusus Instruksi pada Survey Questions

BEGIN;

-- Izinkan override admin jika trigger assert_draft_template aktif
SELECT set_config('survey_engine.allow_admin_override', 'on', true);

-- 1. Tambah kolom instruction_image_url dan instruction_note ke template_questions
ALTER TABLE survey_engine.template_questions
ADD COLUMN IF NOT EXISTS instruction_image_url TEXT,
ADD COLUMN IF NOT EXISTS instruction_note TEXT;

-- 2. Tambah kolom ke questions catalog
ALTER TABLE survey_engine.questions
ADD COLUMN IF NOT EXISTS instruction_image_url TEXT,
ADD COLUMN IF NOT EXISTS instruction_note TEXT;

COMMIT;
