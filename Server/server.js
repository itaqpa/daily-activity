import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/userRoutes.js';

// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 8400;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
        SELECT u.*, d.kode_divisi, d.nama_divisi as divisi, j.nama_jabatan as jabatan,
               COALESCE(
                 (SELECT json_agg(json_build_object('id', aj.id, 'nama_jabatan', aj.nama_jabatan))
                  FROM user_additional_roles uar
                  JOIN jabatans aj ON uar.jabatan_id = aj.id
                  WHERE uar.user_id = u.id), '[]'::json
               ) as additional_roles_data,
               COALESCE(
                 (SELECT json_agg(p.nama_permission)
                  FROM user_permissions up
                  JOIN permissions p ON p.id = up.permission_id
                  WHERE up.user_id = u.id), '[]'::json
               ) as permissions
        FROM users u
        LEFT JOIN divisis d ON u.divisi_id = d.id
        LEFT JOIN jabatans j ON u.jabatan_id = j.id
        WHERE u.email = $1
      `;
    } else {
      queryText = `
        SELECT u.*, d.kode_divisi, d.nama_divisi as divisi, j.nama_jabatan as jabatan,
               COALESCE(
                 (SELECT json_agg(json_build_object('id', aj.id, 'nama_jabatan', aj.nama_jabatan))
                  FROM user_additional_roles uar
                  JOIN jabatans aj ON uar.jabatan_id = aj.id
                  WHERE uar.user_id = u.id), '[]'::json
               ) as additional_roles_data,
               COALESCE(
                 (SELECT json_agg(p.nama_permission)
                  FROM user_permissions up
                  JOIN permissions p ON p.id = up.permission_id
                  WHERE up.user_id = u.id), '[]'::json
               ) as permissions
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

// Users API Route (Modular)
app.use('/api/users', userRoutes(pool));

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

app.post('/api/users/bulk', async (req, res) => {
  const users = req.body;
  try {
    await pool.query('BEGIN');
    
    for (const u of users) {
      const { name, username, email, password, is_active, divisi_id, jabatan_id, additional_roles } = u;
      
      if (!username) continue; // Wajib ada username
      
      let userId;
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 LIMIT 1', [username]);
      
      if (existingUser.rows.length > 0) {
        // Update user
        const updateParams = [name, email, is_active, divisi_id || null, jabatan_id || null, username];
        let queryStr = 'UPDATE users SET name=$1, email=$2, is_active=$3, divisi_id=$4, jabatan_id=$5';
        
        if (password) {
          queryStr += ', password=$7 WHERE username=$6 RETURNING id';
          updateParams.push(password); // Catatan: Sebaiknya di-hash jika ada sistem hashing (bcrypt)
        } else {
          queryStr += ' WHERE username=$6 RETURNING id';
        }
        
        const updated = await pool.query(queryStr, updateParams);
        userId = updated.rows[0].id;
      } else {
        // Insert user
        const inserted = await pool.query(
          'INSERT INTO users (name, username, email, password, is_active, divisi_id, jabatan_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [name, username, email, password || 'password123', is_active !== undefined ? is_active : true, divisi_id || null, jabatan_id || null]
        );
        userId = inserted.rows[0].id;
      }
      
      if (additional_roles && Array.isArray(additional_roles) && additional_roles.length > 0) {
        await pool.query('DELETE FROM user_additional_roles WHERE user_id = $1', [userId]);
        for (const roleId of additional_roles) {
          if (!isNaN(roleId)) {
            await pool.query(
              'INSERT INTO user_additional_roles (user_id, jabatan_id) VALUES ($1, $2)',
              [userId, roleId]
            );
          }
        }
      }
    }
    
    await pool.query('COMMIT');
    res.status(201).json({ message: 'Bulk import users successful' });
  } catch (err) {
    await pool.query('ROLLBACK');
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
  const { no_akun, nama_customer, site_kota, sales_ids, status, note } = req.body;
  try {
    await pool.query('BEGIN');
    
    const custResult = await pool.query(
      'INSERT INTO customers (no_akun, nama_customer, site_kota, status, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [no_akun, nama_customer, JSON.stringify(site_kota), status || 'pending', note || null]
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

app.post('/api/customers/bulk', async (req, res) => {
  const customers = req.body;
  try {
    await pool.query('BEGIN');
    
    for (const cust of customers) {
      const { no_akun, nama_customer, site_kota, sales_ids, status, note } = cust;
      
      let custId;
      
      if (no_akun) {
        // Cek apakah no_akun sudah ada
        const existingCust = await pool.query('SELECT id FROM customers WHERE no_akun = $1 LIMIT 1', [no_akun]);
        
        if (existingCust.rows.length > 0) {
          // Update data jika sudah ada
          const updated = await pool.query(
            'UPDATE customers SET nama_customer=$1, site_kota=$2, status=$3, note=$4, updated_at=CURRENT_TIMESTAMP WHERE no_akun=$5 RETURNING id',
            [nama_customer, JSON.stringify(site_kota || []), status || 'approved', note || null, no_akun]
          );
          custId = updated.rows[0].id;
          
          // Hapus relasi sales lama sebelum insert yang baru
          await pool.query('DELETE FROM sales_customers WHERE customer_id = $1', [custId]);
        }
      }
      
      // Jika no_akun tidak ada / customer belum ada, insert baru
      if (!custId) {
        const inserted = await pool.query(
          'INSERT INTO customers (no_akun, nama_customer, site_kota, status, note) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [no_akun, nama_customer, JSON.stringify(site_kota || []), status || 'approved', note || null]
        );
        custId = inserted.rows[0].id;
      }

      // Masukkan relasi sales_customers
      if (sales_ids && sales_ids.length > 0) {
        for (const salesId of sales_ids) {
          await pool.query(
            'INSERT INTO sales_customers (sales_id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [salesId, custId]
          );
        }
      }
    }
    
    await pool.query('COMMIT');
    res.status(201).json({ message: 'Bulk insert success' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { no_akun, nama_customer, site_kota, sales_ids, note } = req.body;
  try {
    await pool.query('BEGIN');
    
    const custResult = await pool.query(
      'UPDATE customers SET no_akun=$1, nama_customer=$2, site_kota=$3, note=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5 RETURNING *',
      [no_akun, nama_customer, JSON.stringify(site_kota), note || null, id]
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
