-- =========================================================================
-- SCHEMA DRAFT DATABASE LOGISTIK (driver_apps / daily-activity)
-- Disimpan di src/logistic/test/schema_logistic.sql
-- =========================================================================

-- Enable UUID extension jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 0. TABEL MASTER DATA KENDARAAN ARMADA (LOGISTIC VEHICLES)
-- -------------------------------------------------------------------------
-- Master inventaris kendaraan perusahaan (Motor, Mobil Box, Truk Engkel, dsb.)
CREATE TABLE IF NOT EXISTS logistic_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_number VARCHAR(50) NOT NULL UNIQUE,     -- No Aset (Cth: A/1/0001, A/2/0001)
    license_plate VARCHAR(30) NOT NULL UNIQUE,    -- No Polisi (Cth: B 5563 KIU)
    vehicle_name VARCHAR(150) NOT NULL,           -- Nama / Tipe Kendaraan (Cth: GRANDMAX HITAM, L300)
    vehicle_type VARCHAR(50) DEFAULT 'car' CHECK (vehicle_type IN ('motorcycle', 'car', 'pickup', 'truck', 'van')),
    
    -- Wilayah & Divisi
    location VARCHAR(100) NOT NULL DEFAULT 'Bekasi', -- Lokasi Base (Bekasi, Surabaya, dsb.)
    operational_division VARCHAR(100) NOT NULL,      -- Divisi Operasional (LOG AQPA, HRGA, LOG GTE, LOG AQPA SBY)
    
    -- Efisiensi & Biaya
    fuel_ratio_km_per_liter DECIMAL(8,2) NULL,       -- Rasio KM/LITER (Cth: 12 KM, 40 KM, 6.5 KM)
    daily_rate DECIMAL(12,2) DEFAULT 0,              -- Rate Kendaraan Per Hari (Rp)
    
    -- Status & Legalitas
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'standby', 'in_use', 'maintenance', 'inactive')),
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON logistic_vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON logistic_vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_operasional ON logistic_vehicles(operational_division);

-- Seed Data Master Kendaraan Sesuai Rekap Aset Perusahaan
INSERT INTO logistic_vehicles (asset_number, license_plate, vehicle_name, vehicle_type, location, operational_division, fuel_ratio_km_per_liter, daily_rate)
VALUES 
    ('A/1/0001', 'B 5563 KIU', 'VARIO 125 HITAM MERAH', 'motorcycle', 'Bekasi', 'LOG AQPA', 40.0, 100000),
    ('A/2/0001', 'B 2235 KYB', 'GRANDMAX HITAM', 'pickup', 'Bekasi', 'HRGA', 12.0, 250000),
    ('A/2/0002', 'B 9819 KRW', 'L300', 'pickup', 'Bekasi', 'LOG AQPA', 10.0, 250000),
    ('A/2/0007', 'B 2257 KIO', 'GRANDMAX PUTIH', 'pickup', 'Bekasi', 'LOG AQPA', 11.0, 250000),
    ('A/2/0008', 'B 9074 KIU', 'TRUCK KUNING ENGKEL', 'truck', 'Bekasi', 'LOG AQPA', 6.5, 250000),
    ('A/2/0009', 'B 9726 KCI', 'BLIND VAN', 'van', 'Bekasi', 'LOG AQPA', 12.0, 250000),
    ('A/2/0010', 'B 9976 KCI', 'BLIND VAN PUTIH', 'van', 'Bekasi', 'LOG AQPA', 12.0, 250000),
    ('G/12/0002', 'B 2213 KKU', 'WULING MERAH', 'car', 'Bekasi', 'HRGA', 10.0, 250000),
    ('G/2/0001', 'B 1442 KYI', 'GRANDMAX PUTIH', 'pickup', 'Bekasi', 'LOG GTE', 12.0, 250000),
    ('G/2/0003', 'B 9168 KAV', 'CARRY HITAM', 'pickup', 'Bekasi', 'LOG GTE', 12.0, 250000),
    ('G/2/0004', 'B 2415 KIG', 'GRANDMAX SILVER', 'pickup', 'Bekasi', 'HRGA', 12.0, 250000),
    ('A/1/0003', 'B 5359 KJB', 'VARIO 125 PUTIH', 'motorcycle', 'Surabaya', 'LOG AQPA SBY', 40.0, 100000),
    ('A/2/0003', 'B 9412 KUF', 'CARRY PUTIH', 'pickup', 'Surabaya', 'LOG AQPA SBY', 12.0, 250000),
    ('A/2/0005', 'B 2969 KYC', 'GRANDMAX SILVER', 'pickup', 'Surabaya', 'LOG AQPA SBY', 12.0, 250000)
