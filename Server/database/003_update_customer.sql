-- Migration: Penambahan kolom 'note' pada tabel customers
-- Tipe Data: VARCHAR(255) (Bukan ENUM)
-- Alasan:
-- Kolom 'note' menggunakan VARCHAR(255) agar fleksibel dan tidak terkunci sebagai ENUM.
-- Saat ini inputan pada form adalah 'Register' dan 'Not Register'.
-- Namun jika di kemudian hari format input berubah menjadi catatan teks bebas (free-text note)
-- ataupun opsi dropdown bertambah, struktur database tetap aman tanpa perlu modifikasi enum/tipe data.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS note VARCHAR(255);
