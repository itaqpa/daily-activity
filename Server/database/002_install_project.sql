
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS semua_project SMALLINT DEFAULT 0;

-- =====================================================================
--  INSTALLATION PROJECT - AQPA INDONESIA
--  Struktur database (MySQL 8 / MariaDB 10.4+, InnoDB, utf8mb4)
-- =====================================================================
--
--  CATATAN UMUM
--  1. Urutan tabel mengikuti alur aplikasi:
--       A. Pengguna           -> users, project_members
--       B. Persiapan (ADMIN)  -> projects, manpower, work_groups,
--                                scope_catalog, areas, units, unit_scopes
--       C. Pelaksanaan (USER) -> group_rosters, group_roster_members,
--                                daily_hours, daily_progress, project_costs
--                                (+ baris unit_scopes bertipe 'additional')
--       D. Arsip              -> versions, saved_reports
--       E. Hasil (OTOMATIS)   -> VIEW, tidak ada yang diisi
--
--  2. Semua bobot dan persen disimpan sebagai pecahan 0..1
--     (0.55 = 55%), sama seperti di aplikasi HTML.
--
--  3. Aturan "total bobot harus 100%" (area per project, unit per area,
--     scope per unit) TIDAK dikunci di database, karena saat mengetik
--     totalnya wajar belum 100%. Aturan ini diperiksa di aplikasi
--     (daftar "Yang perlu dilengkapi" di Dashboard).
--
--  4. PUBLIC vs KHUSUS PROJECT  (manpower, group/team, katalog scope)
--     Ketiga tabel itu punya kolom project_id yang boleh kosong:
--       project_id = NULL  -> PUBLIC: otomatis muncul di SEMUA project,
--                             termasuk project yang baru diregistrasikan.
--       project_id = 12    -> KHUSUS project 12: tidak terlihat di project
--                             lain. Kalau project lain mau memakainya,
--                             barisnya harus DISALIN (lihat contoh query
--                             di bagian F) atau diketik ulang.
--     Kolom disalin_dari_id mencatat asal baris hasil salinan.
--     Daftar yang "tersedia di sebuah project" = public + khusus project
--     itu; sudah disediakan sebagai view v_*_project di bagian E.
--
--  4b. AKSES PENGGUNA PER PROJECT
--     users.semua_project = 1 -> pengguna PUBLIC: punya akses ke setiap
--                                project, termasuk project baru.
--     tabel project_members   -> pengguna KHUSUS: hanya project yang
--                                didaftarkan di sini, dengan hak 'edit'
--                                atau 'lihat'.
--     Role admin selalu punya akses ke semua project.
--
--  5. Kolom created_by / updated_by mengarah ke users, supaya tercatat
--     siapa yang mengisi. Hak akses Admin / User tetap diatur di
--     aplikasi berdasarkan users.role.
-- =====================================================================



-- =====================================================================
--  A. PENGGUNA
-- =====================================================================

-- Diisi: ADMIN

-- =====================================================================
--  B. PERSIAPAN  (diisi ADMIN)
-- =====================================================================

-- Halaman: Register Project
-- Diisi: ADMIN
CREATE TABLE projects (
  id             SERIAL,
  no_project     VARCHAR(30)  NOT NULL,                 -- cth: PRJ-2026-001
  nama           VARCHAR(150) NOT NULL,
  customer       VARCHAR(150) NULL,
  lokasi         VARCHAR(100) NULL,
  leader         VARCHAR(100) NULL,
  tgl_mulai      DATE         NOT NULL,
  durasi_hari    INTEGER NOT NULL DEFAULT 1,       -- target selesai = tgl_mulai + durasi_hari - 1 (dihitung, tidak disimpan)
  nilai_kontrak  DECIMAL(15,2) NOT NULL DEFAULT 0,
  budget_biaya   DECIMAL(15,2) NOT NULL DEFAULT 0,
  status         VARCHAR(50) NOT NULL DEFAULT 'registered',
  started_at     DATE         NULL,                     -- terisi saat status menjadi running
  closed_at      DATE         NULL,                     -- terisi saat status menjadi closed
  catatan        VARCHAR(255) NULL,
  created_by     INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  PRIMARY KEY (id),
  CONSTRAINT uq_projects_no UNIQUE (no_project),

  CONSTRAINT fk_projects_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_projects_durasi CHECK (durasi_hari >= 1)
);

