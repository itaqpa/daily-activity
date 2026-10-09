-- File ini khusus untuk menangani struktur database hak akses fitur/privilese dan role tambahan

-- 0. Tabel permissions utama (Privilege List)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    nama_permission VARCHAR(100) UNIQUE NOT NULL,
    deskripsi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Tabel untuk menyimpan jabatan/role tambahan (Additional Roles) untuk user
CREATE TABLE IF NOT EXISTS user_additional_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    jabatan_id INTEGER REFERENCES jabatans(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, jabatan_id)
);

-- 2. Tabel penghubung antara jabatan/role dan permissions (Role-based Access Control)
CREATE TABLE IF NOT EXISTS jabatan_permissions (
    jabatan_id INTEGER REFERENCES jabatans(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (jabatan_id, permission_id)
);

-- 3. Tabel penghubung antara divisi dan permissions (Division-based Access Control)
-- Berguna untuk memberikan hak akses modul secara masif ke sebuah divisi (contoh: Semua orang di Divisi Sales bisa akses modul marketing)
CREATE TABLE IF NOT EXISTS divisi_permissions (
    divisi_id INTEGER REFERENCES divisis(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (divisi_id, permission_id)
);

-- 4. Tabel penghubung antara user dan permissions secara spesifik (Direct Access Control)
-- Berguna jika ada user yang butuh akses tertentu (atau pengecualian) di luar jabatan default dan jabatan tambahannya
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    is_auto_assigned BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, permission_id)
);

-- (Opsional) Contoh query untuk mengisi data dasar hak akses fitur:
-- INSERT INTO permissions (nama_permission, deskripsi) VALUES 
-- ('view_activity', 'Melihat aktivitas'),
-- ('approve_activity', 'Approval aktivitas') ON CONFLICT DO NOTHING;
