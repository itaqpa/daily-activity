-- Migration 008: Create Survey Product Tables

-- Optional: Tabel Master Data Surveyor (jika belum ada)
CREATE TABLE IF NOT EXISTS master_surveyor (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kontak VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Section 1: Data Survey (Tabel Utama)
CREATE TABLE IF NOT EXISTS survey_product_data (
  id SERIAL PRIMARY KEY,
  no_survey VARCHAR(50) NOT NULL UNIQUE,
  client_id INT,
  nama_client VARCHAR(255),
  plant_area VARCHAR(255),
  alamat_lokasi TEXT,
  tanggal_mulai DATE,
  surveyor_id INT,
  nama_surveyor VARCHAR(255),
  leader_surveyor_id INT,
  leader_surveyor_name VARCHAR(255),
  leader_surveyor JSONB DEFAULT '[]'::jsonb,
  anggota_surveyor JSONB DEFAULT '[]'::jsonb,
  marketing_id INT,
  nama_marketing VARCHAR(255),
  pic_client VARCHAR(255),
  kontak_pic VARCHAR(100),
  no_inquiry VARCHAR(100),
  tujuan_survey TEXT,
  status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Open', 'On Progress', 'Persiapan', 'Lapangan', 'Completed', 'Selesai', 'Closed', 'Batal')),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (surveyor_id) REFERENCES master_surveyor(id) ON DELETE SET NULL
);

-- Section 2: Produk yang direncanakan untuk disurvey
CREATE TABLE IF NOT EXISTS survey_product_planned_items (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  jumlah INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES survey_product_data(id) ON DELETE CASCADE
);

-- Section 3: Rencana Jadwal Survey
CREATE TABLE IF NOT EXISTS survey_product_schedules (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL,
  hari VARCHAR(50),
  tanggal DATE,
  rencana_area VARCHAR(255),
  target_item INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES survey_product_data(id) ON DELETE CASCADE
);