ON CONFLICT (asset_number) DO UPDATE 
SET license_plate = EXCLUDED.license_plate,
    vehicle_name = EXCLUDED.vehicle_name,
    location = EXCLUDED.location,
    operational_division = EXCLUDED.operational_division,
    fuel_ratio_km_per_liter = EXCLUDED.fuel_ratio_km_per_liter,
    daily_rate = EXCLUDED.daily_rate;

-- -------------------------------------------------------------------------
-- 0B. TABEL MASTER DRIVER (LOGISTIC DRIVERS) & HUBUNGAN KE USER AKUN
-- -------------------------------------------------------------------------
-- Master profil pengemudi, relasi ke akun users (Divisi: Driver) untuk login Driver App
CREATE TABLE IF NOT EXISTS logistic_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_code VARCHAR(50) NOT NULL UNIQUE,     -- Cth: DRV-001, DRV-002
    name VARCHAR(150) NOT NULL,                  -- Nama Driver (Cth: ABDUL KARIM, ALDI YUSUF)
    role_type VARCHAR(50) NOT NULL DEFAULT 'DRIVER' CHECK (role_type IN ('DRIVER', 'OPSIONAL DRIVER', 'CO_DRIVER')),
    
    -- Akun Login Driver App (Terkoneksi ke Tabel users, Divisi: Driver)
    user_id INTEGER NULL,                        -- ID User di tabel users
    username VARCHAR(100) NULL,                  -- Username login driver
    division VARCHAR(50) NOT NULL DEFAULT 'Driver', -- Divisi user akun
    
    -- Kontak & Lisensi Mengemudi
    phone_number VARCHAR(50) NULL,
    license_type VARCHAR(50) DEFAULT 'SIM B1 Umum', -- SIM A, SIM B1, SIM B1 Umum, SIM B2 Umum, SIM C
    license_number VARCHAR(100) NULL,
    
    -- Status Driver
    status VARCHAR(30) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Cuti', 'Non-Aktif')),
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drivers_name ON logistic_drivers(name);
CREATE INDEX IF NOT EXISTS idx_drivers_user ON logistic_drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON logistic_drivers(status);

