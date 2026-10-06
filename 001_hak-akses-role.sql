-- Tabel untuk menyimpan daftar role
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel users (contoh struktur dasar)
-- Menggunakan default_role_id untuk role utama yang selalu ada
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    default_role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (default_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- Tabel untuk menyimpan role tambahan (Additional Roles) bagi user
CREATE TABLE user_additional_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Tabel permissions (Hak Akses spesifik, misalnya: view_dashboard, edit_task, dll)
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel penghubung antara roles dan permissions (Role-based Access Control)
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- --- Data Awal (Seeding) ---

-- 1. Insert Roles
INSERT INTO roles (name, description) VALUES 
('Staff', 'Role default untuk karyawan biasa'),
('Manager', 'Role dengan akses ke laporan tim'),
('Admin', 'Role dengan akses penuh ke sistem');

-- 2. Insert Permissions
INSERT INTO permissions (name, description) VALUES 
('view_daily_activity', 'Melihat aktivitas harian'),
('create_daily_activity', 'Membuat aktivitas harian'),
('approve_activity', 'Menyetujui aktivitas bawahan'),
('manage_users', 'Mengelola data pengguna');

-- 3. Mapping Role to Permissions
-- Staff
INSERT INTO role_permissions (role_id, permission_id) VALUES 
((SELECT id FROM roles WHERE name='Staff'), (SELECT id FROM permissions WHERE name='view_daily_activity')),
((SELECT id FROM roles WHERE name='Staff'), (SELECT id FROM permissions WHERE name='create_daily_activity'));

-- Manager (Punya akses staff + approve)
INSERT INTO role_permissions (role_id, permission_id) VALUES 
((SELECT id FROM roles WHERE name='Manager'), (SELECT id FROM permissions WHERE name='view_daily_activity')),
((SELECT id FROM roles WHERE name='Manager'), (SELECT id FROM permissions WHERE name='create_daily_activity')),
((SELECT id FROM roles WHERE name='Manager'), (SELECT id FROM permissions WHERE name='approve_activity'));

-- Admin (Punya semua)
INSERT INTO role_permissions (role_id, permission_id) VALUES 
((SELECT id FROM roles WHERE name='Admin'), (SELECT id FROM permissions WHERE name='view_daily_activity')),
((SELECT id FROM roles WHERE name='Admin'), (SELECT id FROM permissions WHERE name='create_daily_activity')),
((SELECT id FROM roles WHERE name='Admin'), (SELECT id FROM permissions WHERE name='approve_activity')),
((SELECT id FROM roles WHERE name='Admin'), (SELECT id FROM permissions WHERE name='manage_users'));
