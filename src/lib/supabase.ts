import { createClient } from '@supabase/supabase-js';
import { InsertBrief, Concept, InsertConcept } from '../shared/schema.js'; // Import InsertConcept and add .js extension

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail fast with a clear message if env vars are missing at runtime
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('Supabase env vars missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Create a single instance; disable noisy auto refresh when backend is unreachable
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define a type for the data being inserted into the briefs table
type BriefInsertPayload = Omit<InsertBrief, 'id' | 'createdAt' | 'updatedAt' | 'shareId' | 'isPublic'>;

// Define a type for the data being inserted into the concepts table
type ConceptInsertPayload = Omit<InsertConcept, 'id' | 'createdAt' | 'updatedAt'> & { brief_id: string };

export async function insertConcept(briefId: string, concept: JSON) {
  try {
    const { data, error } = await supabase.rpc('insert_concept', {
      brief_id: briefId,
      concept: concept,
    });

    if (error) {
      console.error('Error inserting concept:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error inserting concept:', error);
    throw error;
  }
}

export async function insertBrief(briefData: BriefInsertPayload, conceptsData: Omit<Concept, 'id' | 'briefId' | 'createdAt' | 'updatedAt'>[]) {
  try {
    // Insert the brief first. The database will generate the ID.
    const { data: briefInsertData, error: briefInsertError } = await supabase
      .from('briefs')
      .insert(briefData)
      .select()
      .single();

    if (briefInsertError) {
      throw briefInsertError;
    }

    if (!briefInsertData) {
      throw new Error('Brief not returned after insertion.');
    }

    // Now insert the concepts, linking them to the new briefId
    if (conceptsData && conceptsData.length > 0) {
      const conceptsToInsert: ConceptInsertPayload[] = conceptsData.map(concept => ({
        ...concept,
        brief_id: briefInsertData.id, // Link concepts to the newly created brief's ID
      }));

      const { error: conceptsInsertError } = await supabase
        .from('concepts')
        .insert(conceptsToInsert);

      if (conceptsInsertError) {
        throw conceptsInsertError;
      }
    }

    return briefInsertData;
  } catch (error) {
    console.error('Error inserting brief and concepts:', error);
    throw error;
  }
}

export async function fetchBriefs() {
  // ... existing code ...
}