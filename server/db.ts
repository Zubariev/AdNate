import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : undefined;

if (!supabase) {
  console.warn('[server/db] Supabase env vars not set; proceeding without Supabase client.');
}

export const db = process.env.DATABASE_URL
  ? drizzle(postgres(process.env.DATABASE_URL), { schema })
  : undefined as any;

if (!process.env.DATABASE_URL) {
  console.warn('[server/db] DATABASE_URL not set; using in-memory storage fallback.');
}
