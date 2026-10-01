import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 8400;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'db_aqpa_indonesia',
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

// Test DB Connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Berhasil terhubung ke database PostgreSQL!');
  release();
});

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_negara_aqpa';

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email/Username dan Password harus diisi!' });
  }

  try {
    // Check if input is email or username
    const isEmail = email.includes('@');
    let queryText = '';
    
    if (isEmail) {
      queryText = `
        SELECT u.*, d.kode_divisi, d.nama_divisi as divisi, j.nama_jabatan as jabatan 
        FROM users u
        LEFT JOIN divisis d ON u.divisi_id = d.id
        LEFT JOIN jabatans j ON u.jabatan_id = j.id
        WHERE u.email = $1
      `;
    } else {
      queryText = `
        SELECT u.*, d.kode_divisi, d.nama_divisi as divisi, j.nama_jabatan as jabatan 
        FROM users u
        LEFT JOIN divisis d ON u.divisi_id = d.id
        LEFT JOIN jabatans j ON u.jabatan_id = j.id
        WHERE u.username = $1
      `;
    }

    const result = await pool.query(queryText, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email/Username tidak ditemukan!' });
    }

    const user = result.rows[0];

    // Cek apakah user aktif
    if (user.is_active === false) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.' });
    }

    // NOTE: Saat ini pengecekan password tanpa enkripsi (plain text) sesuai seeder.
    // Jika nanti passwordnya di-hash menggunakan bcrypt, gunakan bcrypt.compare().
    if (password !== user.password) {
      return res.status(401).json({ message: 'Password salah!' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, jabatan_id: user.jabatan_id }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    // Hilangkan field password sebelum dikirim ke frontend
    const { password: _, ...userData } = user;

    res.json({
      message: 'Login berhasil!',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server backend!' });
  }
});

// Users CRUD
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.username, u.email, u.is_active, 
             u.divisi_id, u.jabatan_id, 
             d.nama_divisi, j.nama_jabatan 
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

app.get('/api/divisis', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM divisis ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jabatans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jabatans ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, username, email, password, is_active, divisi_id, jabatan_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, username, email, password, is_active, divisi_id, jabatan_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, username, email, password, is_active !== undefined ? is_active : true, divisi_id || null, jabatan_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, email, password, is_active, divisi_id, jabatan_id } = req.body;
  try {
    let queryText = 'UPDATE users SET name=$1, username=$2, email=$3, is_active=$4, divisi_id=$5, jabatan_id=$6 WHERE id=$7 RETURNING *';
    let values = [name, username, email, is_active, divisi_id || null, jabatan_id || null, id];

    if (password) {
      queryText = 'UPDATE users SET name=$1, username=$2, email=$3, password=$4, is_active=$5, divisi_id=$6, jabatan_id=$7 WHERE id=$8 RETURNING *';
      values = [name, username, email, password, is_active, divisi_id || null, jabatan_id || null, id];
    }
    
    const result = await pool.query(queryText, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/toggle-status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const result = await pool.query('UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *', [is_active, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales Team API
app.get('/api/sales', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, j.nama_jabatan,
             COALESCE(
               json_agg(
                 json_build_object('id', c.id, 'no_akun', c.no_akun, 'nama_customer', c.nama_customer, 'site_kota', c.site_kota)
               ) FILTER (WHERE c.id IS NOT NULL), 
             '[]') AS assigned_customers
      FROM users u
      JOIN divisis d ON u.divisi_id = d.id
      JOIN jabatans j ON u.jabatan_id = j.id
      LEFT JOIN sales_customers sc ON u.id = sc.sales_id
      LEFT JOIN customers c ON sc.customer_id = c.id
      WHERE d.kode_divisi = 'SLS'
      GROUP BY u.id, j.nama_jabatan
      ORDER BY u.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customers API
app.get('/api/customers', async (req, res) => {
  try {
    const { sales_id } = req.query;
    
    let query = `
      SELECT c.*, 
             COALESCE(
               json_agg(
                 json_build_object('id', u.id, 'name', u.name)
               ) FILTER (WHERE u.id IS NOT NULL), 
             '[]') AS assigned_sales
      FROM customers c
      LEFT JOIN sales_customers sc ON c.id = sc.customer_id
      LEFT JOIN users u ON sc.sales_id = u.id
    `;
    let values = [];

    if (sales_id) {
      query += ` WHERE EXISTS (SELECT 1 FROM sales_customers sc2 WHERE sc2.customer_id = c.id AND sc2.sales_id = $1) `;
      values.push(sales_id);
    }

    query += `
      GROUP BY c.id
      ORDER BY c.id DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { no_akun, nama_customer, site_kota, sales_ids, status } = req.body;
  try {
    await pool.query('BEGIN');
    
    const custResult = await pool.query(
      'INSERT INTO customers (no_akun, nama_customer, site_kota, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [no_akun, nama_customer, JSON.stringify(site_kota), status || 'pending']
    );
    const newCust = custResult.rows[0];

    if (sales_ids && sales_ids.length > 0) {
      for (const salesId of sales_ids) {
        await pool.query(
          'INSERT INTO sales_customers (sales_id, customer_id) VALUES ($1, $2)',
          [salesId, newCust.id]
        );
      }
    }
    
    await pool.query('COMMIT');
    res.status(201).json(newCust);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { no_akun, nama_customer, site_kota, sales_ids } = req.body;
  try {
    await pool.query('BEGIN');
    
    const custResult = await pool.query(
      'UPDATE customers SET no_akun=$1, nama_customer=$2, site_kota=$3 WHERE id=$4 RETURNING *',
      [no_akun, nama_customer, JSON.stringify(site_kota), id]
    );
    const updatedCust = custResult.rows[0];

    // Reset relations
    await pool.query('DELETE FROM sales_customers WHERE customer_id = $1', [id]);
    
    if (sales_ids && sales_ids.length > 0) {
      for (const salesId of sales_ids) {
        await pool.query(
          'INSERT INTO sales_customers (sales_id, customer_id) VALUES ($1, $2)',
          [salesId, id]
        );
      }
    }
    
    await pool.query('COMMIT');
    res.json(updatedCust);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const custResult = await pool.query(
      'UPDATE customers SET status = $1 WHERE id = $2 RETURNING *',
      ['approved', id]
    );
    if (custResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(custResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ACTIVITIES API ---
app.get('/api/activities', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        c.nama_customer,
        u.name as user_name,
        j.nama_jabatan as user_jabatan,
        d.nama_divisi as user_divisi
      FROM daily_activity_sales a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN jabatans j ON u.jabatan_id = j.id
      LEFT JOIN divisis d ON u.divisi_id = d.id
      ORDER BY a.tanggal DESC, a.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Gagal mengambil data aktivitas' });
  }
});

app.post('/api/activities', async (req, res) => {
  const { user_id, customer_id, site_kota, jenis_aktivitas, ditemui, ditemui_lainnya, tanggal, catatan } = req.body;
  
  if (!user_id || !jenis_aktivitas || !tanggal) {
    return res.status(400).json({ error: 'User, jenis aktivitas, dan tanggal wajib diisi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO daily_activity_sales 
        (user_id, customer_id, site_kota, jenis_aktivitas, ditemui, ditemui_lainnya, tanggal, catatan) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        user_id, 
        customer_id || null, 
        site_kota || null, 
        jenis_aktivitas, 
        ditemui ? JSON.stringify(ditemui) : '[]', 
        ditemui_lainnya || null, 
        tanggal, 
        catatan || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Gagal mencatat aktivitas' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend API berjalan dengan lancar di http://localhost:${port}`);
});
