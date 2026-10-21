import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  console.log('=================================================');
  console.log('  Ejecutando Migraciones de Base de Datos');
  console.log('=================================================');

  const client = await pool.connect();
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`⏳ Aplicando migración: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✅ Migración ${file} aplicada exitosamente.`);
    }

    console.log('=================================================');
    console.log('🎉 Todas las migraciones se ejecutaron con éxito.');
    console.log('=================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando migraciones:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