-- Seed Data Master Driver Sesuai Rekap Acuan
INSERT INTO logistic_drivers (driver_code, name, role_type, division, status)
VALUES 
    ('DRV-001', 'ABDUL KARIM', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-002', 'ALDI YUSUF', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-003', 'ARIE SANJAYA', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-004', 'HAMDANI NURHIDAYAT', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-005', 'WAHYU ADI', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-006', 'WAHYU PRASETYO', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-007', 'SISWO RIMBAWAN', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-008', 'SUTAR', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-009', 'BIVANT HARDI CHOARAHMAN', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-010', 'RONI IRAWAN', 'DRIVER', 'Driver', 'Aktif'),
    ('DRV-011', 'DEA FATHUROHMAN', 'OPSIONAL DRIVER', 'Driver', 'Aktif')
ON CONFLICT (driver_code) DO UPDATE 
SET name = EXCLUDED.name,
    role_type = EXCLUDED.role_type,
    division = EXCLUDED.division;

-- -------------------------------------------------------------------------
-- 1. TABEL MANIFEST LOGISTIK (Pengelompokan Banyak DO oleh SPV)
-- -------------------------------------------------------------------------
-- Manifest dibuat oleh SPV untuk mengelompokkan beberapa DO/Tugas (bulk assignment)
-- ke dalam 1 penugasan sopir, mobil armada, dan tanggal jalan.
CREATE TABLE IF NOT EXISTS logistic_manifests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manifest_number VARCHAR(100) NOT NULL UNIQUE, -- Contoh: MNF-20261017-001
    manifest_date DATE NOT NULL,                  -- Tanggal rencana jalan
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Tanggal SPV melakukan penugasan
    end_date DATE NULL,                           -- Sampai tanggal berapa jika rute luar kota (multi-day)
    
    -- Alokasi Driver & Armada (Penugasan oleh SPV)
    driver_id UUID NOT NULL,                      -- ID Sopir utama
    co_driver_id UUID NULL,                       -- ID Kernet / Pendamping (opsional)
    vehicle_id UUID NOT NULL,                     -- ID Mobil / Armada
    vehicle_plate VARCHAR(30) NULL,               -- Cache Plat Nomor
    
    -- Status Manifest
    status VARCHAR(30) NOT NULL DEFAULT 'assigned' CHECK (status IN ('draft', 'assigned', 'on_route', 'completed', 'cancelled')),
    is_out_of_city BOOLEAN DEFAULT FALSE,         -- Penanda jika rute luar kota
    total_tasks INTEGER DEFAULT 0,                -- Jumlah DO yang dikelompokkan
    
    -- Catatan & Admin Pembuat
    notes TEXT NULL,                              -- Catatan/Instruksi khusus dari SPV
    created_by UUID NULL,                         -- SPV yang membuat manifest
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistic_manifests_status ON logistic_manifests(status);
CREATE INDEX IF NOT EXISTS idx_logistic_manifests_driver ON logistic_manifests(driver_id);
CREATE INDEX IF NOT EXISTS idx_logistic_manifests_date ON logistic_manifests(manifest_date);

-- -------------------------------------------------------------------------
-- 2. TABEL UTAMA: logistic_tasks (Murni Tugas Penugasan per DO/PO/SO)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistic_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manifest_id UUID NULL REFERENCES logistic_manifests(id) ON DELETE SET NULL, -- Relasi ke Manifest SPV
    
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('delivery', 'pickup')),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'assigned', 'on_route', 'arrived', 'delivered', 'failed', 'cancelled')),
    
    -- Dokumen Referensi
    reference_number VARCHAR(100) NOT NULL,       -- No SO (Delivery) atau No PO (Pickup)
    do_easy VARCHAR(100) NULL,                   -- Surat Jalan DO Easy / Accurate
    
    -- ---------------------------------------------------------------------
    -- DETAIL LOKASI AWAL (Origin: Vendor / Pabrik / Gudang AQPA)
    -- ---------------------------------------------------------------------
    origin_name VARCHAR(255) NOT NULL,           -- Nama Gudang / Pabrik / Vendor Awal
    origin_pic_name VARCHAR(150) NULL,           -- Nama PIC di lokasi awal
    origin_pic_phone VARCHAR(50) NULL,           -- No Telp/HP PIC lokasi awal
    origin_address TEXT NOT NULL,                -- Alamat lengkap lokasi awal
    origin_latitude DECIMAL(10, 8) NULL,         -- Koordinat GPS lokasi awal
    origin_longitude DECIMAL(11, 8) NULL,
    
    -- ---------------------------------------------------------------------
    -- DETAIL LOKASI TUJUAN (Destination: Gudang Pelanggan / Pabrik Tujuan)
    -- ---------------------------------------------------------------------
    destination_name VARCHAR(255) NOT NULL,      -- Nama Customer / Pelanggan / Gudang Tujuan
    destination_pic_name VARCHAR(150) NULL,      -- Nama PIC di lokasi tujuan
    destination_pic_phone VARCHAR(50) NULL,      -- No Telp/HP PIC lokasi tujuan
    destination_address TEXT NOT NULL,           -- Alamat lengkap tujuan pengiriman/penjemputan
    destination_latitude DECIMAL(10, 8) NULL,    -- Koordinat GPS lokasi tujuan (buka Gmaps di mobile)
    destination_longitude DECIMAL(11, 8) NULL,
    
    -- Rangkuman Kuantitas Muatan
    total_items_count DECIMAL(12,2) DEFAULT 0,
    total_items_unit VARCHAR(50) DEFAULT 'Pcs',
    
    -- Status Luar Kota
    is_out_of_city BOOLEAN DEFAULT FALSE,        -- True jika tugas luar kota
    
    -- Relasi Penugasan Driver & Jadwal (Inherit dari Manifest atau Direct)
    driver_id UUID NULL,
    co_driver_id UUID NULL,
    vehicle_id UUID NULL,
    dispatch_date DATE NULL,                     -- Rencana tanggal berangkat
    assigned_at TIMESTAMP NULL,                  -- Waktu resmi plotting penugasan
    assigned_by UUID NULL,                       -- SPV / Admin yang menugaskan
    departure_notes TEXT NULL,                   -- Instruksi khusus saat penugasan
    
    -- Odometer & Waktu Eksekusi Driver di Lapangan (Kompatibel dengan Mobile Apps)
    completed_odometer INTEGER NULL,             -- KM Odometer saat selesai (nama disamakan dengan mobile apps)
    started_at TIMESTAMP NULL,                   -- Waktu driver mulai jalan menuju lokasi
    arrived_at TIMESTAMP NULL,                   -- Waktu driver tiba di lokasi
    completed_at TIMESTAMP NULL,                 -- Waktu serah terima barang selesai
    
    -- Cache Bukti / Alasan Cepat (Langsung terbaca di List Task tanpa join)
    proof_photo TEXT NULL,                       -- URL foto bukti serah terima (sama dengan mobile apps)
    failure_reason TEXT NULL,                    -- Alasan jika status failed/batal (sama dengan mobile apps)
    
    -- Audit Timestamps & Soft Delete
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk query cepat di Dashboard & Mobile Apps
CREATE INDEX IF NOT EXISTS idx_logistic_tasks_status ON logistic_tasks(status);
CREATE INDEX IF NOT EXISTS idx_logistic_tasks_driver ON logistic_tasks(driver_id);
CREATE INDEX IF NOT EXISTS idx_logistic_tasks_vehicle ON logistic_tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logistic_tasks_ref ON logistic_tasks(reference_number);
CREATE INDEX IF NOT EXISTS idx_logistic_tasks_date ON logistic_tasks(dispatch_date);

