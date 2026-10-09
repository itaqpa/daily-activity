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

pool.query("ALTER TABLE user_permissions ADD COLUMN IF NOT EXISTS is_auto_assigned BOOLEAN DEFAULT FALSE;", (err, res) => {
  if (err) console.error(err);
  else console.log("Success auto assigned");
  pool.end();
});
