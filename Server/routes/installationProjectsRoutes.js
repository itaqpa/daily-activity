import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'db_aqpa_indonesia',
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

const router = express.Router();

// GET all projects
router.get('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let result;
    if (userId) {
      result = await pool.query(`
        SELECT p.* 
        FROM projects p
        JOIN v_akses_project v ON v.project_id = p.id
        WHERE v.user_id = $1
        ORDER BY p.id DESC
      `, [userId]);
    } else {
      result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET scope catalog
router.get('/scopes/catalog', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scope_catalog ORDER BY urutan ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single project with full nested relationships (Areas -> Units -> Scopes & Users)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const project = projectRes.rows[0];

    // Get progress actual from v_progress_project
    const progRes = await pool.query('SELECT progress_actual FROM v_progress_project WHERE project_id = $1', [id]);
    project.progress_actual = progRes.rows.length > 0 && progRes.rows[0].progress_actual !== null
      ? (parseFloat(progRes.rows[0].progress_actual) * 100).toFixed(2)
      : '0.00';

    // Get areas
    const areasRes = await pool.query('SELECT * FROM areas WHERE project_id = $1 ORDER BY urutan ASC', [id]);
    const areas = areasRes.rows;

    for (let i = 0; i < areas.length; i++) {
      areas[i].bobot = (parseFloat(areas[i].bobot) * 100).toFixed(2); // Convert back to percentage
      
      // Get units
      const unitsRes = await pool.query('SELECT * FROM units WHERE area_id = $1 ORDER BY urutan ASC', [areas[i].id]);
      const units = unitsRes.rows;

      for (let j = 0; j < units.length; j++) {
        units[j].bobot = (parseFloat(units[j].bobot) * 100).toFixed(2); // Convert back to percentage
        
        // Format dates
        if (units[j].target_start) units[j].target_start = new Date(units[j].target_start).toISOString().split('T')[0];
        if (units[j].target_finish) units[j].target_finish = new Date(units[j].target_finish).toISOString().split('T')[0];

        // Get capaian unit
        const uCapRes = await pool.query('SELECT capaian_unit FROM v_capaian_unit WHERE unit_id = $1', [units[j].id]);
        units[j].capaian_unit = uCapRes.rows.length > 0 && uCapRes.rows[0].capaian_unit !== null
          ? (parseFloat(uCapRes.rows[0].capaian_unit) * 100).toFixed(1)
          : '0.0';

        // Get scopes with capaian
        const scopesRes = await pool.query(`
          SELECT s.*, 
                 COALESCE((SELECT capaian FROM v_capaian_scope WHERE unit_scope_id = s.id LIMIT 1), 0) as capaian
          FROM unit_scopes s 
          WHERE s.unit_id = $1 
          ORDER BY s.urutan ASC
        `, [units[j].id]);
        
        units[j].scopes = scopesRes.rows.map(s => {
          const sBobotPercent = parseFloat(s.bobot || 0) * 100;
          const aBobotPercent = parseFloat(areas[i].bobot || 0);
          const uBobotPercent = parseFloat(units[j].bobot || 0);
          const projBobot = (aBobotPercent * uBobotPercent * sBobotPercent) / 10000;
          const capPercent = (parseFloat(s.capaian || 0) * 100).toFixed(1);
          return {
            ...s,
            bobot_unit: sBobotPercent.toFixed(2),
            bobot_project: projBobot.toFixed(2),
            capaian: capPercent
          };
        });

        // Get users if group_id exists
        units[j].selected_users = [];
        if (units[j].group_id) {
          const groupRes = await pool.query('SELECT nama FROM work_groups WHERE id = $1', [units[j].group_id]);
          if (groupRes.rows.length > 0) {
            units[j].group_name = groupRes.rows[0].nama;
          }

          const usersRes = await pool.query(`
            SELECT u.id, u.nama as name, u.posisi, u.rate_per_jam
            FROM group_rosters r
            JOIN group_roster_members rm ON r.id = rm.roster_id
            JOIN manpower u ON rm.manpower_id = u.id
            WHERE r.project_id = $1 AND r.group_id = $2
          `, [id, units[j].group_id]);
          units[j].selected_users = usersRes.rows;
        }
      }
      areas[i].units = units;
    }

    project.areas = areas;

    // Fetch all work_groups for this project
    const workGroupsRes = await pool.query('SELECT id, nama FROM work_groups WHERE project_id = $1 ORDER BY id ASC', [id]);
    project.work_groups = workGroupsRes.rows;

    // Fetch daily progress history for S-Curve if any
    try {
      const dailyProgRes = await pool.query(`
        SELECT p.tanggal, SUM(a.bobot * u.bobot * s.bobot * p.pct) * 100 as pct_day
        FROM daily_progress p
        JOIN unit_scopes s ON s.id = p.unit_scope_id
        JOIN units u ON u.id = s.unit_id
        JOIN areas a ON a.id = u.area_id
        WHERE a.project_id = $1
        GROUP BY p.tanggal
        ORDER BY p.tanggal ASC
      `, [id]);
      project.daily_progress_history = dailyProgRes.rows;
    } catch (e) {
      project.daily_progress_history = [];
    }

    // Fetch total costs
    try {
      const costsRes = await pool.query('SELECT COALESCE(SUM(jumlah), 0) as total FROM project_costs WHERE project_id = $1', [id]);
      project.total_biaya = costsRes.rows.length > 0 ? parseFloat(costsRes.rows[0].total) : 0;
    } catch (e) {
      project.total_biaya = 0;
    }

    // Format project date
    if (project.tgl_mulai) project.tgl_mulai = new Date(project.tgl_mulai).toISOString().split('T')[0];

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Helper function to insert children
async function insertChildren(client, projectId, reqBody) {
  const { areas, no_project, tgl_mulai } = reqBody;
  
  if (areas && Array.isArray(areas)) {
    let createdGroups = new Map();

    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      
      // Simpan Area
      const areaRes = await client.query(
        'INSERT INTO areas (project_id, nama, bobot, urutan) VALUES ($1, $2, $3, $4) RETURNING id',
        [projectId, area.nama, (parseFloat(area.bobot) / 100) || 0, i + 1]
      );
      const areaId = areaRes.rows[0].id;

      if (area.units && Array.isArray(area.units)) {
        for (let j = 0; j < area.units.length; j++) {
          const unit = area.units[j];
          
          let finalGroupId = null;

          // Jika group baru, insert ke work_groups dulu
          if (unit.group_id === 'new' && unit.new_group_name) {
            if (createdGroups.has(unit.new_group_name)) {
              finalGroupId = createdGroups.get(unit.new_group_name);
            } else {
              const newGrp = await client.query(
                `INSERT INTO work_groups (project_id, nama) VALUES ($1, $2) RETURNING id`,
                [projectId, unit.new_group_name]
              );
              finalGroupId = newGrp.rows[0].id;
              createdGroups.set(unit.new_group_name, finalGroupId);
            }
          } else if (unit.group_id && unit.group_id !== 'new') {
            const parsedId = parseInt(String(unit.group_id).replace(/\D/g,''));
            finalGroupId = !isNaN(parsedId) ? parsedId : null;
          }

          // Simpan Unit
          const unitRes = await client.query(
            `INSERT INTO units (area_id, nama, bobot, target_start, target_finish, group_id, urutan) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
              areaId, 
              unit.nama, 
              (parseFloat(unit.bobot) / 100) || 0, 
              unit.target_start || null, 
              unit.target_finish || null, 
              finalGroupId,
              j + 1
            ]
          );
          const unitId = unitRes.rows[0].id;

          // Simpan Manpower ke Roster
          if (finalGroupId && unit.selected_users && unit.selected_users.length > 0) {
            const rosterRes = await client.query(
              `INSERT INTO group_rosters (project_id, group_id, tanggal_berlaku) 
               VALUES ($1, $2, $3)
               ON CONFLICT (project_id, group_id, tanggal_berlaku) DO UPDATE SET tanggal_berlaku = EXCLUDED.tanggal_berlaku
               RETURNING id`,
              [projectId, finalGroupId, tgl_mulai || new Date()]
            );
            const rosterId = rosterRes.rows[0].id;

            for (const u of unit.selected_users) {
              const parsedUserId = parseInt(String(u.id).replace(/\D/g,''));
              if (!isNaN(parsedUserId)) {
                await client.query(
                  `INSERT INTO group_roster_members (roster_id, manpower_id) 
                   VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                  [rosterId, parsedUserId]
                );
              }
            }
          }

          // Simpan Scopes
          if (unit.scopes && Array.isArray(unit.scopes)) {
            for (let k = 0; k < unit.scopes.length; k++) {
              const scope = unit.scopes[k];
              await client.query(
                `INSERT INTO unit_scopes (unit_id, nama_scope, bobot, tipe, urutan)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  unitId, 
                  scope.nama_scope, 
                  (parseFloat(scope.bobot_unit) / 100) || 0, 
                  'planned',
                  k + 1
                ]
              );
            }
          }
        }
      }
    }
  }
}

// POST Create new project (Wizard)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { 
      no_project, nama, customer, lokasi, leader, tgl_mulai, 
      durasi_hari, nilai_kontrak, budget_biaya, status, catatan, created_by
    } = req.body;

    const projectQuery = `
      INSERT INTO projects (no_project, nama, customer, lokasi, leader, tgl_mulai, durasi_hari, nilai_kontrak, budget_biaya, status, catatan, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
    `;
    const projectValues = [
      no_project, nama, customer, lokasi, leader, tgl_mulai || new Date(),
      durasi_hari || 1, nilai_kontrak || 0, budget_biaya || 0, status || 'registered', catatan, created_by || null
    ];
    const projectRes = await client.query(projectQuery, projectValues);
    const projectId = projectRes.rows[0].id;

    await insertChildren(client, projectId, req.body);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Project created successfully', projectId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
});

// PUT Update project (Wizard Sync)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { 
      no_project, nama, customer, lokasi, leader, tgl_mulai, 
      durasi_hari, nilai_kontrak, budget_biaya, status, catatan
    } = req.body;

    await client.query('BEGIN');

    // Update parent
    const query = `
      UPDATE projects 
      SET no_project = $1, nama = $2, customer = $3, lokasi = $4, leader = $5, 
          tgl_mulai = $6, durasi_hari = $7, nilai_kontrak = $8, budget_biaya = $9, 
          status = $10, catatan = $11, updated_at = NOW()
      WHERE id = $12 RETURNING id
    `;
    const values = [
      no_project, nama, customer, lokasi, leader, tgl_mulai || new Date(), 
      durasi_hari || 1, nilai_kontrak || 0, budget_biaya || 0, status || 'draft', catatan, id
    ];
    
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }

    // Wipe old children (Cascade takes care of units, scopes, etc)
    await client.query('DELETE FROM areas WHERE project_id = $1', [id]);
    await client.query('DELETE FROM group_rosters WHERE project_id = $1', [id]);

    // Insert new children
    await insertChildren(client, id, req.body);

    await client.query('COMMIT');
    res.json({ message: 'Project saved successfully', projectId: id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
});

// PATCH Update project status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await pool.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Project status updated successfully', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