-- Pengguna yang DIKHUSUSKAN untuk sebuah project (tim pengisi project tsb).
-- Pengguna dengan users.semua_project = 1 dan role admin tidak perlu didaftarkan di sini.
-- Diisi: ADMIN
CREATE TABLE project_members (
  project_id     INTEGER NOT NULL,
  user_id        INTEGER NOT NULL,
  hak            VARCHAR(50) NOT NULL DEFAULT 'edit',  -- edit = boleh mengisi Input Harian project ini; lihat = hanya membaca
  ditambah_oleh  INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),

  CONSTRAINT fk_pm_project FOREIGN KEY (project_id)    REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user    FOREIGN KEY (user_id)       REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_pm_by      FOREIGN KEY (ditambah_oleh) REFERENCES users(id)    ON DELETE SET NULL
);

-- Halaman: Master Data > Manpower, posisi & rate
-- Diisi: ADMIN
-- project_id NULL = PUBLIC (muncul di semua project); terisi = KHUSUS project tsb.
CREATE TABLE manpower (
  id              SERIAL,
  project_id      INTEGER NULL,
  nama            VARCHAR(100) NOT NULL,
  posisi          VARCHAR(50) NOT NULL DEFAULT 'Helper',
  rate_per_jam    DECIMAL(12,2) NOT NULL DEFAULT 0,
  disalin_dari_id INTEGER NULL,                    -- asal baris bila hasil salinan dari project lain / dari public
  PRIMARY KEY (id),

  CONSTRAINT fk_manpower_project FOREIGN KEY (project_id)      REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_manpower_asal    FOREIGN KEY (disalin_dari_id) REFERENCES manpower(id) ON DELETE SET NULL
);

-- Halaman: Master Data > Group kerja / team  (hanya NAMA group; anggotanya di group_rosters)
-- Diisi: ADMIN
-- project_id NULL = team PUBLIC (muncul di semua project); terisi = team KHUSUS project tsb.
-- Anggota team public tetap dicatat PER PROJECT di group_rosters, jadi komposisinya
-- di project A tidak mempengaruhi project B.
CREATE TABLE work_groups (
  id              SERIAL,
  project_id      INTEGER NULL,
  nama            VARCHAR(100) NOT NULL,
  disalin_dari_id INTEGER NULL,
  PRIMARY KEY (id),

  CONSTRAINT fk_groups_project FOREIGN KEY (project_id)      REFERENCES projects(id)    ON DELETE CASCADE,
  CONSTRAINT fk_groups_asal    FOREIGN KEY (disalin_dari_id) REFERENCES work_groups(id) ON DELETE SET NULL
);

-- Halaman: Master Data > Katalog scope of work
-- Diisi: ADMIN
-- project_id NULL = scope PUBLIC (muncul di semua project); terisi = scope KHUSUS project tsb.
-- Nama kembar (dalam public, atau dalam satu project) dicegah di aplikasi:
-- indeks unik database tidak menganggap dua NULL sebagai kembar.
CREATE TABLE scope_catalog (
  id              SERIAL,
  project_id      INTEGER NULL,
  nama            VARCHAR(150) NOT NULL,
  urutan          INTEGER NOT NULL DEFAULT 0,
  disalin_dari_id INTEGER NULL,
  PRIMARY KEY (id),

  CONSTRAINT fk_scope_catalog_project FOREIGN KEY (project_id)      REFERENCES projects(id)      ON DELETE CASCADE,
  CONSTRAINT fk_scope_catalog_asal    FOREIGN KEY (disalin_dari_id) REFERENCES scope_catalog(id) ON DELETE SET NULL
);

-- Halaman: Rencana Kerja > Area
-- Diisi: ADMIN
CREATE TABLE areas (
  id             SERIAL,
  project_id     INTEGER NOT NULL,
  nama           VARCHAR(100) NOT NULL,
  bobot          DECIMAL(9,6) NOT NULL DEFAULT 0,       -- bobot area thd project; total per project = 1
  urutan         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id),

  CONSTRAINT fk_areas_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT ck_areas_bobot CHECK (bobot >= 0 AND bobot <= 1)
);