-- -------------------------------------------------------------------------
-- 3. TABEL SERAH TERIMA & BUKTI LAPANGAN (Proof of Delivery / Pickup)
-- -------------------------------------------------------------------------
-- Menyimpan dokumentasi bukti serah terima terpisah dari tugas utama
CREATE TABLE IF NOT EXISTS logistic_task_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES logistic_tasks(id) ON DELETE CASCADE,
    
    receiver_name VARCHAR(150) NOT NULL,         -- Nama pihak penerima barang di lokasi
    receiver_role VARCHAR(100) NULL,             -- Jabatan (Security, Admin Gudang, Pemilik, dll)
    receiver_phone VARCHAR(50) NULL,             -- No telp penerima jika ada
    item_condition VARCHAR(50) NOT NULL DEFAULT 'Baik', -- Kondisi barang (Baik, Sebagian Rusak, dll)
    
    proof_photo TEXT NOT NULL,                   -- Path/URL foto surat jalan bertanda tangan / foto barang
    signature_photo TEXT NULL,                   -- Path/URL tanda tangan digital penerima (jika ada)
    
    actual_lat DECIMAL(10, 8) NULL,              -- Titik GPS aktual saat driver submit serah terima
    actual_lng DECIMAL(11, 8) NULL,
    notes TEXT NULL,                             -- Catatan serah terima
    
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistic_task_proofs_task ON logistic_task_proofs(task_id);

