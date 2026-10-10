import express from 'express';

export default function manpowerRoutes(pool) {
  const router = express.Router();

  // GET /api/manpower
  // Query params: ?project_id=... (optional)
  router.get('/', async (req, res) => {
    try {
      const { project_id } = req.query;
      let query;
      let values = [];

      if (project_id) {
        query = `
          SELECT m.*, 
                 p.nama as project_nama,
                 p.no_project as project_no
          FROM manpower m
          LEFT JOIN projects p ON m.project_id = p.id
          WHERE m.project_id IS NULL OR m.project_id = $1
          ORDER BY m.id ASC
        `;
        values = [project_id];
      } else {
        query = `
          SELECT m.*, 
                 p.nama as project_nama,
                 p.no_project as project_no
          FROM manpower m
          LEFT JOIN projects p ON m.project_id = p.id
          ORDER BY m.id ASC
        `;
      }

      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching manpower:', err);
      res.status(500).json({ error: 'Gagal memuat data manpower: ' + err.message });
    }
  });

  // GET /api/manpower/positions - Unique positions
  router.get('/positions', async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT DISTINCT posisi FROM manpower WHERE posisi IS NOT NULL AND posisi != '' ORDER BY posisi ASC"
      );
      const defaultPositions = ['Welder', 'Teknisi', 'Helper', 'Foreman', 'Fitter', 'Electrician', 'Supervisor'];
      const dbPositions = result.rows.map(r => r.posisi);
      const allPositions = Array.from(new Set([...defaultPositions, ...dbPositions]));
      res.json(allPositions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/manpower - Create manpower
  router.post('/', async (req, res) => {
    try {
      const { nama, posisi = 'Helper', rate_per_jam = 0, project_id = null } = req.body;
      if (!nama || !nama.trim()) {
        return res.status(400).json({ error: 'Nama manpower wajib diisi' });
      }

      const parsedRate = parseFloat(rate_per_jam) || 0;
      const parsedProjectId = project_id ? parseInt(project_id) : null;

      const result = await pool.query(
        `INSERT INTO manpower (nama, posisi, rate_per_jam, project_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [nama.trim(), posisi.trim(), parsedRate, parsedProjectId]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating manpower:', err);
      res.status(500).json({ error: 'Gagal menambahkan manpower: ' + err.message });
    }
  });

  // POST /api/manpower/seed - Seed default sample data if empty
  router.post('/seed', async (req, res) => {
    try {
      const countRes = await pool.query('SELECT COUNT(*) FROM manpower');
      if (parseInt(countRes.rows[0].count) > 0) {
        return res.status(400).json({ message: 'Tabel manpower sudah memiliki data' });
      }

      const defaultData = [
        { nama: 'Nama Manpower 1', posisi: 'Welder', rate: 45000 },
        { nama: 'Nama Manpower 2', posisi: 'Welder', rate: 45000 },
        { nama: 'Nama Manpower 3', posisi: 'Teknisi', rate: 40000 },
        { nama: 'Nama Manpower 4', posisi: 'Teknisi', rate: 40000 },
        { nama: 'Nama Manpower 5', posisi: 'Helper', rate: 32500 },
        { nama: 'Nama Manpower 6', posisi: 'Helper', rate: 32500 },
      ];

      for (const item of defaultData) {
        await pool.query(
          'INSERT INTO manpower (nama, posisi, rate_per_jam, project_id) VALUES ($1, $2, $3, NULL)',
          [item.nama, item.posisi, item.rate]
        );
      }

      const result = await pool.query('SELECT * FROM manpower ORDER BY id ASC');
      res.json({ message: 'Berhasil menginisialisasi sample manpower', data: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/manpower/:id - Update manpower
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nama, posisi = 'Helper', rate_per_jam = 0, project_id = null } = req.body;

      if (!nama || !nama.trim()) {
        return res.status(400).json({ error: 'Nama manpower wajib diisi' });
      }

      const parsedRate = parseFloat(rate_per_jam) || 0;
      const parsedProjectId = project_id ? parseInt(project_id) : null;

      const result = await pool.query(
        `UPDATE manpower 
         SET nama = $1, posisi = $2, rate_per_jam = $3, project_id = $4
         WHERE id = $5
         RETURNING *`,
        [nama.trim(), posisi.trim(), parsedRate, parsedProjectId, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Manpower tidak ditemukan' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating manpower:', err);
      res.status(500).json({ error: 'Gagal memperbarui manpower: ' + err.message });
    }
  });

  // DELETE /api/manpower/:id - Delete manpower
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM manpower WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Manpower tidak ditemukan' });
      }
      res.json({ message: 'Manpower berhasil dihapus' });
    } catch (err) {
      console.error('Error deleting manpower:', err);
      res.status(500).json({ error: 'Gagal menghapus manpower: ' + err.message });
    }
  });

  return router;
}
