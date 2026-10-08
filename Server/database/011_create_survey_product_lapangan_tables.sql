-- Migration 011: Create Survey Product Lapangan Tables

-- Section 1: Pelaksanaan Aktual
CREATE TABLE IF NOT EXISTS survey_product_actual_schedules (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL,
  hari_ke INT,
  tanggal DATE,
  kegiatan VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES survey_product_data(id) ON DELETE CASCADE
);

-- Section 2: Progress Survey Produk
CREATE TABLE IF NOT EXISTS survey_product_progress (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL,
  product_name VARCHAR(255),
  product_code VARCHAR(50),
  percent INT DEFAULT 0,
  form_data JSONB DEFAULT '{}'::jsonb,
  hari_ke INT DEFAULT 1,
  display_id VARCHAR(100),
  lokasi VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES survey_product_data(id) ON DELETE CASCADE
);

ALTER TABLE survey_product_progress
  ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hari_ke INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS display_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lokasi VARCHAR(255);