-- Halaman: Rencana Kerja > Unit
-- Diisi: ADMIN
CREATE TABLE units (
  id             SERIAL,
  area_id        INTEGER NOT NULL,
  nama           VARCHAR(100) NOT NULL,
  bobot          DECIMAL(9,6) NOT NULL DEFAULT 0,       -- bobot unit dalam area; total per area = 1
  target_start   DATE         NULL,
  target_finish  DATE         NULL,
  group_id       INTEGER NULL,                     -- group pelaksana: harus team public ATAU team khusus project ini (dijaga aplikasi; pilihannya dari v_group_project)
  urutan         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id),


  CONSTRAINT fk_units_area  FOREIGN KEY (area_id)  REFERENCES areas(id)       ON DELETE CASCADE,
  CONSTRAINT fk_units_group FOREIGN KEY (group_id) REFERENCES work_groups(id) ON DELETE SET NULL,
  CONSTRAINT ck_units_bobot CHECK (bobot >= 0 AND bobot <= 1),
  CONSTRAINT ck_units_tgl   CHECK (target_finish IS NULL OR target_start IS NULL OR target_finish >= target_start)
);

-- Halaman: Rencana Kerja > Scope per unit
-- Diisi: ADMIN untuk tipe 'planned'
--        USER  untuk tipe 'additional' (dari Input Harian > Additional job; bobot selalu 0)
-- nama_scope disimpan sebagai teks (bukan FK ke scope_catalog) karena
-- additional job boleh diketik bebas dan katalog boleh diubah belakangan.
CREATE TABLE unit_scopes (
  id             SERIAL,
  unit_id        INTEGER NOT NULL,
  nama_scope     VARCHAR(150) NOT NULL,
  bobot          DECIMAL(9,6) NOT NULL DEFAULT 0,       -- bobot scope dalam unit; total 'planned' per unit = 1
  tipe           VARCHAR(50) NOT NULL DEFAULT 'planned',
  ditambah_tgl   DATE         NULL,                     -- tanggal kerja saat additional job ditambahkan
  created_by     INTEGER NULL,
  urutan         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id),

  CONSTRAINT fk_unit_scopes_unit FOREIGN KEY (unit_id)    REFERENCES units(id) ON DELETE CASCADE,
  CONSTRAINT fk_unit_scopes_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_unit_scopes_bobot CHECK (bobot >= 0 AND bobot <= 1)
);


-- =====================================================================
--  C. PELAKSANAAN  (diisi USER, per tanggal kerja)
-- =====================================================================

-- Halaman: Input Harian > Anggota group
-- Diisi: USER
-- Satu baris = komposisi satu group DI SATU PROJECT yang BERLAKU MULAI tanggal tsb,
-- dan tetap berlaku sampai ada baris bertanggal lebih baru.
-- project_id wajib diisi supaya team public punya komposisi sendiri di tiap project.
CREATE TABLE group_rosters (
  id               SERIAL,
  project_id       INTEGER NOT NULL,
  group_id         INTEGER NOT NULL,
  tanggal_berlaku  DATE         NOT NULL,
  created_by       INTEGER NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_roster UNIQUE (project_id, group_id, tanggal_berlaku),

  CONSTRAINT fk_roster_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_roster_group FOREIGN KEY (group_id)   REFERENCES work_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_roster_user  FOREIGN KEY (created_by) REFERENCES users(id)       ON DELETE SET NULL
);

-- Anggota dari tiap komposisi di atas (satu manpower boleh ada di lebih dari satu group).
-- Anggotanya harus manpower public atau manpower khusus project tsb (dijaga aplikasi; pilihannya dari v_manpower_project).
-- Diisi: USER
CREATE TABLE group_roster_members (
  roster_id      INTEGER NOT NULL,
  manpower_id    INTEGER NOT NULL,
  PRIMARY KEY (roster_id, manpower_id),

  CONSTRAINT fk_rm_roster   FOREIGN KEY (roster_id)   REFERENCES group_rosters(id) ON DELETE CASCADE,
  CONSTRAINT fk_rm_manpower FOREIGN KEY (manpower_id) REFERENCES manpower(id)      ON DELETE CASCADE
);

