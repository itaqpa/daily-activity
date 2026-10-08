-- Migration 009: Survey Product Persiapan Master & Trx

-- Master Table for Persiapan (Checklist & Dokumen)
CREATE TABLE IF NOT EXISTS master_survey_persiapan (
  id SERIAL PRIMARY KEY,
  jenis VARCHAR(100) NOT NULL, -- e.g. 'Checklist Persiapan' or 'Dokumen & Izin'
  label VARCHAR(255) NOT NULL,
  ket_tambahan VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Table for Persiapan per Survey
CREATE TABLE IF NOT EXISTS survey_product_persiapan (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL,
  master_persiapan_id INT NOT NULL,
  digunakan BOOLEAN DEFAULT false,
  qty INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES survey_product_data(id) ON DELETE CASCADE,
  FOREIGN KEY (master_persiapan_id) REFERENCES master_survey_persiapan(id) ON DELETE CASCADE
);

-- Seeder for master_survey_persiapan
-- Clear existing data if necessary (optional, assuming fresh start)
TRUNCATE master_survey_persiapan RESTART IDENTITY CASCADE;

INSERT INTO master_survey_persiapan (jenis, label, ket_tambahan) VALUES
-- Checklist Persiapan
('Checklist Persiapan', 'Meteran baja 5–8 m', 'Alat ukur umum'),
('Checklist Persiapan', 'Jangka sorong 150 & 300 mm', 'Alat ukur umum'),
('Checklist Persiapan', 'Pi tape / circumference tape', 'Alat ukur umum'),
('Checklist Persiapan', 'Penggaris baja 30 cm & 1 m', 'Alat ukur umum'),
('Checklist Persiapan', 'Laser distance meter', 'Alat ukur umum'),
('Checklist Persiapan', 'Magnet (cek CS / SS)', 'Identifikasi material & kondisi'),
('Checklist Persiapan', 'Thermo gun (IR)', 'Identifikasi material & kondisi'),
('Checklist Persiapan', 'HP terisi penuh + powerbank', 'Dokumentasi'),
('Checklist Persiapan', 'Senter', 'Dokumentasi'),
('Checklist Persiapan', 'Spidol / kapur marker', 'Dokumentasi'),
('Checklist Persiapan', 'Clipboard & alat tulis', 'Dokumentasi'),
('Checklist Persiapan', 'Helm safety', 'K3 / APD'),
('Checklist Persiapan', 'Safety shoes', 'K3 / APD'),
('Checklist Persiapan', 'Sarung tangan', 'K3 / APD'),
('Checklist Persiapan', 'Kacamata safety', 'K3 / APD'),
('Checklist Persiapan', 'Earplug', 'K3 / APD'),
('Checklist Persiapan', 'Full body harness (jika di ketinggian)', 'K3 / APD'),
('Checklist Persiapan', 'Gas detector (jika confined space)', 'K3 / APD'),

-- Dokumen & Izin
('Dokumen & Izin', 'Work permit / izin masuk area', 'Izin'),
('Dokumen & Izin', 'Safety induction plant', 'Izin'),
('Dokumen & Izin', 'Janji temu dengan PIC client', 'Koordinasi'),
('Dokumen & Izin', 'Surat tugas', 'Dokumen'),
('Dokumen & Izin', 'Data proses (tekanan, temperatur, media)', 'Data teknis'),
('Dokumen & Izin', 'Info jadwal shutdown', 'Data teknis'),
('Dokumen & Izin', 'Datasheet / drawing existing', 'Dokumen teknis'),
('Dokumen & Izin', 'Line list / flange list', 'Dokumen produk'),
('Dokumen & Izin', 'Datasheet heat exchanger / vessel', 'Dokumen produk'),
('Dokumen & Izin', 'Datasheet pompa / valve', 'Dokumen produk');
