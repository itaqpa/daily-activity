CREATE TABLE IF NOT EXISTS divisis (
    id SERIAL PRIMARY KEY,
    nama_divisi VARCHAR(255) NOT NULL,
    kode_divisi VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jabatans (
    id SERIAL PRIMARY KEY,
    nama_jabatan VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    nama_permission VARCHAR(255) UNIQUE NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    no_akun VARCHAR(50),
    nama_customer VARCHAR(255) NOT NULL,
    site_kota VARCHAR(255),
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    divisi_id INTEGER REFERENCES divisis(id) ON DELETE SET NULL,
    jabatan_id INTEGER REFERENCES jabatans(id) ON DELETE SET NULL,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS sales_customers (
    sales_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sales_id, customer_id)
);

CREATE TABLE IF NOT EXISTS daily_activity_sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    site_kota VARCHAR(255),
    jenis_aktivitas VARCHAR(255),
    ditemui JSONB,
    ditemui_lainnya VARCHAR(255),
    tanggal DATE,
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Insert Roles (Jabatan)
INSERT INTO jabatans (nama_jabatan, level) VALUES
('Super Admin', 5),
('Admin', 4),
('Manager', 4),
('Spv', 3),
('Leader', 2),
('Staff', 1)
ON CONFLICT DO NOTHING;

-- Insert Divisi
INSERT INTO divisis (nama_divisi, kode_divisi) VALUES
('Sales', 'SLS')
ON CONFLICT DO NOTHING;

-- Insert Super Admin User
INSERT INTO users (name, username, email, password, divisi_id, jabatan_id)
VALUES (
    'Super Admin', 
    'superadmin', 
    'superadmin@aqpa-indonesia.com', 
    'aqpa1122@2026!', 
    (SELECT id FROM divisis WHERE kode_divisi='SLS' LIMIT 1), 
    (SELECT id FROM jabatans WHERE nama_jabatan='Super Admin' LIMIT 1)
)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, username = EXCLUDED.username;

-- Insert Admin User
INSERT INTO users (name, username, email, password, divisi_id, jabatan_id)
VALUES (
    'Admin', 
    'admin', 
    'admin@aqpa-indonesia.com', 
    'aqpa1122@2026!', 
    (SELECT id FROM divisis WHERE kode_divisi='SLS' LIMIT 1), 
    (SELECT id FROM jabatans WHERE nama_jabatan='Admin' LIMIT 1)
)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, username = EXCLUDED.username;

-- Insert Sales Spv
INSERT INTO users (name, username, email, password, divisi_id, jabatan_id)
VALUES (
    'Sales Supervisor', 
    'salesspv', 
    'salesspv@aqpa-indonesia.com', 
    'aqpa1122@2026!', 
    (SELECT id FROM divisis WHERE kode_divisi='SLS' LIMIT 1), 
    (SELECT id FROM jabatans WHERE nama_jabatan='Spv' LIMIT 1)
)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, username = EXCLUDED.username;

-- Insert Sales Staff
INSERT INTO users (name, username, email, password, divisi_id, jabatan_id)
VALUES (
    'Sales Staff', 
    'salesstaff', 
    'salesstaff@aqpa-indonesia.com', 
    'aqpa1122@2026!', 
    (SELECT id FROM divisis WHERE kode_divisi='SLS' LIMIT 1), 
    (SELECT id FROM jabatans WHERE nama_jabatan='Staff' LIMIT 1)
)
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, username = EXCLUDED.username;