-- Halaman: Input Harian > Progress & jam kerja  (bagian JAM KERJA)
-- Diisi: USER
-- Satu baris per unit per tanggal. Man-hours = jam x jumlah anggota group pada tanggal itu.
CREATE TABLE daily_hours (
  id             SERIAL,
  unit_id        INTEGER NOT NULL,
  tanggal        DATE         NOT NULL,
  jam            DECIMAL(4,1) NOT NULL,
  created_by     INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_daily_hours UNIQUE (unit_id, tanggal),

  CONSTRAINT fk_daily_hours_unit FOREIGN KEY (unit_id)    REFERENCES units(id) ON DELETE CASCADE,
  CONSTRAINT fk_daily_hours_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_daily_hours_jam CHECK (jam > 0 AND jam <= 24)
);

-- Halaman: Input Harian > Progress & jam kerja  (bagian % CAPAIAN)
-- Diisi: USER
-- pct = capaian HARI ITU saja (tambahan, bukan kumulatif).
-- Kumulatif satu scope tidak boleh melewati 1 (dibatasi aplikasi saat simpan).
CREATE TABLE daily_progress (
  id             SERIAL,
  unit_scope_id  INTEGER NOT NULL,
  tanggal        DATE         NOT NULL,
  pct            DECIMAL(7,6) NOT NULL,
  catatan        TEXT         NULL,
  created_by     INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_daily_progress UNIQUE (unit_scope_id, tanggal),

  CONSTRAINT fk_daily_progress_scope FOREIGN KEY (unit_scope_id) REFERENCES unit_scopes(id) ON DELETE CASCADE,
  CONSTRAINT fk_daily_progress_user  FOREIGN KEY (created_by)    REFERENCES users(id)       ON DELETE SET NULL,
  CONSTRAINT ck_daily_progress_pct CHECK (pct > 0 AND pct <= 1)
);

-- Halaman: Input Harian > Biaya proyek
-- Diisi: USER
-- unit_id NULL  = prorata ke semua unit (sebanding man-hours)
-- unit_id terisi = dibebankan langsung ke unit tsb
CREATE TABLE project_costs (
  id             SERIAL,
  project_id     INTEGER NOT NULL,
  tanggal        DATE         NOT NULL,
  kategori       VARCHAR(50) NOT NULL,
  keterangan     VARCHAR(255) NULL,
  jumlah         DECIMAL(15,2) NOT NULL,
  unit_id        INTEGER NULL,
  created_by     INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),


  CONSTRAINT fk_costs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_costs_unit    FOREIGN KEY (unit_id)    REFERENCES units(id)    ON DELETE SET NULL,
  CONSTRAINT fk_costs_user    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL,
  CONSTRAINT ck_costs_jumlah CHECK (jumlah > 0)
);


-- =====================================================================
--  D. ARSIP  (dibuat saat menekan tombol Simpan)
-- =====================================================================

-- Tombol "Simpan versi" di Register Project, Master Data, Rencana Kerja
-- Diisi: ADMIN
-- project_id NULL untuk jenis 'register' (berlaku untuk semua project).
-- snapshot = keadaan data saat disimpan, dipakai untuk membandingkan antar versi.
CREATE TABLE versions (
  id             SERIAL,
  project_id     INTEGER NULL,
  jenis          VARCHAR(50) NOT NULL,
  nomor          INTEGER NOT NULL,                 -- v1, v2, ...
  catatan        VARCHAR(255) NULL,
  snapshot       JSON         NOT NULL,
  created_by     INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_versions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_versions_user    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- Tombol "Simpan report" / "Simpan summary" di halaman Laporan
-- Diisi: siapa pun (ADMIN atau USER)
-- isi = tabel laporan yang dibekukan, supaya bisa diunduh lagi dengan angka yang sama.
-- project_id NULL bila cakupannya semua project.
CREATE TABLE saved_reports (
  id             SERIAL,
  project_id     INTEGER NULL,
  jenis          VARCHAR(50) NOT NULL,
  periode_dari   DATE         NULL,
  periode_sampai DATE         NULL,
  isi            JSON         NOT NULL,
  created_by     INTEGER NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),

  CONSTRAINT fk_saved_reports_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_reports_user    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);


-- =====================================================================
--  E. HASIL  (OTOMATIS - view, tidak ada yang diisi)
--  Dasar untuk Dashboard dan Laporan. Kurva S plan, forecast, dan
--  pembagian biaya prorata dihitung di aplikasi dari view ini.
-- =====================================================================

