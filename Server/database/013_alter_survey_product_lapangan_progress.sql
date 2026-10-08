-- Migration 013: Add stored dynamic form metadata for Survey Product Lapangan

ALTER TABLE survey_product_progress
  ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hari_ke INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS display_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lokasi VARCHAR(255);
