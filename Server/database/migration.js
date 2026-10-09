import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;
const databaseDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(databaseDirectory, '../..');

dotenv.config({ path: path.join(projectDirectory, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_DATABASE || 'db_aqpa_indonesia',
  user: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const files = (await readdir(databaseDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    const { rows: appliedRows } = await client.query(
      'SELECT filename FROM schema_migrations',
    );
    const applied = new Set(appliedRows.map((row) => row.filename));
    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      console.log('Database sudah up to date.');
      return;
    }

    for (const filename of pending) {
      const sql = await readFile(path.join(databaseDirectory, filename), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename],
        );
        await client.query('COMMIT');
        console.log(`Migration berhasil: ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration gagal: ${filename}\n${error.message}`, {
          cause: error,
        });
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