-- Capaian kumulatif tiap scope (maksimal 100%) dan bobotnya terhadap project
CREATE VIEW v_capaian_scope AS
SELECT
  a.project_id,
  a.id            AS area_id,
  u.id            AS unit_id,
  s.id            AS unit_scope_id,
  s.nama_scope,
  s.tipe,
  s.bobot         AS bobot_dlm_unit,
  a.bobot * u.bobot * s.bobot           AS bobot_thd_project,
  LEAST(1, COALESCE(SUM(p.pct), 0))     AS capaian
FROM unit_scopes s
JOIN units u ON u.id = s.unit_id
JOIN areas a ON a.id = u.area_id
LEFT JOIN daily_progress p ON p.unit_scope_id = s.id
GROUP BY a.project_id, a.id, u.id, s.id, s.nama_scope, s.tipe, s.bobot, a.bobot, u.bobot;

-- Capaian tiap unit (hanya scope terencana; additional job tidak masuk bobot)
CREATE VIEW v_capaian_unit AS
SELECT
  project_id,
  area_id,
  unit_id,
  SUM(bobot_dlm_unit)                                        AS total_bobot_scope,   -- seharusnya 1
  CASE WHEN SUM(bobot_dlm_unit) > 0
       THEN SUM(bobot_dlm_unit * capaian) / SUM(bobot_dlm_unit)
       ELSE 0 END                                            AS capaian_unit
FROM v_capaian_scope
WHERE tipe = 'planned'
GROUP BY project_id, area_id, unit_id;

-- Progress actual tiap project (penjumlahan bobot thd project x capaian)
CREATE VIEW v_progress_project AS
SELECT
  project_id,
  SUM(bobot_thd_project * capaian) AS progress_actual
FROM v_capaian_scope
WHERE tipe = 'planned'
GROUP BY project_id;

-- Jam kerja per manpower per unit per tanggal, beserta biayanya.
-- Anggota diambil dari komposisi group terakhir yang berlaku pada tanggal jam kerja.
-- Dasar untuk: man-hours, biaya manpower, laporan join - selesai.
CREATE VIEW v_jam_kerja_manpower AS
SELECT
  a.project_id,
  u.id               AS unit_id,
  u.group_id,
  h.tanggal,
  m.id               AS manpower_id,
  m.nama             AS nama_manpower,
  m.posisi,
  h.jam,
  m.rate_per_jam,
  h.jam * m.rate_per_jam AS biaya_manpower
FROM daily_hours h
JOIN units u ON u.id = h.unit_id
JOIN areas a ON a.id = u.area_id
JOIN group_rosters r
  ON r.project_id = a.project_id
 AND r.group_id = u.group_id
 AND r.tanggal_berlaku = (
       SELECT MAX(r2.tanggal_berlaku)
       FROM group_rosters r2
       WHERE r2.project_id = a.project_id
         AND r2.group_id = u.group_id
         AND r2.tanggal_berlaku <= h.tanggal)
JOIN group_roster_members rm ON rm.roster_id = r.id
JOIN manpower m ON m.id = rm.manpower_id;

-- Man-hours dan biaya manpower per unit (sebelum pembagian biaya prorata)
CREATE VIEW v_biaya_manpower_unit AS
SELECT
  project_id,
  unit_id,
  COUNT(*)            AS orang_hari,
  SUM(jam)            AS man_hours,
  SUM(biaya_manpower) AS biaya_manpower
FROM v_jam_kerja_manpower
GROUP BY project_id, unit_id;

-- Biaya proyek per project per kategori, dipisah prorata vs langsung
CREATE VIEW v_biaya_proyek AS
SELECT
  project_id,
  kategori,
  SUM(CASE WHEN unit_id IS NULL     THEN jumlah ELSE 0 END) AS prorata,
  SUM(CASE WHEN unit_id IS NOT NULL THEN jumlah ELSE 0 END) AS langsung,
  SUM(jumlah)                                               AS total
FROM project_costs
GROUP BY project_id, kategori;

-- ---------------------------------------------------------------------
--  Yang TERSEDIA di tiap project = public + khusus project itu.
--  Pakai dengan: SELECT ... FROM v_xxx_project WHERE project_id = ?
--  Project baru langsung mendapat semua baris public tanpa perlu disalin.
-- ---------------------------------------------------------------------

