import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'db_aqpa_indonesia',
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, password FROM users');
    let count = 0;
    for (let row of res.rows) {
      // Check if it's already a hash (bcrypt hash usually starts with $2b$ or $2a$)
      if (!row.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(row.password, 10);
        await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, row.id]);
        count++;
        console.log(`Updated password for user ID: ${row.id}`);
      }
    }
    console.log(`Successfully hashed ${count} plaintext passwords.`);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