-- -------------------------------------------------------------------------
-- 4. TABEL KENDALA & ISU LAPANGAN (Task Issues / Incidents)
-- -------------------------------------------------------------------------
-- 1 tugas bisa memiliki riwayat kendala (misal: pecah ban, toko tutup, selisih barang)
CREATE TABLE IF NOT EXISTS logistic_task_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES logistic_tasks(id) ON DELETE CASCADE,
    
    issue_type VARCHAR(50) NOT NULL,             -- Jenis: 'ban_bocor', 'gudang_tutup', 'barang_rusak', 'selisih_qty', 'macet_total', 'lainnya'
    issue_note TEXT NOT NULL,                    -- Keterangan rinci kendala
    issue_photo TEXT NULL,                       -- Bukti foto kendala lapangan
    reported_lat DECIMAL(10, 8) NULL,            -- Koordinat GPS saat kendala dilaporkan
    reported_lng DECIMAL(11, 8) NULL,
    
    is_resolved BOOLEAN DEFAULT FALSE,           -- Status penyelesaian kendala oleh SPV/Admin
    resolution_note TEXT NULL,                   -- Tindak lanjut penyelesaian
    resolved_by UUID NULL,                       -- Admin/SPV yang menyelesaikan
    resolved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistic_task_issues_task ON logistic_task_issues(task_id);

-- -------------------------------------------------------------------------
-- 5. TABEL RINCIAN ITEM BARANG: logistic_task_items
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistic_task_items (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES logistic_tasks(id) ON DELETE CASCADE,
    
    item_code VARCHAR(100) NULL,                 -- Kode barang dari Accurate SO/PO
    item_name TEXT NOT NULL,                     -- Nama / deskripsi barang
    quantity_order DECIMAL(12,2) DEFAULT 0,      -- Kuantitas sesuai dokumen pesanan
    quantity_actual DECIMAL(12,2) DEFAULT 0,     -- Kuantitas riil yang dimuat/diterima
    unit VARCHAR(50) DEFAULT 'Pcs',              -- Satuan (Box, Karton, Roll, Pallet)
    notes TEXT NULL,                             -- Catatan per item
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistic_task_items_task ON logistic_task_items(task_id);

-- -------------------------------------------------------------------------
-- 6. TABEL MASTER VENDOR EKSPEDISI / 3PL (LOGISTIC VENDORS)
-- -------------------------------------------------------------------------
-- Master data rekanan vendor ekspedisi, kargo, atau sewa armada truk
CREATE TABLE IF NOT EXISTS logistic_expedition_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) NOT NULL UNIQUE,      -- Misal: VND-DKT, VND-JNE, VND-IND
    vendor_name VARCHAR(150) NOT NULL,            -- Misal: Dakota Cargo, JNE Trucking, Indah Logistik Cargo
    vendor_type VARCHAR(50) DEFAULT 'cargo' CHECK (vendor_type IN ('cargo', 'courier', 'trucking_charter', 'forwarder')),
    
    -- Kontak & Kantor Cabang/Agen
    contact_person VARCHAR(150) NULL,            -- Nama Account Manager / PIC Agen
    phone_number VARCHAR(50) NULL,               -- No HP / WhatsApp
    telephone VARCHAR(50) NULL,                  -- No Telp Kantor
    email VARCHAR(100) NULL,
    office_address TEXT NULL,                    -- Alamat Agen / Hub Drop Point
    
    -- Layanan & Tarif / Termin Pembayaran
    supported_services TEXT[] DEFAULT ARRAY['Cargo Darat']::TEXT[], -- Cargo Darat, Cargo Udara, Laut, FTL, dsb.
    payment_terms VARCHAR(50) DEFAULT 'tempo_30' CHECK (payment_terms IN ('cash_cod', 'tempo_14', 'tempo_30', 'monthly_invoice')),
    website_tracking_url TEXT NULL,              -- URL Cek Resi (jika ada)
    
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expedition_vendors_name ON logistic_expedition_vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expedition_vendors_active ON logistic_expedition_vendors(is_active);

