import express from 'express';

export default function costProjectRoutes(pool) {
  const router = express.Router();

  // GET /api/cost-project?project_id=xxx
  router.get('/', async (req, res) => {
    try {
      const { project_id } = req.query;
      if (!project_id) {
        return res.status(400).json({ error: 'project_id is required' });
      }

      const query = `
        SELECT 
          c.id, 
          TO_CHAR(c.tanggal, 'YYYY-MM-DD') as tanggal, 
          c.kategori, 
          c.keterangan, 
          c.jumlah, 
          c.unit_id as dibebankan_ke,
          u.nama as nama_unit
        FROM project_costs c
        LEFT JOIN units u ON u.id = c.unit_id
        WHERE c.project_id = $1
        ORDER BY c.tanggal DESC, c.id DESC
      `;
      
      const result = await pool.query(query, [project_id]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching cost project:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/cost-project
  router.post('/', async (req, res) => {
    try {
      const { project_id, tanggal, kategori, keterangan, jumlah, dibebankan_ke } = req.body;
      
      const query = `
        INSERT INTO project_costs (project_id, tanggal, kategori, keterangan, jumlah, unit_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      
      const values = [
        project_id, 
        tanggal, 
        kategori, 
        keterangan, 
        jumlah, 
        dibebankan_ke || null // null means prorata
      ];
      
      const result = await pool.query(query, values);
      res.status(201).json({ id: result.rows[0].id, message: 'Success' });
    } catch (err) {
      console.error('Error saving cost project:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
