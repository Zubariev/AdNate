import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Fail fast with a clear message if env vars are missing at runtime
if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error('Supabase env vars missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Create a single instance; disable noisy auto refresh when backend is unreachable
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'design-studio-storage-key',
  },
});

export async function insertConcept(postId: string, concept: JSON) {
  try {
    const { data, error } = await supabase.rpc('insert_concept', {
      post_id: postId,
      concept: concept,
    });

  if (error) {
    console.error('Error inserting concept:', error);
  }

  return data;
  } catch (error) {
    console.error('Error inserting concept:', error);
  }
}

export async function insertBrief(postId: string, brief: JSON) {
  try {
    const { data, error } = await supabase.rpc('insert_brief', {
      post_id: postId,
      brief: brief,
    });

    if (error) {
      console.error('Error inserting brief:', error);
    }

    return data;
  } catch (error) {
    console.error('Error inserting brief:', error);
  }
}