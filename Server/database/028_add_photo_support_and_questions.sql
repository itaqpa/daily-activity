-- File: 028_add_photo_support_and_questions.sql
-- Tujuan: Menambahkan dukungan input_type 'photo' dan 'file' serta mendaftarkan pertanyaan Foto Dokumentasi untuk ALL produk

BEGIN;

-- Izinkan override admin jika trigger assert_draft_template aktif
SELECT set_config('survey_engine.allow_admin_override', 'on', true);

-- Update check constraint questions
ALTER TABLE survey_engine.questions 
DROP CONSTRAINT IF EXISTS questions_default_input_type_check;

ALTER TABLE survey_engine.questions 
ADD CONSTRAINT questions_default_input_type_check 
CHECK (default_input_type IN ('text','textarea','number','date','boolean','select','radio','multi_select','checklist','photo','file'));

-- Update check constraint template_questions
ALTER TABLE survey_engine.template_questions 
DROP CONSTRAINT IF EXISTS template_questions_input_type_check;

ALTER TABLE survey_engine.template_questions 
ADD CONSTRAINT template_questions_input_type_check 
CHECK (input_type IN ('text','textarea','number','date','boolean','select','radio','multi_select','checklist','photo','file'));

-- Pastikan section 'Foto' dan pertanyaan terdaftar untuk semua produk
DO $$
DECLARE
  v_version_id bigint;
  v_question_id bigint;
  v_section_id bigint;
  v_template_q_id bigint;
  r_tp record;
BEGIN
  SELECT v.id INTO v_version_id
  FROM survey_engine.survey_template_versions v
  JOIN survey_engine.survey_templates st ON st.id = v.template_id
  WHERE st.code = 'GTE_PRODUCT_SURVEY' AND v.status = 'published'
  LIMIT 1;

  IF v_version_id IS NOT NULL THEN
    INSERT INTO survey_engine.sections (code, name, is_active)
    VALUES ('gte.common.foto', 'Foto', true)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_section_id;

    INSERT INTO survey_engine.questions (code, default_label, default_input_type, is_active)
    VALUES ('common.foto.dokumentasi', 'Foto Dokumentasi Lapangan', 'photo', true)
    ON CONFLICT (code) DO UPDATE SET default_label = EXCLUDED.default_label, default_input_type = 'photo'
    RETURNING id INTO v_question_id;

    INSERT INTO survey_engine.template_questions (
      version_id, question_id, section_id,
      section_code_snapshot, section_label_snapshot,
      question_no, question_key, label_snapshot,
      input_type, is_required, is_visible_default,
      helper_instruction, sort_order, is_active, visibility_rule
    ) VALUES (
      v_version_id, v_question_id, v_section_id,
      'foto', 'Foto',
      'FOTO-01', 'common.foto.dokumentasi', 'Foto Dokumentasi Lapangan',
      'photo', false, true,
      'Ambil foto atau pilih dari galeri. Sertakan meteran atau penggaris di dalam foto sebagai pembanding ukuran.',
      999, true, '{}'::jsonb
    )
    ON CONFLICT (version_id, question_key) DO UPDATE
    SET input_type = 'photo', section_code_snapshot = 'foto', section_label_snapshot = 'Foto'
    RETURNING id INTO v_template_q_id;

    FOR r_tp IN 
      SELECT tp.id 
      FROM survey_engine.template_products tp 
      WHERE tp.version_id = v_version_id
    LOOP
      INSERT INTO survey_engine.template_product_questions (
        template_product_id, template_question_id, is_active
      ) VALUES (
        r_tp.id, v_template_q_id, true
      )
      ON CONFLICT (template_product_id, template_question_id)
      DO UPDATE SET is_active = true, deleted_at = NULL;
    END LOOP;
  END IF;
END $$;

COMMIT;