-- -------------------------------------------------------------------------
-- 7. TABEL PENGIRIMAN EKSPEDISI / VENDOR PIHAK KETIGA (3PL / CARGO)
-- -------------------------------------------------------------------------
-- Pengiriman SO (Delivery) atau Penjemputan PO (Pickup) yang didelegasikan ke Vendor Ekspedisi / Sewa Truk
CREATE TABLE IF NOT EXISTS logistic_expeditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expedition_number VARCHAR(100) NOT NULL UNIQUE, -- Kode internal: EXP-20261017-001
    tracking_number VARCHAR(100) NULL,             -- Nomor Resi / AWB Ekspedisi (cth: DKT-991209)
    
    -- Relasi Vendor Ekspedisi / Cargo
    vendor_id UUID NULL REFERENCES logistic_expedition_vendors(id) ON DELETE SET NULL,
    vendor_name VARCHAR(150) NOT NULL,            -- Cache nama vendor (misal: Dakota Cargo, JNE, Indah Logistik)
    service_type VARCHAR(100) NULL,               -- Layanan: Cargo Darat, Udara, Laut, FTL, LTL
    
    -- Jenis Transaksi & Referensi Dokumen Akurasi
    task_type VARCHAR(20) NOT NULL DEFAULT 'delivery' CHECK (task_type IN ('delivery', 'pickup')),
    reference_number VARCHAR(100) NOT NULL,        -- No SO (Delivery) atau No PO (Pickup) dari Akurasi API
    do_easy VARCHAR(100) NULL,                    -- Nomor DO Easy / Accurate
    customer_vendor_name VARCHAR(255) NOT NULL,   -- Nama Customer (Delivery) atau Vendor (Pickup)
    
    -- Rute Pengiriman (Alamat Lengkap & Kontak)
    origin_name VARCHAR(255) NULL,                -- Nama Tempat Asal
    origin_address TEXT NOT NULL,                 -- Alamat Lengkap Asal (Pengirim)
    origin_pic_name VARCHAR(150) NULL,            -- PIC Asal
    origin_pic_phone VARCHAR(50) NULL,
    
    destination_name VARCHAR(255) NULL,           -- Nama Tempat Tujuan
    destination_address TEXT NOT NULL,            -- Alamat Lengkap Tujuan (Penerima)
    receiver_pic_name VARCHAR(150) NULL,          -- PIC Penerima
    receiver_pic_phone VARCHAR(50) NULL,
    
    -- Muatan Barang & Biaya Pengiriman
    item_description TEXT NOT NULL,               -- Rincian barang muatan (dari SO/PO)
    total_colli INTEGER DEFAULT 1,                -- Jumlah koli / karton / pallet
    weight_kg DECIMAL(10,2) NULL,                 -- Berat muatan (Kg)
    cost_amount DECIMAL(14,2) NOT NULL DEFAULT 0, -- Harga / Ongkir Ekspedisi (Rp)
    payment_method VARCHAR(50) DEFAULT 'non_cod', -- 'non_cod', 'cod', 'invoice_tempo', 'reimburse'
    
    -- Timeline & Audit Lapangan
    shipping_date DATE NOT NULL,                  -- Tanggal kirim / serah ke ekspedisi
    estimated_arrival_date DATE NULL,             -- Estimasi tanggal datang (ETA)
    actual_arrival_date TIMESTAMP NULL,           -- Audit aktual tanggal & jam sampai (POD)
    
    -- Status & Bukti Lapangan
    status VARCHAR(30) NOT NULL DEFAULT 'on_delivery' CHECK (status IN ('draft', 'on_delivery', 'delivered', 'returned', 'lost', 'cancelled')),
    proof_photo TEXT NULL,                        -- Foto bukti resi fisik / serah terima
    notes TEXT NULL,                              -- Catatan khusus / kendala ekspedisi
    
    -- Audit Timestamps & User
    created_by UUID NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistic_expeditions_status ON logistic_expeditions(status);
CREATE INDEX IF NOT EXISTS idx_logistic_expeditions_vendor ON logistic_expeditions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_logistic_expeditions_ref ON logistic_expeditions(reference_number);
CREATE INDEX IF NOT EXISTS idx_logistic_expeditions_tracking ON logistic_expeditions(tracking_number);
CREATE INDEX IF NOT EXISTS idx_logistic_expeditions_shipping_date ON logistic_expeditions(shipping_date);


