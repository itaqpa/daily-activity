-- Migration 015: Support multiple Survey Product leaders

ALTER TABLE survey_product_data
  ADD COLUMN IF NOT EXISTS leader_surveyor JSONB DEFAULT '[]'::jsonb;
