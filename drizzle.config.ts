import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Load .env from project root

const connectionString = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@${process.env.VITE_SUPABASE_URL!.replace('https://', '').split('.')[0]}.supabase.co:5432/postgres`;

// Parse the connection string to extract individual credentials
const url = new URL(connectionString);

export default {
  schema: './shared/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port, 10),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    ssl: true,
  },
} satisfies Config;
