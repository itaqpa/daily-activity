import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { getUserPermissionScope } from '../utils/dataScopeHelper.js';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'db_aqpa_indonesia',
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

const router = express.Router();

async function hasPerm(req, permName) {
  const info = await getUserPermissionScope(pool, req.user, permName);
  return info.isSuperAdmin || Boolean(info.scope);
}

async function canAccessProject(req, projectId) {
  const { scope, isSuperAdmin } = await getUserPermissionScope(pool, req.user, 'install_project_view');
  if (isSuperAdmin) return true;
  if (!scope) return false;
  if (scope === 'ALL') return true;
  const userName = req.user?.name || req.user?.username || '';
  const { rows } = await pool.query(
    `SELECT 1 FROM install_v2_projects WHERE id = $1 AND LOWER(TRIM(COALESCE(leader, ''))) = LOWER(TRIM($2))`,
    [projectId, userName]
  );
  return rows.length > 0;
}

// Ensure relational audit log table exists on live DB (No JSONB)
pool.query(`
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
  ALTER TABLE install_v2_audit_logs ADD COLUMN IF NOT EXISTS actor_name TEXT DEFAULT 'System';
  CREATE INDEX IF NOT EXISTS idx_install_v2_audit_project ON install_v2_audit_logs(project_id, created_at DESC);
`).catch(() => {});

const fmtRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const fmtPct = (f) => ((Number(f) || 0) * 100).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
const logId = () => 'aud_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

