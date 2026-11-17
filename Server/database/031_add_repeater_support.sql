-- File: 031_add_repeater_support.sql
-- Tujuan: Menambahkan tipe 'multi_input' ke CHECK constraint questions & template_questions

BEGIN;

-- Izinkan override admin jika trigger assert_draft_template aktif
SELECT set_config('survey_engine.allow_admin_override', 'on', true);

-- Update check constraint questions
ALTER TABLE survey_engine.questions 
DROP CONSTRAINT IF EXISTS questions_default_input_type_check;

ALTER TABLE survey_engine.questions 
ADD CONSTRAINT questions_default_input_type_check 
CHECK (default_input_type IN ('text','textarea','number','date','boolean','select','radio','multi_select','checklist','photo','file','multi_input'));

-- Update check constraint template_questions
ALTER TABLE survey_engine.template_questions 
DROP CONSTRAINT IF EXISTS template_questions_input_type_check;

ALTER TABLE survey_engine.template_questions 
ADD CONSTRAINT template_questions_input_type_check 
CHECK (input_type IN ('text','textarea','number','date','boolean','select','radio','multi_select','checklist','photo','file','multi_input'));

COMMIT;
