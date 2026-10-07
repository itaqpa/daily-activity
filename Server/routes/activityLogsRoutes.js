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

// GET all activity logs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.name as user_name, j.nama_jabatan as user_role
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN jabatans j ON u.jabatan_id = j.id
      ORDER BY a.created_at DESC
      LIMIT 500
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to log activity (to be imported in other routes)
export const logActivity = async (userId, action, entityType, entityId, description, details = null) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, description, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export default router;
