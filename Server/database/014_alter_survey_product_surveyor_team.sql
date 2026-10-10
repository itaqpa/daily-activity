-- Migration 014: Store Survey Product leader and member surveyors

ALTER TABLE survey_product_data
  ADD COLUMN IF NOT EXISTS leader_surveyor_id INT,
  ADD COLUMN IF NOT EXISTS leader_surveyor_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS anggota_surveyor JSONB DEFAULT '[]'::jsonb;
