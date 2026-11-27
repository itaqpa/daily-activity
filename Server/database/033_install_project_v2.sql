-- Installation Project V2 (aqpa_ip_v5) - Full Relational Schema (No JSONB)
-- All tables prefixed with install_v2_ so legacy 002_install_project tables can be dropped cleanly.

-- ============================================================================
-- 1. MASTER DATA & PENOMORAN
-- ============================================================================

CREATE TABLE IF NOT EXISTS install_v2_master_products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS install_v2_master_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bobot NUMERIC(7,6) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS install_v2_master_levels (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('Internal', 'External')),
  level TEXT NOT NULL,
  rate NUMERIC(15,2) NOT NULL DEFAULT 0,
  ot_rate NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS install_v2_master_cost_codes (
  kategori TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS install_v2_counter (
  year INTEGER PRIMARY KEY,
  seq INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- 2. PROJECT & PLAN AWAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS install_v2_projects (
  id TEXT PRIMARY KEY,
  no TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'planned', 'running', 'closed')),
  sales TEXT NOT NULL DEFAULT '',
  customer TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  leader TEXT NOT NULL DEFAULT '',
  budget NUMERIC(18,2) NOT NULL DEFAULT 0,
  est_start DATE NOT NULL,
  est_days INTEGER NOT NULL DEFAULT 30 CHECK (est_days >= 1),
  note TEXT NOT NULL DEFAULT '',
  started_at DATE,
  closed_at DATE,
  baseline_ts BIGINT,
  summary_actual NUMERIC(8,5) NOT NULL DEFAULT 0,
  summary_plan NUMERIC(8,5) NOT NULL DEFAULT 0,
  summary_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  summary_mh NUMERIC(10,2) NOT NULL DEFAULT 0,
  summary_last_day DATE,
  summary_as_of DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_install_v2_projects_status ON install_v2_projects(status);
CREATE INDEX IF NOT EXISTS idx_install_v2_projects_no ON install_v2_projects(no);

CREATE TABLE IF NOT EXISTS install_v2_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  qty NUMERIC(12,2) NOT NULL DEFAULT 1,
  satuan TEXT NOT NULL DEFAULT 'unit',
  bobot NUMERIC(7,6) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1 CHECK (days >= 1),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_install_v2_lines_project ON install_v2_lines(project_id);

CREATE TABLE IF NOT EXISTS install_v2_line_jobs (
  id TEXT PRIMARY KEY,
  line_id TEXT NOT NULL REFERENCES install_v2_lines(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  master_job_id TEXT,
  name TEXT NOT NULL,
  bobot NUMERIC(7,6) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_install_v2_line_jobs_line ON install_v2_line_jobs(line_id);

CREATE TABLE IF NOT EXISTS install_v2_baseline_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  code TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  qty NUMERIC(12,2) NOT NULL DEFAULT 1,
  satuan TEXT NOT NULL DEFAULT 'unit',
  bobot NUMERIC(7,6) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1 CHECK (days >= 1)
);

CREATE INDEX IF NOT EXISTS idx_install_v2_baseline_project ON install_v2_baseline_lines(project_id);

CREATE TABLE IF NOT EXISTS install_v2_mp_plan (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('Internal', 'External')),
  level TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 0),
  days INTEGER NOT NULL DEFAULT 1 CHECK (days >= 1)
);

CREATE INDEX IF NOT EXISTS idx_install_v2_mp_plan_project ON install_v2_mp_plan(project_id);

CREATE TABLE IF NOT EXISTS install_v2_cost_plan (
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  kategori TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, kategori)
);

-- ============================================================================
-- 3. MANPOWER & TEAM
-- ============================================================================

