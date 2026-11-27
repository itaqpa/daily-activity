-- File: 032_fix_exjf_shape_visibility.sql
-- Tujuan: Memberikan syarat pemicu (visibility_rule) secara serentak untuk seluruh pertanyaan di section EXJF.KOTAK dan EXJF.BULAT

BEGIN;

SELECT set_config('survey_engine.allow_admin_override', 'on', true);

-- Update seluruh pertanyaan di section EXJF.KOTAK agar hanya muncul jika bentuk === 'KOTAK'
UPDATE survey_engine.template_questions
SET visibility_rule = '{
  "value": "KOTAK",
  "operator": "eq",
  "depends_on": "bentuk",
  "source_expression": {
    "field_js": "f => f.bentuk === ''KOTAK''",
    "section_js": "f => f.bentuk === ''KOTAK''"
  }
}'::jsonb
WHERE section_code_snapshot = 'sec_exjf_kotak';

-- Update seluruh pertanyaan di section EXJF.BULAT agar hanya muncul jika bentuk === 'BULAT'
UPDATE survey_engine.template_questions
SET visibility_rule = '{
  "value": "BULAT",
  "operator": "eq",
  "depends_on": "bentuk",
  "source_expression": {
    "field_js": "f => f.bentuk === ''BULAT''",
    "section_js": "f => f.bentuk === ''BULAT''"
  }
}'::jsonb
WHERE section_code_snapshot = 'sec_exjf_bulat';

COMMIT;
