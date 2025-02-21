
import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_KEY must be set. Did you forget to provision a database?",
  );
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