CREATE VIEW v_manpower_project AS
SELECT p.id AS project_id, m.id AS manpower_id, m.nama, m.posisi, m.rate_per_jam,
       CASE WHEN m.project_id IS NULL THEN 'public' ELSE 'khusus' END AS sifat
FROM projects p
JOIN manpower m ON m.project_id IS NULL OR m.project_id = p.id;

CREATE VIEW v_group_project AS
SELECT p.id AS project_id, g.id AS group_id, g.nama,
       CASE WHEN g.project_id IS NULL THEN 'public' ELSE 'khusus' END AS sifat
FROM projects p
JOIN work_groups g ON g.project_id IS NULL OR g.project_id = p.id;

CREATE VIEW v_scope_project AS
SELECT p.id AS project_id, s.id AS scope_id, s.nama, s.urutan,
       CASE WHEN s.project_id IS NULL THEN 'public' ELSE 'khusus' END AS sifat
FROM projects p
JOIN scope_catalog s ON s.project_id IS NULL OR s.project_id = p.id;

-- Siapa boleh membuka project mana, dan dengan hak apa
CREATE VIEW v_akses_project AS
SELECT p.id AS project_id, u.id AS user_id, u.name, u.role,
       CASE WHEN u.role = 'admin'      THEN 'edit'
            WHEN pm.user_id IS NOT NULL THEN pm.hak
            ELSE 'edit' END                                   AS hak,
       CASE WHEN u.role = 'admin'      THEN 'admin'
            WHEN u.semua_project = 1   THEN 'public'
            ELSE 'khusus' END                                 AS sifat
FROM projects p
JOIN users u ON u.is_active = true
LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = u.id
WHERE u.role = 'admin' OR u.semua_project = 1 OR pm.user_id IS NOT NULL;


-- =====================================================================
--  F. CONTOH QUERY: MENYALIN YANG KHUSUS KE PROJECT LAIN
--  (contoh saja, tidak dijalankan; ganti angka dengan id sebenarnya)
-- =====================================================================
--
--  Menyalin SATU scope khusus (id 40) ke project 12:
--    INSERT INTO scope_catalog (project_id, nama, urutan, disalin_dari_id)
--    SELECT 12, nama, urutan, id FROM scope_catalog WHERE id = 40;
--
--  Menyalin SEMUA scope khusus project 7 ke project 12:
--    INSERT INTO scope_catalog (project_id, nama, urutan, disalin_dari_id)
--    SELECT 12, nama, urutan, id FROM scope_catalog WHERE project_id = 7;
--
--  Menyalin semua manpower khusus project 7 ke project 12:
--    INSERT INTO manpower (project_id, nama, posisi, rate_per_jam, disalin_dari_id)
--    SELECT 12, nama, posisi, rate_per_jam, id FROM manpower WHERE project_id = 7;
--
--  Menyalin semua team khusus project 7 ke project 12 (namanya saja;
--  anggotanya diisi lagi di Input Harian project 12):
--    INSERT INTO work_groups (project_id, nama, disalin_dari_id)
--    SELECT 12, nama, id FROM work_groups WHERE project_id = 7;
--
--  Menyalin tim pengisi (akses pengguna) project 7 ke project 12:
--    INSERT INTO project_members (project_id, user_id, hak)
--    SELECT 12, user_id, hak FROM project_members WHERE project_id = 7;
--
--  Menjadikan sebuah scope khusus (id 40) PUBLIC untuk semua project:
--    UPDATE scope_catalog SET project_id = NULL WHERE id = 40;
--
-- =====================================================================
--  RINGKASAN: SIAPA MENGISI TABEL MANA
-- ---------------------------------------------------------------------
--  ADMIN    users, project_members, projects, manpower, work_groups, scope_catalog,
--           areas, units, unit_scopes (tipe planned), versions
--  USER     group_rosters, group_roster_members, daily_hours,
--           daily_progress, project_costs, unit_scopes (tipe additional)
--  KEDUANYA saved_reports
--  OTOMATIS v_capaian_scope, v_capaian_unit, v_progress_project,
--           v_jam_kerja_manpower, v_biaya_manpower_unit, v_biaya_proyek,
--           v_manpower_project, v_group_project, v_scope_project, v_akses_project
-- =====================================================================
