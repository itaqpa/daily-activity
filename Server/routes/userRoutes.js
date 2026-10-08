import express from 'express';
import bcrypt from 'bcrypt';

export default function userRoutes(pool) {
  const router = express.Router();

  // GET /api/users
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.name, u.username, u.email, u.is_active, 
               u.divisi_id, u.jabatan_id, 
               d.nama_divisi, j.nama_jabatan,
               COALESCE(
                 (SELECT json_agg(uar.jabatan_id) 
                  FROM user_additional_roles uar 
                  WHERE uar.user_id = u.id), '[]'::json
               ) as additional_roles,
               COALESCE(
                 (SELECT json_agg(p.nama_permission)
                  FROM user_permissions up
                  JOIN permissions p ON p.id = up.permission_id
                  WHERE up.user_id = u.id), '[]'::json
               ) as permissions
        FROM users u
        LEFT JOIN divisis d ON u.divisi_id = d.id
        LEFT JOIN jabatans j ON u.jabatan_id = j.id
        ORDER BY u.id ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper untuk sinkronisasi permissions
  const syncPermissions = async (client, userId, permissionsArray) => {
    if (permissionsArray && Array.isArray(permissionsArray)) {
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
      for (const perm of permissionsArray) {
        // Ensure permission exists
        let permRes = await client.query('SELECT id FROM permissions WHERE nama_permission = $1', [perm]);
        let permId;
        if (permRes.rows.length > 0) {
          permId = permRes.rows[0].id;
        } else {
          permRes = await client.query('INSERT INTO permissions (nama_permission) VALUES ($1) RETURNING id', [perm]);
          permId = permRes.rows[0].id;
        }
        // Insert link
        await client.query('INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, permId]);
      }
    }
  };

  // POST /api/users
  router.post('/', async (req, res) => {
    const { name, username, email, password, is_active, divisi_id, jabatan_id, additional_roles, permissions } = req.body;
    const client = await pool.connect();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query('BEGIN');
      const result = await client.query(
        'INSERT INTO users (name, username, email, password, is_active, divisi_id, jabatan_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, username, email, hashedPassword, is_active !== undefined ? is_active : true, divisi_id || null, jabatan_id || null]
      );
      const newUser = result.rows[0];

      if (additional_roles && Array.isArray(additional_roles)) {
        for (const roleId of additional_roles) {
          await client.query(
            'INSERT INTO user_additional_roles (user_id, jabatan_id) VALUES ($1, $2)',
            [newUser.id, roleId]
          );
        }
      }

      await syncPermissions(client, newUser.id, permissions);

      await client.query('COMMIT');
      res.status(201).json(newUser);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // PUT /api/users/:id
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, username, email, password, is_active, divisi_id, jabatan_id, additional_roles, permissions } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let queryText = 'UPDATE users SET name=$1, username=$2, email=$3, is_active=$4, divisi_id=$5, jabatan_id=$6 WHERE id=$7 RETURNING *';
      let values = [name, username, email, is_active, divisi_id || null, jabatan_id || null, id];

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        queryText = 'UPDATE users SET name=$1, username=$2, email=$3, password=$4, is_active=$5, divisi_id=$6, jabatan_id=$7 WHERE id=$8 RETURNING *';
        values = [name, username, email, hashedPassword, is_active, divisi_id || null, jabatan_id || null, id];
      }
      
      const result = await client.query(queryText, values);
      const updatedUser = result.rows[0];

      if (additional_roles && Array.isArray(additional_roles)) {
        await client.query('DELETE FROM user_additional_roles WHERE user_id = $1', [id]);
        for (const roleId of additional_roles) {
          await client.query(
            'INSERT INTO user_additional_roles (user_id, jabatan_id) VALUES ($1, $2)',
            [id, roleId]
          );
        }
      }

      await syncPermissions(client, id, permissions);

      await client.query('COMMIT');
      res.json(updatedUser);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // DELETE /api/users/:id
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/users/:id/toggle-status
  router.put('/:id/toggle-status', async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
      const result = await pool.query('UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *', [is_active, id]);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
