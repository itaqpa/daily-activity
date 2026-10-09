-- File: 005_permissions_seeder.sql
-- Tujuan: Mengisi (seeding) daftar master permissions untuk seluruh modul
-- Action yang tersedia: view, create, edit, delete, export, import

INSERT INTO permissions (nama_permission, deskripsi) VALUES
-- 1. Modul Dashboard
('dashboard_view', 'Melihat halaman Dashboard Marketing'),

-- 2. Modul Data Sales
('sales_view', 'Melihat Data Sales'),
('sales_create', 'Menambah Data Sales'),
('sales_edit', 'Mengubah Data Sales'),
('sales_delete', 'Menghapus Data Sales'),
('sales_export', 'Export Data Sales'),
('sales_import', 'Import Data Sales'),

-- 3. Modul Data Customer
('customer_view', 'Melihat Data Customer'),
('customer_create', 'Menambah Data Customer'),
('customer_edit', 'Mengubah Data Customer'),
('customer_delete', 'Menghapus Data Customer'),
('customer_export', 'Export Data Customer'),
('customer_import', 'Import Data Customer'),
('customer_approve', 'Approve Data Customer'),

-- 4. Modul Data Manpower
('manpower_view', 'Melihat Data Manpower'),
('manpower_create', 'Menambah Data Manpower'),
('manpower_edit', 'Mengubah Data Manpower'),
('manpower_delete', 'Menghapus Data Manpower'),
('manpower_export', 'Export Data Manpower'),
('manpower_import', 'Import Data Manpower'),

-- 5. Modul User Management
('user_view', 'Melihat User Management'),
('user_create', 'Menambah User'),
('user_edit', 'Mengubah User'),
('user_delete', 'Menghapus User'),

-- 6. Modul Manajemen Akses (Super Admin)
('akses_view', 'Melihat Manajemen Akses'),
('akses_edit', 'Mengubah Hak Akses dan Role'),

-- 7. Modul History & Activity Log
('history_view', 'Melihat History & Activity Log'),
('history_export', 'Export History Log'),

-- 8. Modul Catat Aktivitas (Marketing)
('aktivitas_view', 'Melihat Halaman Catat Aktivitas'),
('aktivitas_create', 'Mencatat Aktivitas Baru'),
('aktivitas_edit', 'Mengedit Aktivitas'),
('aktivitas_delete', 'Menghapus Aktivitas'),

-- 9. Modul Riwayat Aktivitas (Marketing)
('riwayat_aktivitas_view', 'Melihat Riwayat Aktivitas'),
('riwayat_aktivitas_export', 'Export Riwayat Aktivitas'),

-- 10. Modul Laporan Marketing
('laporan_marketing_view', 'Melihat Laporan Marketing'),
('laporan_marketing_view_all', 'Melihat Laporan Seluruh Tim'),
('laporan_marketing_view_team', 'Melihat Laporan Bawahan/Tim'),
('laporan_marketing_export', 'Export Laporan Marketing'),

-- 11. Modul Installation Project
('install_project_view', 'Melihat Installation Project'),
('install_project_create', 'Menambah Installation Project'),
('install_project_edit', 'Mengubah Installation Project'),
('install_project_delete', 'Menghapus Installation Project'),
('install_project_export', 'Export Installation Project'),

-- 12. Modul Daily Progress (Installation)
('daily_progress_view', 'Melihat Daily Progress'),
('daily_progress_create', 'Mengisi Daily Progress'),
('daily_progress_edit', 'Mengubah Daily Progress'),
('daily_progress_delete', 'Menghapus Daily Progress'),

-- 13. Modul Laporan Project (Installation)
('laporan_project_view', 'Melihat Laporan Project'),
('laporan_project_export', 'Export Laporan Project'),

-- 14. Modul Data Pengeluaran (Biaya Project MP)
('pengeluaran_view', 'Melihat Data Pengeluaran MP'),
('pengeluaran_create', 'Menambah Data Pengeluaran MP'),
('pengeluaran_edit', 'Mengubah Data Pengeluaran MP'),
('pengeluaran_delete', 'Menghapus Data Pengeluaran MP'),
('pengeluaran_export', 'Export Data Pengeluaran MP'),

-- 15. Modul Survey Product
('survey_product_view', 'Melihat Survey Product'),
('survey_product_create', 'Menambah Survey Product'),
('survey_product_edit', 'Mengubah Survey Product'),
('survey_product_fill_data', 'Mengisi Step Data (Survey Product)'),
('survey_product_fill_persiapan', 'Mengisi Step Persiapan (Survey Product)'),
('survey_product_fill_lapangan', 'Mengisi Step Lapangan (Survey Product)'),
('survey_product_fill_summary', 'Mengisi Step Summary (Survey Product)'),
('survey_product_delete', 'Menghapus Survey Product'),
('survey_product_export', 'Export Survey Product'),
('survey_product_token', 'Buat/Lihat Token Survey Product'),

-- 16. Modul Data Surveyor (Master Data)
('surveyor_view', 'Melihat Data Surveyor'),
('surveyor_create', 'Menambah Data Surveyor'),
('surveyor_edit', 'Mengubah Data Surveyor'),
('surveyor_delete', 'Menghapus Data Surveyor'),
('surveyor_export', 'Export Data Surveyor')

ON CONFLICT (nama_permission) DO NOTHING;
