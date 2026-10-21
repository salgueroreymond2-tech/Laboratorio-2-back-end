import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Detección automática de SSL para Supabase y proveedores Cloud
const requiresSsl = Boolean(
  connectionString &&
    (connectionString.includes('supabase.co') ||
      connectionString.includes('pooler.supabase.com') ||
      connectionString.includes('sslmode=require') ||
      process.env.PGSSL === 'true' ||
      process.env.NODE_ENV === 'production')
);

const poolConfig = connectionString
  ? {
      connectionString,
      ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'gastos_compartidos',
      ...(process.env.PGSSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Error imprevisto en el cliente del Pool de PostgreSQL:', err);
});
