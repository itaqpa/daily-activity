-- Migration 018: Alter survey_product_data status constraint

ALTER TABLE survey_product_data DROP CONSTRAINT IF EXISTS survey_product_data_status_check;

ALTER TABLE survey_product_data 
  ADD CONSTRAINT survey_product_data_status_check 
  CHECK (status IN ('Draft', 'Open', 'On Progress', 'Persiapan', 'Lapangan', 'Selesai', 'Batal'));
