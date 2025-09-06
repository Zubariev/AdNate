import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "@shared/schema";

let supabase: SupabaseClient | undefined;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function initializeDbAndSupabase(supabaseUrl: string | undefined, supabaseKey: string | undefined, supabaseServiceKey: string | undefined, databaseUrlOverride?: string) {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('[server/db] Supabase client initialized with service key.');
  } else {
    console.warn('[server/db] Supabase URL or Service Key not set; proceeding without Supabase client.');
    supabase = undefined;
  }

  if (databaseUrlOverride) {
    console.log('[server/db] Attempting to connect to Supabase project using DATABASE_URL:', databaseUrlOverride);
    db = drizzle(postgres(databaseUrlOverride), { schema });
  } else if (supabaseUrl && supabaseKey) {
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    const databaseUrl = `postgresql://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres`;
    console.log('[server/db] Attempting to connect to Supabase project using constructed URL:', supabaseUrl);
    db = drizzle(postgres(databaseUrl), { schema });
  } else {
    console.warn('[server/db] Supabase URL or Key not set; using in-memory storage fallback.');
    db = null;
  }
  return { db, supabase };
}
