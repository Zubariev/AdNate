-- ============================================================================
-- FIX FOR SELECTED_CONCEPTS TABLE MISSING COLUMNS
-- ============================================================================
-- The selected_concepts table is missing user_id, created_at, and updated_at
-- columns that are defined in the schema but not in the database.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

BEGIN;

-- Add missing user_id column
ALTER TABLE selected_concepts 
  ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Add foreign key constraint for user_id
ALTER TABLE selected_concepts 
  DROP CONSTRAINT IF EXISTS selected_concepts_user_id_fkey;
  
ALTER TABLE selected_concepts 
  ADD CONSTRAINT selected_concepts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Add missing created_at column
ALTER TABLE selected_concepts 
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;

-- Add missing updated_at column
ALTER TABLE selected_concepts 
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- Remove the default value from user_id (it was only needed for adding the column to existing rows)
ALTER TABLE selected_concepts 
  ALTER COLUMN user_id DROP DEFAULT;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS selected_concepts_user_id_idx ON selected_concepts(user_id);

-- Enable RLS on selected_concepts if not already enabled
ALTER TABLE selected_concepts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for selected_concepts
DROP POLICY IF EXISTS "Users can view their own selected concepts" ON selected_concepts;
CREATE POLICY "Users can view their own selected concepts" 
  ON selected_concepts FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own selected concepts" ON selected_concepts;
CREATE POLICY "Users can insert their own selected concepts" 
  ON selected_concepts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own selected concepts" ON selected_concepts;
CREATE POLICY "Users can update their own selected concepts" 
  ON selected_concepts FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own selected concepts" ON selected_concepts;
CREATE POLICY "Users can delete their own selected concepts" 
  ON selected_concepts FOR DELETE 
  USING (auth.uid() = user_id);

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify the fix, run this query:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'selected_concepts'
-- ORDER BY ordinal_position;
--
-- You should see: id, user_id, concept_id, brief_id, selected_at, created_at, updated_at
-- ============================================================================

