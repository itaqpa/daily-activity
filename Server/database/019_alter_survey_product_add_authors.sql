-- Migration 019: Add created_by and filled_by columns to track who creates and fills forms

ALTER TABLE survey_product_data
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

ALTER TABLE survey_product_progress
  ADD COLUMN IF NOT EXISTS filled_by VARCHAR(255);
