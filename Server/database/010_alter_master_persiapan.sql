-- Migration 010: Add is_default to master_survey_persiapan

ALTER TABLE master_survey_persiapan ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;
