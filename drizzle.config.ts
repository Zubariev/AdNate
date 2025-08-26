import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Load .env from project root

export default {
  schema: './shared/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: `postgresql://postgres:${process.env.SUPABASE_KEY}@${process.env.SUPABASE_URL!.replace('https://', '').split('.')[0]}.supabase.co:5432/postgres`,
  },
} satisfies Config;