async function addAudit(client, pid, dayDate, rev, category, action, summary, actorName = 'System') {
  await client.query(
    `INSERT INTO install_v2_audit_logs (id, project_id, day_date, rev, category, action, summary, actor_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [logId(), pid, dayDate || null, parseInt(rev, 10) || 0, category, action, summary, actorName || 'System']
  );
}

const toDateStr = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
};

// ============================================================================
// MASTER DATA
// ============================================================================

router.get('/master', async (req, res) => {
  if (!(await hasPerm(req, 'install_project_view'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin install_project_view' });
  }
  try {
    const [products, jobs, levels, codes] = await Promise.all([
      pool.query('SELECT id, code, name FROM install_v2_master_products ORDER BY sort_order, id'),
      pool.query('SELECT id, name, bobot::float FROM install_v2_master_jobs ORDER BY sort_order, id'),
      pool.query('SELECT id, source, level, rate::float, ot_rate::float AS ot FROM install_v2_master_levels ORDER BY source, id'),
      pool.query('SELECT kategori, code FROM install_v2_master_cost_codes')
    ]);
    const codeMap = {};
    codes.rows.forEach(r => { codeMap[r.kategori] = r.code; });
    res.json({
      products: products.rows,
      jobs: jobs.rows,
      levels: levels.rows,
      codes: codeMap
    });
  } catch (err) {
    console.error('GET /master error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/master', async (req, res) => {
  if (!(await hasPerm(req, 'install_project_edit'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin install_project_edit' });
  }
  const client = await pool.connect();
  try {
    const { products = [], jobs = [], levels = [], codes = {} } = req.body || {};
    await client.query('BEGIN');

        await client.query('DELETE FROM install_v2_master_products');
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await client.query(
        'INSERT INTO install_v2_master_products (id, code, name, sort_order) VALUES ($1, $2, $3, $4)',
        [p.id, String(p.code || '').toUpperCase(), p.name || '', i + 1]
      );
    }

    await client.query('DELETE FROM install_v2_master_jobs');
    for (let i = 0; i < jobs.length; i++) {
      const j = jobs[i];
      await client.query(
        'INSERT INTO install_v2_master_jobs (id, name, bobot, sort_order) VALUES ($1, $2, $3, $4)',
        [j.id, j.name || '', Number(j.bobot) || 0, i + 1]
      );
    }

    await client.query('DELETE FROM install_v2_master_levels');
    for (const v of levels) {
      await client.query(
        'INSERT INTO install_v2_master_levels (id, source, level, rate, ot_rate) VALUES ($1, $2, $3, $4, $5)',
        [v.id, v.source === 'External' ? 'External' : 'Internal', v.level || '', Number(v.rate) || 0, Number(v.ot) || 0]
      );
    }

    await client.query('DELETE FROM install_v2_master_cost_codes');
    for (const [kategori, code] of Object.entries(codes)) {
      await client.query(
        'INSERT INTO install_v2_master_cost_codes (kategori, code) VALUES ($1, $2)',
        [kategori, String(code || '').toUpperCase()]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /master error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// PROJECTS
// ============================================================================

async function hydrateProject(client, row) {
  const pid = row.id;
  const [linesRes, jobsRes, baseRes, mpPlanRes, costPlanRes, mpRes, teamsRes, tmRes] = await Promise.all([
    client.query('SELECT id, code, product, area, qty::float, satuan, bobot::float, start_date::text AS start, days FROM install_v2_lines WHERE project_id = $1 ORDER BY sort_order, code', [pid]),
    client.query('SELECT id, line_id, master_job_id, name, bobot::float FROM install_v2_line_jobs WHERE project_id = $1 ORDER BY sort_order, id', [pid]),
    client.query('SELECT id, line_id, code, product, area, qty::float, satuan, bobot::float, start_date::text AS start, days FROM install_v2_baseline_lines WHERE project_id = $1 ORDER BY code', [pid]),
    client.query('SELECT id, source, level, qty, days FROM install_v2_mp_plan WHERE project_id = $1', [pid]),
    client.query('SELECT kategori, amount::float FROM install_v2_cost_plan WHERE project_id = $1', [pid]),
    client.query('SELECT id, name, source, level FROM install_v2_manpower WHERE project_id = $1', [pid]),
    client.query('SELECT id, name FROM install_v2_teams WHERE project_id = $1', [pid]),
    client.query('SELECT tm.team_id, tm.manpower_id FROM install_v2_team_members tm JOIN install_v2_teams t ON t.id = tm.team_id WHERE t.project_id = $1', [pid])
  ]);

  const jobsByLine = {};
  jobsRes.rows.forEach(j => {
    if (!jobsByLine[j.line_id]) jobsByLine[j.line_id] = [];
    jobsByLine[j.line_id].push({ id: j.master_job_id || j.id, name: j.name, bobot: j.bobot });
  });

  const lines = linesRes.rows.map(l => ({
    ...l,
    jobs: jobsByLine[l.id] || []
  }));

  const costPlan = {};
  costPlanRes.rows.forEach(c => { costPlan[c.kategori] = c.amount; });

  const membersByTeam = {};
  tmRes.rows.forEach(r => {
    if (!membersByTeam[r.team_id]) membersByTeam[r.team_id] = [];
    membersByTeam[r.team_id].push(r.manpower_id);
  });

  const teams = teamsRes.rows.map(t => ({
    id: t.id,
    name: t.name,
    members: membersByTeam[t.id] || []
  }));

  return {
    id: row.id,
    no: row.no,
    status: row.status,
    reg: {
      sales: row.sales,
      customer: row.customer,
      location: row.location,
      leader: row.leader,
      budget: Number(row.budget) || 0,
      estStart: toDateStr(row.est_start),
      estDays: row.est_days,
      note: row.note
    },
    lines,
    manpower: mpRes.rows,
    teams,
    mpPlan: mpPlanRes.rows,
    costPlan,
    baseline: row.baseline_ts ? { ts: Number(row.baseline_ts), lines: baseRes.rows } : null,
    summary: {
      actual: Number(row.summary_actual) || 0,
      plan: Number(row.summary_plan) || 0,
      cost: Number(row.summary_cost) || 0,
      mh: Number(row.summary_mh) || 0,
      lastDay: toDateStr(row.summary_last_day),
      asOf: toDateStr(row.summary_as_of)
    },
    startedAt: toDateStr(row.started_at),
    closedAt: toDateStr(row.closed_at),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

router.get('/projects', async (req, res) => {
  try {
    const { scope, isSuperAdmin } = await getUserPermissionScope(pool, req.user, 'install_project_view');

    let result;
    if (isSuperAdmin || scope === 'ALL') {
      result = await pool.query('SELECT * FROM install_v2_projects ORDER BY no DESC');
    } else {
      const userName = req.user?.name || req.user?.username || '';
      result = await pool.query(
        `SELECT * FROM install_v2_projects
         WHERE LOWER(TRIM(COALESCE(leader, ''))) = LOWER(TRIM($1))
         ORDER BY no DESC`,
        [userName]
      );
    }

    const projects = [];
    for (const row of result.rows) {
      projects.push(await hydrateProject(pool, row));
    }
    res.json(projects);
  } catch (err) {
    console.error('GET /projects error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects', async (req, res) => {
  if (!(await hasPerm(req, 'install_project_create'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin install_project_create' });
  }
  const client = await pool.connect();
  try {
    const p = req.body;
    const reg = p.reg || {};
    const now = new Date();
    const year = now.getFullYear();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(year).slice(-2);

    await client.query('BEGIN');

    // Atomic project number generation
    const cntRes = await client.query(
      `INSERT INTO install_v2_counter (year, seq) VALUES ($1, 1)
       ON CONFLICT (year) DO UPDATE SET seq = install_v2_counter.seq + 1
       RETURNING seq`,
      [year]
    );
    const seq = cntRes.rows[0].seq;
    const no = p.no || `INS-${dd}${mm}${yy}-${String(seq).padStart(3, '0')}`;

    await client.query(
      `INSERT INTO install_v2_projects (id, no, status, sales, customer, location, leader, budget, est_start, est_days, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        p.id, no, p.status || 'registered',
        reg.sales || '', reg.customer || '', reg.location || '', reg.leader || '',
        Number(reg.budget) || 0, reg.estStart, Math.max(1, parseInt(reg.estDays) || 30), reg.note || ''
      ]
    );

    if (Array.isArray(p.manpower)) {
      for (const m of p.manpower) {
        await client.query(
          'INSERT INTO install_v2_manpower (id, project_id, name, source, level) VALUES ($1, $2, $3, $4, $5)',
          [m.id, p.id, m.name || '', m.source === 'External' ? 'External' : 'Internal', m.level || 'Helper']
        );
      }
    }

    await client.query('COMMIT');
    const saved = await pool.query('SELECT * FROM install_v2_projects WHERE id = $1', [p.id]);
    res.status(201).json(await hydrateProject(pool, saved.rows[0]));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /projects error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/projects/:id', async (req, res) => {
  if (!(await hasPerm(req, 'install_project_edit')) && !(await hasPerm(req, 'install_project_progress'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin install_project_edit' });
  }
  if (!(await canAccessProject(req, req.params.id))) {
    return res.status(403).json({ error: 'Akses ditolak: bukan proyek Anda' });
  }
  const client = await pool.connect();
  try {
    const pid = req.params.id;
    const p = req.body;
    const actorName = p.actor_name || req.headers['x-actor-name'] || req.user?.name || req.user?.username || 'System';
    const reg = p.reg || {};
    const sum = p.summary || {};

    await client.query('BEGIN');

    // Capture previous project status, baseline & manpower for audit diff
    const [prevProjRes, prevMpRes] = await Promise.all([
      client.query('SELECT status, baseline_ts FROM install_v2_projects WHERE id = $1', [pid]),
      client.query('SELECT id, name, source, level FROM install_v2_manpower WHERE project_id = $1', [pid])
    ]);
    const prevProj = prevProjRes.rows[0];
    if (prevProj) {
      if (prevProj.status !== (p.status || 'registered')) {
        await addAudit(client, pid, null, 0, 'status', 'ubah', `Status project: ${prevProj.status} → ${p.status || 'registered'}`, actorName);
      }
      if (!prevProj.baseline_ts && p.baseline?.ts) {
        await addAudit(client, pid, null, 0, 'plan', 'tambah', `Plan Awal dikunci sebagai baseline (${(p.lines || []).length} item)`, actorName);
      } else if (prevProj.baseline_ts && p.baseline?.ts && Number(prevProj.baseline_ts) !== Number(p.baseline.ts)) {
        await addAudit(client, pid, null, 0, 'plan', 'ubah', `Baseline Plan Awal diperbarui (${(p.lines || []).length} item)`, actorName);
      }
    }
    const oldMpMap = new Map(prevMpRes.rows.map((m) => [m.id, m]));
    const newMpMap = new Map((p.manpower || []).map((m) => [m.id, m]));
    for (const m of (p.manpower || [])) {
      const old = oldMpMap.get(m.id);
      if (!old) {
        await addAudit(client, pid, null, 0, 'manpower', 'tambah', `Tambah manpower: ${m.name} (${m.source} · ${m.level})`, actorName);
      } else if (old.level !== m.level || old.source !== m.source || old.name !== m.name) {
        await addAudit(client, pid, null, 0, 'manpower', 'ubah', `Update manpower ${m.name}: ${old.source} ${old.level} → ${m.source} ${m.level}`, actorName);
      }
    }
    for (const old of prevMpRes.rows) {
      if (!newMpMap.has(old.id)) {
        await addAudit(client, pid, null, 0, 'manpower', 'hapus', `Hapus manpower: ${old.name} (${old.level})`, actorName);
      }
    }

    await client.query(
      `UPDATE install_v2_projects SET
        status = $2, sales = $3, customer = $4, location = $5, leader = $6,
        budget = $7, est_start = $8, est_days = $9, note = $10,
        started_at = $11, closed_at = $12, baseline_ts = $13,
        summary_actual = $14, summary_plan = $15, summary_cost = $16, summary_mh = $17,
        summary_last_day = $18, summary_as_of = $19, updated_at = NOW()
       WHERE id = $1`,
      [
        pid, p.status || 'registered',
        reg.sales || '', reg.customer || '', reg.location || '', reg.leader || '',
        Number(reg.budget) || 0, reg.estStart, Math.max(1, parseInt(reg.estDays) || 30), reg.note || '',
        p.startedAt || null, p.closedAt || null, p.baseline ? p.baseline.ts : null,
        Number(sum.actual) || 0, Number(sum.plan) || 0, Number(sum.cost) || 0, Number(sum.mh) || 0,
        sum.lastDay || null, sum.asOf || null
      ]
    );

    // Sync lines & line_jobs
    await client.query('DELETE FROM install_v2_lines WHERE project_id = $1', [pid]);
    if (Array.isArray(p.lines)) {
      for (let i = 0; i < p.lines.length; i++) {
        const l = p.lines[i];
        await client.query(
          `INSERT INTO install_v2_lines (id, project_id, code, product, area, qty, satuan, bobot, start_date, days, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [l.id, pid, l.code || '', l.product || '', l.area || '', Number(l.qty) || 0, l.satuan || 'unit', Number(l.bobot) || 0, l.start, Math.max(1, parseInt(l.days) || 1), i + 1]
        );
        if (Array.isArray(l.jobs)) {
          for (let j = 0; j < l.jobs.length; j++) {
            const jb = l.jobs[j];
            await client.query(
              `INSERT INTO install_v2_line_jobs (id, line_id, project_id, master_job_id, name, bobot, sort_order)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [`${l.id}_${jb.id}`, l.id, pid, jb.id, jb.name || '', Number(jb.bobot) || 0, j + 1]
            );
          }
        }
      }
    }

    // Sync baseline
    await client.query('DELETE FROM install_v2_baseline_lines WHERE project_id = $1', [pid]);
    if (p.baseline && Array.isArray(p.baseline.lines)) {
      for (const bl of p.baseline.lines) {
        await client.query(
          `INSERT INTO install_v2_baseline_lines (id, project_id, line_id, code, product, area, qty, satuan, bobot, start_date, days)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [`bl_${pid}_${bl.id}`, pid, bl.id, bl.code || '', bl.product || '', bl.area || '', Number(bl.qty) || 0, bl.satuan || 'unit', Number(bl.bobot) || 0, bl.start, Math.max(1, parseInt(bl.days) || 1)]
        );
      }
    }

    // Sync mpPlan
    await client.query('DELETE FROM install_v2_mp_plan WHERE project_id = $1', [pid]);
    if (Array.isArray(p.mpPlan)) {
      for (const r of p.mpPlan) {
        await client.query(
          'INSERT INTO install_v2_mp_plan (id, project_id, source, level, qty, days) VALUES ($1, $2, $3, $4, $5, $6)',
          [r.id, pid, r.source === 'External' ? 'External' : 'Internal', r.level || '', parseInt(r.qty) || 0, Math.max(1, parseInt(r.days) || 1)]
        );
      }
    }

    // Sync costPlan
    await client.query('DELETE FROM install_v2_cost_plan WHERE project_id = $1', [pid]);
    if (p.costPlan && typeof p.costPlan === 'object') {
      for (const [kat, amt] of Object.entries(p.costPlan)) {
        await client.query(
          'INSERT INTO install_v2_cost_plan (project_id, kategori, amount) VALUES ($1, $2, $3)',
          [pid, kat, Number(amt) || 0]
        );
      }
    }

    // Sync manpower & teams
    await client.query('DELETE FROM install_v2_teams WHERE project_id = $1', [pid]);
    await client.query('DELETE FROM install_v2_manpower WHERE project_id = $1', [pid]);
    if (Array.isArray(p.manpower)) {
      for (const m of p.manpower) {
        await client.query(
          'INSERT INTO install_v2_manpower (id, project_id, name, source, level) VALUES ($1, $2, $3, $4, $5)',
          [m.id, pid, m.name || '', m.source === 'External' ? 'External' : 'Internal', m.level || 'Helper']
        );
      }
    }
    if (Array.isArray(p.teams)) {
      for (const t of p.teams) {
        await client.query('INSERT INTO install_v2_teams (id, project_id, name) VALUES ($1, $2, $3)', [t.id, pid, t.name || 'Team']);
        if (Array.isArray(t.members)) {
          for (const mid of t.members) {
            await client.query(
              'INSERT INTO install_v2_team_members (team_id, manpower_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [t.id, mid]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /projects/:id error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/projects/:id', async (req, res) => {
  if (!(await hasPerm(req, 'install_project_delete'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin install_project_delete' });
  }
  if (!(await canAccessProject(req, req.params.id))) {
    return res.status(403).json({ error: 'Akses ditolak: bukan proyek Anda' });
  }
  try {
    await pool.query('DELETE FROM install_v2_projects WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /projects/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DAILY RECORDS
// ============================================================================

router.get('/projects/:id/days', async (req, res) => {
  if (!(await canAccessProject(req, req.params.id))) {
    return res.status(403).json({ error: 'Akses ditolak: tidak memiliki akses ke proyek ini' });
  }
  try {
    const pid = req.params.id;
    const daysRes = await pool.query('SELECT * FROM install_v2_days WHERE project_id = $1 ORDER BY date', [pid]);
    const out = {};

    for (const d of daysRes.rows) {
      const dateStr = toDateStr(d.date);
      const [dtRes, dtmRes, dtlRes, progRes, jpRes, lvRes, hseRes, costRes, revRes] = await Promise.all([
        pool.query('SELECT id, team_id, hours::float FROM install_v2_day_teams WHERE day_id = $1', [d.id]),
        pool.query('SELECT dtm.day_team_id, dtm.manpower_id FROM install_v2_day_team_members dtm JOIN install_v2_day_teams dt ON dt.id = dtm.day_team_id WHERE dt.day_id = $1', [d.id]),
        pool.query('SELECT dtl.day_team_id, dtl.line_id FROM install_v2_day_team_lines dtl JOIN install_v2_day_teams dt ON dt.id = dtl.day_team_id WHERE dt.day_id = $1', [d.id]),
        pool.query('SELECT line_id, pct::float FROM install_v2_day_prog WHERE day_id = $1', [d.id]),
        pool.query('SELECT line_id, job_id, pct::float FROM install_v2_day_job_prog WHERE day_id = $1', [d.id]),
        pool.query('SELECT manpower_id, level FROM install_v2_day_level_overrides WHERE day_id = $1', [d.id]),
        pool.query('SELECT manpower_id, scope_type, line_id FROM install_v2_day_hse_scopes WHERE day_id = $1', [d.id]),
        pool.query('SELECT id, no, kategori, deskripsi AS desc, qty::float, price::float FROM install_v2_day_costs WHERE day_id = $1', [d.id]),
        pool.query('SELECT rev, rev_at, cuaca, catatan, kendala, besok FROM install_v2_day_revisions WHERE day_id = $1 ORDER BY rev', [d.id])
      ]);

      const memByDt = {}, lineByDt = {};
      dtmRes.rows.forEach(r => { (memByDt[r.day_team_id] = memByDt[r.day_team_id] || []).push(r.manpower_id); });
      dtlRes.rows.forEach(r => { (lineByDt[r.day_team_id] = lineByDt[r.day_team_id] || []).push(r.line_id); });

      const teams = dtRes.rows.map(t => ({
        teamId: t.team_id,
        hours: t.hours,
        members: memByDt[t.id] || [],
        lines: lineByDt[t.id] || []
      }));

      const prog = {};
      progRes.rows.forEach(r => { prog[r.line_id] = r.pct; });

      const jp = {};
      jpRes.rows.forEach(r => {
        if (!jp[r.line_id]) jp[r.line_id] = {};
        jp[r.line_id][r.job_id] = r.pct;
      });

      const lv = {};
      lvRes.rows.forEach(r => { lv[r.manpower_id] = r.level; });

      const hse = {};
      hseRes.rows.forEach(r => {
        if (r.scope_type === 'all') hse[r.manpower_id] = 'all';
        else {
          if (!Array.isArray(hse[r.manpower_id])) hse[r.manpower_id] = [];
          if (r.line_id) hse[r.manpower_id].push(r.line_id);
        }
      });

      const revs = revRes.rows.map(r => ({
        rev: r.rev,
        ts: Number(r.rev_at),
        snap: { cuaca: r.cuaca, catatan: r.catatan, kendala: r.kendala, besok: r.besok }
      }));

      out[dateStr] = {
        date: dateStr,
        teams,
        prog,
        jp,
        act: {},
        lv,
        hse,
        costs: costRes.rows,
        cuaca: d.cuaca,
        catatan: d.catatan,
        kendala: d.kendala,
        besok: d.besok,
        rev: d.rev,
        revs,
        savedAt: d.saved_at ? Number(d.saved_at) : undefined,
        revAt: d.rev_at ? Number(d.rev_at) : undefined
      };
    }

    res.json(out);
  } catch (err) {
    console.error('GET /projects/:id/days error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/projects/:id/days/:date', async (req, res) => {
  if (!(await hasPerm(req, 'daily_progress_create')) && !(await hasPerm(req, 'daily_progress_edit')) && !(await hasPerm(req, 'install_project_edit'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin daily_progress_create atau daily_progress_edit' });
  }
  if (!(await canAccessProject(req, req.params.id))) {
    return res.status(403).json({ error: 'Akses ditolak: bukan proyek Anda' });
  }
  const client = await pool.connect();
  try {
    const { id: pid, date } = req.params;
    const d = req.body || {};
    const actorName = d.actor_name || req.headers['x-actor-name'] || req.user?.name || req.user?.username || 'System';
    const dayId = `${pid}_${date}`;

    await client.query('BEGIN');

    // Read previous day state for relational audit diff before replacing
    const prevDayRes = await client.query('SELECT id, cuaca, catatan, kendala, besok, saved_at FROM install_v2_days WHERE project_id = $1 AND date = $2', [pid, date]);
    const prevDayRow = prevDayRes.rows[0];
    let prevLv = {}, prevProg = {}, prevCosts = [], prevTeams = [];
    if (prevDayRow) {
      const [lvR, prR, coR, tmR, memR] = await Promise.all([
        client.query('SELECT manpower_id, level FROM install_v2_day_level_overrides WHERE day_id = $1', [prevDayRow.id]),
        client.query('SELECT line_id, pct::float FROM install_v2_day_prog WHERE day_id = $1', [prevDayRow.id]),
        client.query('SELECT id, kategori, deskripsi, qty::float, price::float FROM install_v2_day_costs WHERE day_id = $1', [prevDayRow.id]),
        client.query('SELECT id, team_id, hours::float FROM install_v2_day_teams WHERE day_id = $1', [prevDayRow.id]),
        client.query('SELECT dtm.day_team_id, dtm.manpower_id FROM install_v2_day_team_members dtm JOIN install_v2_day_teams dt ON dt.id = dtm.day_team_id WHERE dt.day_id = $1', [prevDayRow.id])
      ]);
      lvR.rows.forEach((r) => { prevLv[r.manpower_id] = r.level; });
      prR.rows.forEach((r) => { prevProg[r.line_id] = r.pct; });
      prevCosts = coR.rows;
      const memMap = {};
      memR.rows.forEach((r) => { (memMap[r.day_team_id] = memMap[r.day_team_id] || []).push(r.manpower_id); });
      prevTeams = tmR.rows.map((t) => ({ teamId: t.team_id, hours: t.hours, members: memMap[t.id] || [] }));
    }

    const [mpMetaR, lineMetaR, teamMetaR] = await Promise.all([
      client.query('SELECT id, name, level FROM install_v2_manpower WHERE project_id = $1', [pid]),
      client.query('SELECT id, code, area FROM install_v2_lines WHERE project_id = $1', [pid]),
      client.query('SELECT id, name FROM install_v2_teams WHERE project_id = $1', [pid])
    ]);
    const mpMeta = new Map(mpMetaR.rows.map((m) => [m.id, m]));
    const lineMeta = new Map(lineMetaR.rows.map((l) => [l.id, l]));
    const teamMeta = new Map(teamMetaR.rows.map((t) => [t.id, t]));
    const revNo = parseInt(d.rev, 10) || 0;

    // 1. Manpower daily role changes
    const allLvIds = new Set([...Object.keys(prevLv), ...Object.keys(d.lv || {})]);
    for (const mid of allLvIds) {
      const m = mpMeta.get(mid);
      const oldLv = prevLv[mid] || m?.level || '-';
      const newLv = (d.lv || {})[mid] || m?.level || '-';
      if (oldLv !== newLv) {
        await addAudit(client, pid, date, revNo, 'manpower', 'ubah', `Role ${m?.name || mid} pada ${date}: ${oldLv} → ${newLv}`, actorName);
      }
    }

    // 2. Team attendance / hours changes
    if (Array.isArray(d.teams)) {
      const oldTeamMap = new Map(prevTeams.map((t) => [t.teamId, t]));
      for (const t of d.teams) {
        const ot = oldTeamMap.get(t.teamId);
        const oldMembers = ot ? (ot.members || []) : [];
        const newMembers = t.members || [];
        const oldCnt = oldMembers.length;
        const newCnt = newMembers.length;
        const oldHrs = ot ? Number(ot.hours) : 8;
        const newHrs = Number(t.hours) || 0;
        const addedNames = newMembers.filter((id) => !oldMembers.includes(id)).map((id) => mpMeta.get(id)?.name || id);
        const removedNames = oldMembers.filter((id) => !newMembers.includes(id)).map((id) => mpMeta.get(id)?.name || id);
        const allNames = newMembers.map((id) => mpMeta.get(id)?.name || id);
        if (prevDayRow && (oldCnt !== newCnt || oldHrs !== newHrs || addedNames.length > 0 || removedNames.length > 0)) {
          const tName = teamMeta.get(t.teamId)?.name || 'Team';
          const parts = [];
          if (addedNames.length > 0) parts.push(`+${addedNames.length}: ${addedNames.join(', ')}`);
          if (removedNames.length > 0) parts.push(`-${removedNames.length}: ${removedNames.join(', ')}`);
          if (allNames.length > 0) parts.push(`anggota (${allNames.length}): ${allNames.join(', ')}`);
          const detailStr = parts.length > 0 ? ` [${parts.join(' | ')}]` : '';
          await addAudit(client, pid, date, revNo, 'team', 'ubah', `${tName}: ${oldCnt}→${newCnt} org${detailStr}, jam kerja ${oldHrs}→${newHrs}j`, actorName);
        }
      }
    }

    // 3. Progress changes
    const allLineIds = new Set([...Object.keys(prevProg), ...Object.keys(d.prog || {})]);
    for (const lid of allLineIds) {
      const oP = Number(prevProg[lid]) || 0;
      const nP = Number((d.prog || {})[lid]) || 0;
      if (Math.abs(oP - nP) > 0.0001) {
        const l = lineMeta.get(lid);
        await addAudit(client, pid, date, revNo, 'progress', oP === 0 ? 'tambah' : 'ubah', `Progres ${l?.code || lid}${l?.area ? ' (' + l.area + ')' : ''}: ${fmtPct(oP)} → ${fmtPct(nP)}`, actorName);
      }
    }

    // 4. Cost changes
    const oldCostMap = new Map(prevCosts.map((c) => [c.id, c]));
    const newCostMap = new Map((d.costs || []).map((c) => [c.id, c]));
    for (const c of (d.costs || [])) {
      const oc = oldCostMap.get(c.id);
      const nTot = (Number(c.qty) || 0) * (Number(c.price) || 0);
      if (!oc) {
        await addAudit(client, pid, date, revNo, 'cost', 'tambah', `Tambah biaya ${c.kategori}: ${c.desc || '-'} (${fmtRp(nTot)})`, actorName);
      } else {
        const oTot = (Number(oc.qty) || 0) * (Number(oc.price) || 0);
        if (oc.kategori !== c.kategori || oc.deskripsi !== (c.desc || '') || Math.abs(oTot - nTot) > 1) {
          await addAudit(client, pid, date, revNo, 'cost', 'ubah', `Ubah biaya ${c.kategori}: ${c.desc || '-'} (${fmtRp(oTot)} → ${fmtRp(nTot)})`, actorName);
        }
      }
    }
    for (const oc of prevCosts) {
      if (!newCostMap.has(oc.id)) {
        const oTot = (Number(oc.qty) || 0) * (Number(oc.price) || 0);
        await addAudit(client, pid, date, revNo, 'cost', 'hapus', `Hapus biaya ${oc.kategori}: ${oc.deskripsi || '-'} (${fmtRp(oTot)})`, actorName);
      }
    }

    // 5. Notes / Lock
    if (prevDayRow && (prevDayRow.cuaca !== (d.cuaca || '') || prevDayRow.catatan !== (d.catatan || '') || prevDayRow.kendala !== (d.kendala || '') || prevDayRow.besok !== (d.besok || ''))) {
      await addAudit(client, pid, date, revNo, 'note', 'ubah', `Catatan lapangan ${date} diperbarui`, actorName);
    } else if (!prevDayRow && d.savedAt) {
      await addAudit(client, pid, date, revNo, 'note', 'tambah', `Laporan harian ${date} disimpan`, actorName);
    }

        const dayUpsert = await client.query(
      `INSERT INTO install_v2_days (id, project_id, date, cuaca, catatan, kendala, besok, rev, saved_at, rev_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (project_id, date) DO UPDATE SET
         cuaca = EXCLUDED.cuaca, catatan = EXCLUDED.catatan, kendala = EXCLUDED.kendala, besok = EXCLUDED.besok,
         rev = EXCLUDED.rev, saved_at = EXCLUDED.saved_at, rev_at = EXCLUDED.rev_at, updated_at = NOW()
       RETURNING id`,
      [dayId, pid, date, d.cuaca || '', d.catatan || '', d.kendala || '', d.besok || '', parseInt(d.rev) || 0, d.savedAt || null, d.revAt || null]
    );
    const actualDayId = dayUpsert.rows[0].id;

    // Clear child tables
    await Promise.all([
      client.query('DELETE FROM install_v2_day_teams WHERE day_id = $1', [actualDayId]),
      client.query('DELETE FROM install_v2_day_prog WHERE day_id = $1', [actualDayId]),
      client.query('DELETE FROM install_v2_day_job_prog WHERE day_id = $1', [actualDayId]),
      client.query('DELETE FROM install_v2_day_level_overrides WHERE day_id = $1', [actualDayId]),
      client.query('DELETE FROM install_v2_day_hse_scopes WHERE day_id = $1', [actualDayId]),
      client.query('DELETE FROM install_v2_day_costs WHERE day_id = $1', [actualDayId]),
      client.query('DELETE FROM install_v2_day_revisions WHERE day_id = $1', [actualDayId])
    ]);

    if (Array.isArray(d.teams)) {
      for (const t of d.teams) {
        const dtId = `${actualDayId}_${t.teamId}`;
        await client.query('INSERT INTO install_v2_day_teams (id, day_id, team_id, hours) VALUES ($1, $2, $3, $4)', [dtId, actualDayId, t.teamId, Number(t.hours) || 0]);
        for (const mid of (t.members || [])) {
          await client.query('INSERT INTO install_v2_day_team_members (day_team_id, manpower_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [dtId, mid]);
        }
        for (const lid of (t.lines || [])) {
          await client.query('INSERT INTO install_v2_day_team_lines (day_team_id, line_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [dtId, lid]);
        }
      }
    }

    for (const [lid, pct] of Object.entries(d.prog || {})) {
      if (Number(pct) > 0) {
        await client.query('INSERT INTO install_v2_day_prog (day_id, line_id, pct) VALUES ($1, $2, $3)', [actualDayId, lid, Number(pct)]);
      }
    }

    for (const [lid, jobs] of Object.entries(d.jp || {})) {
      for (const [jid, pct] of Object.entries(jobs || {})) {
        if (Number(pct) > 0) {
          await client.query('INSERT INTO install_v2_day_job_prog (day_id, line_id, job_id, pct) VALUES ($1, $2, $3, $4)', [actualDayId, lid, jid, Number(pct)]);
        }
      }
    }

    for (const [mid, level] of Object.entries(d.lv || {})) {
      if (level) {
        await client.query('INSERT INTO install_v2_day_level_overrides (day_id, manpower_id, level) VALUES ($1, $2, $3)', [actualDayId, mid, level]);
      }
    }

    for (const [mid, scope] of Object.entries(d.hse || {})) {
      if (scope === 'all') {
        await client.query('INSERT INTO install_v2_day_hse_scopes (id, day_id, manpower_id, scope_type, line_id) VALUES ($1, $2, $3, $4, NULL)', [`${actualDayId}_${mid}_all`, actualDayId, mid, 'all']);
      } else if (Array.isArray(scope)) {
        for (const lid of scope) {
          await client.query('INSERT INTO install_v2_day_hse_scopes (id, day_id, manpower_id, scope_type, line_id) VALUES ($1, $2, $3, $4, $5)', [`${actualDayId}_${mid}_${lid}`, actualDayId, mid, 'some', lid]);
        }
      }
    }

    for (const c of (d.costs || [])) {
      await client.query(
        'INSERT INTO install_v2_day_costs (id, day_id, no, kategori, deskripsi, qty, price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [c.id, actualDayId, c.no || '', c.kategori || 'Lain-lain', c.desc || '', Number(c.qty) || 0, Number(c.price) || 0]
      );
    }

    for (const r of (d.revs || [])) {
      const s = r.snap || {};
      await client.query(
        'INSERT INTO install_v2_day_revisions (id, day_id, rev, rev_at, cuaca, catatan, kendala, besok) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [`${actualDayId}_rev_${r.rev}`, actualDayId, parseInt(r.rev) || 0, r.ts || Date.now(), s.cuaca || '', s.catatan || '', s.kendala || '', s.besok || '']
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /projects/:id/days/:date error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/projects/:id/days/:date', async (req, res) => {
  if (!(await hasPerm(req, 'daily_progress_delete')) && !(await hasPerm(req, 'install_project_delete'))) {
    return res.status(403).json({ error: 'Akses ditolak: butuh izin daily_progress_delete' });
  }
  if (!(await canAccessProject(req, req.params.id))) {
    return res.status(403).json({ error: 'Akses ditolak: bukan proyek Anda' });
  }
  try {
    await pool.query('DELETE FROM install_v2_days WHERE project_id = $1 AND date = $2', [req.params.id, req.params.date]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /projects/:id/days/:date error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/projects/:id/audit-logs', async (req, res) => {
  if (!(await canAccessProject(req, req.params.id))) {
    return res.status(403).json({ error: 'Akses ditolak: tidak memiliki akses ke proyek ini' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, project_id, day_date, rev, category, action, summary, actor_name, created_at FROM install_v2_audit_logs WHERE project_id = $1 ORDER BY created_at DESC LIMIT 200',
      [req.params.id]
    );
    res.json(rows.map((r) => ({ ...r, day_date: r.day_date ? toDateStr(r.day_date) : null })));
  } catch (err) {
    console.error('GET /projects/:id/audit-logs error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
