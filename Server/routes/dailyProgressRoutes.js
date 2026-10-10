import express from 'express';

export default function dailyProgressRoutes(pool) {
  const router = express.Router();

  // GET /api/daily-progress
  router.get('/', async (req, res) => {
    try {
      const { project_id } = req.query;
      if (!project_id) {
        return res.status(400).json({ error: 'project_id is required' });
      }

      const query = `
        SELECT
          p.id as id,
          TO_CHAR(p.tanggal, 'YYYY-MM-DD') as tanggal,
          u.id as unit_id,
          a.nama || ' - ' || u.nama as area_unit,
          h.jam as jam_kerja,
          s.nama_scope || ' +' || ROUND((p.pct * 100)::numeric, 2) || '%' as capaian,
          COALESCE(p.catatan, '-') as catatan
        FROM daily_progress p
        JOIN unit_scopes s ON s.id = p.unit_scope_id
        JOIN units u ON u.id = s.unit_id
        JOIN areas a ON a.id = u.area_id
        LEFT JOIN daily_hours h ON h.unit_id = u.id AND h.tanggal::date = p.tanggal::date
        WHERE a.project_id = $1
        ORDER BY p.tanggal DESC, p.id DESC
      `;
      
      const result = await pool.query(query, [project_id]);
      
      const formattedData = result.rows.map(row => ({
        id: row.id,
        tanggal: row.tanggal,
        areaUnit: row.area_unit,
        jamKerja: row.jam_kerja,
        capaian: row.capaian,
        catatan: row.catatan || '-'
      }));

      res.json(formattedData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/daily-progress
  router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
      const { unit_id, tanggal, jam_kerja, scopes } = req.body;
      
      await client.query('BEGIN');

      // 1. Insert/Update daily_hours
      if (jam_kerja && Number(jam_kerja) > 0) {
        await client.query(`
          INSERT INTO daily_hours (unit_id, tanggal, jam)
          VALUES ($1, $2, $3)
          ON CONFLICT (unit_id, tanggal) DO UPDATE SET jam = EXCLUDED.jam
        `, [unit_id, tanggal, jam_kerja]);
      }

      // 2. Process scopes
      if (scopes && scopes.length > 0) {
        for (const scope of scopes) {
          let scopeId = scope.id;
          
          // Jika ID besar (timestamp), berarti scope baru tambahan dari frontend
          if (scopeId > 100000000) {
            const insertScopeRes = await client.query(`
              INSERT INTO unit_scopes (unit_id, nama_scope, bobot, tipe)
              VALUES ($1, $2, $3, $4)
              RETURNING id
            `, [
              unit_id, 
              scope.nama_scope, 
              (parseFloat(scope.bobot) / 100) || 0, 
              scope.tipe === 'Additional Job' ? 'additional' : 'planned'
            ]);
            scopeId = insertScopeRes.rows[0].id;
          }

          // Insert into daily_progress jika ada progress hari ini atau ada catatan
          const pctVal = parseFloat(scope.pct) || 0;
          if (pctVal > 0 || (scope.catatan && scope.catatan.trim() !== '')) {
            await client.query(`
              INSERT INTO daily_progress (unit_scope_id, tanggal, pct, catatan)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (unit_scope_id, tanggal) DO UPDATE SET pct = EXCLUDED.pct, catatan = EXCLUDED.catatan
            `, [scopeId, tanggal, pctVal / 100, scope.catatan || null]);
          }
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Success' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  return router;
}
