import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "./schema";

let supabase: SupabaseClient | undefined;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function initializeDbAndSupabase(databaseUrl: string | undefined, supabaseUrl: string | undefined, supabaseKey: string | undefined) {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } else {
    console.warn('[server/db] Supabase env vars not set; proceeding without Supabase client.');
    supabase = undefined;
  }

  if (databaseUrl) {
    console.log('[server/db] Attempting to connect to DATABASE_URL:', databaseUrl);
    db = drizzle(postgres(databaseUrl), { schema });
  } else {
    console.warn('[server/db] DATABASE_URL not set; using in-memory storage fallback.');
    db = null;
  }
  return { db, supabase };
}

export { db, supabase };