CREATE TABLE IF NOT EXISTS install_v2_manpower (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Internal', 'External')),
  level TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_install_v2_manpower_project ON install_v2_manpower(project_id);

CREATE TABLE IF NOT EXISTS install_v2_teams (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_install_v2_teams_project ON install_v2_teams(project_id);

CREATE TABLE IF NOT EXISTS install_v2_team_members (
  team_id TEXT NOT NULL REFERENCES install_v2_teams(id) ON DELETE CASCADE,
  manpower_id TEXT NOT NULL REFERENCES install_v2_manpower(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, manpower_id)
);

-- ============================================================================
-- 4. PELAKSANAAN HARIAN & REVISI
-- ============================================================================

CREATE TABLE IF NOT EXISTS install_v2_days (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cuaca TEXT NOT NULL DEFAULT '',
  catatan TEXT NOT NULL DEFAULT '',
  kendala TEXT NOT NULL DEFAULT '',
  besok TEXT NOT NULL DEFAULT '',
  rev INTEGER NOT NULL DEFAULT 0,
  saved_at BIGINT,
  rev_at BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, date)
);

CREATE INDEX IF NOT EXISTS idx_install_v2_days_project ON install_v2_days(project_id);

CREATE TABLE IF NOT EXISTS install_v2_day_teams (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  hours NUMERIC(5,2) NOT NULL DEFAULT 8 CHECK (hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_install_v2_day_teams_day ON install_v2_day_teams(day_id);

CREATE TABLE IF NOT EXISTS install_v2_day_team_members (
  day_team_id TEXT NOT NULL REFERENCES install_v2_day_teams(id) ON DELETE CASCADE,
  manpower_id TEXT NOT NULL,
  PRIMARY KEY (day_team_id, manpower_id)
);

CREATE TABLE IF NOT EXISTS install_v2_day_team_lines (
  day_team_id TEXT NOT NULL REFERENCES install_v2_day_teams(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  PRIMARY KEY (day_team_id, line_id)
);

CREATE TABLE IF NOT EXISTS install_v2_day_prog (
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  pct NUMERIC(8,6) NOT NULL DEFAULT 0,
  PRIMARY KEY (day_id, line_id)
);

CREATE TABLE IF NOT EXISTS install_v2_day_job_prog (
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  pct NUMERIC(8,6) NOT NULL DEFAULT 0,
  PRIMARY KEY (day_id, line_id, job_id)
);

CREATE TABLE IF NOT EXISTS install_v2_day_level_overrides (
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  manpower_id TEXT NOT NULL,
  level TEXT NOT NULL,
  PRIMARY KEY (day_id, manpower_id)
);

CREATE TABLE IF NOT EXISTS install_v2_day_hse_scopes (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  manpower_id TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('all', 'some')),
  line_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_install_v2_day_hse_day ON install_v2_day_hse_scopes(day_id);

CREATE TABLE IF NOT EXISTS install_v2_day_costs (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  no TEXT NOT NULL DEFAULT '',
  kategori TEXT NOT NULL,
  deskripsi TEXT NOT NULL DEFAULT '',
  qty NUMERIC(12,2) NOT NULL DEFAULT 1,
  price NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_install_v2_day_costs_day ON install_v2_day_costs(day_id);

CREATE TABLE IF NOT EXISTS install_v2_day_revisions (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES install_v2_days(id) ON DELETE CASCADE,
  rev INTEGER NOT NULL,
  rev_at BIGINT NOT NULL,
  cuaca TEXT NOT NULL DEFAULT '',
  catatan TEXT NOT NULL DEFAULT '',
  kendala TEXT NOT NULL DEFAULT '',
  besok TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS install_v2_audit_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES install_v2_projects(id) ON DELETE CASCADE,
  day_date DATE,
  rev INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  actor_name TEXT DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_install_v2_audit_project ON install_v2_audit_logs(project_id, created_at DESC);

-- ============================================================================
-- 5. SEED DEFAULT MASTER DATA (IDEMPOTENT)
-- ============================================================================

INSERT INTO install_v2_master_products (id, code, name, sort_order) VALUES
  ('pr1', 'RTI', 'Removable Thermal Insulation', 1),
  ('pr2', 'EJM', 'Expansion Joint Metal', 2),
  ('pr3', 'EJF', 'Expansion Joint Fabric', 3),
  ('pr4', 'EJR', 'Expansion Joint Rubber', 4),
  ('pr5', 'TLC', 'Telescopic', 5),
  ('pr6', 'PTF', 'PTFE Pipe & Fitting Lined', 6),
  ('pr7', 'GPP', 'Gland Packing', 7),
  ('pr8', 'DFG', 'Die Formed Graphite', 8),
  ('pr9', 'SWG', 'Spiral Wound Gasket', 9),
  ('pr10', 'GMG', 'Grooved Metal Gasket', 10),
  ('pr11', 'OTH', 'Others', 11)
ON CONFLICT (id) DO NOTHING;

INSERT INTO install_v2_master_jobs (id, name, bobot, sort_order) VALUES
  ('j1', 'Preparation / Persiapan', 0.10, 1),
  ('j2', 'Dismantling / Pembongkaran', 0.20, 2),
  ('j3', 'Repair / Fabrication', 0.25, 3),
  ('j4', 'Installation', 0.30, 4),
  ('j5', 'Inspection / QC', 0.10, 5),
  ('j6', 'Clearance', 0.05, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO install_v2_master_levels (id, source, level, rate, ot_rate) VALUES
  ('v1', 'Internal', 'Supervisor', 500000, 0),
  ('v2', 'Internal', 'Leader', 400000, 57200),
  ('v3', 'Internal', 'Welder', 300000, 42900),
  ('v4', 'Internal', 'Fitter', 300000, 42900),
  ('v5', 'Internal', 'Technician', 300000, 42900),
  ('v6', 'Internal', 'Helper', 200000, 28600),
  ('v7', 'Internal', 'HSE', 300000, 42900),
  ('v8', 'Internal', 'Administration', 200000, 28600),
  ('v9', 'External', 'Welder', 300000, 66700),
  ('v10', 'External', 'Fitter', 300000, 50000),
  ('v11', 'External', 'Technician', 300000, 50000),
  ('v12', 'External', 'Helper', 200000, 50000),
  ('v13', 'External', 'HSE', 300000, 33400)
ON CONFLICT (id) DO NOTHING;

INSERT INTO install_v2_master_cost_codes (kategori, code) VALUES
  ('Part / Material', 'PM'),
  ('Consumable', 'CS'),
  ('Sewa Alat', 'SA'),
  ('Transportasi', 'TR'),
  ('Akomodasi', 'AK'),
  ('Konsumsi', 'KS'),
  ('Lain-lain', 'LL')
ON CONFLICT (kategori) DO NOTHING;
