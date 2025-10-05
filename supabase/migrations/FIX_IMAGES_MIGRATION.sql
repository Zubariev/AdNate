-- ============================================================================
-- FIX FOR MISSING ELEMENT IMAGES
-- ============================================================================
-- This migration fixes the CASCADE constraint that was causing element_images
-- to be deleted when concepts were cleared.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
--
-- This will:
-- - Remove the CASCADE constraint from element_images.concept_id
-- - Make concept_id nullable (since concepts can be deleted)
-- - Preserve element_images even when concepts are cleared
-- ============================================================================

BEGIN;

-- Drop the existing foreign key constraint with CASCADE
ALTER TABLE element_images 
  DROP CONSTRAINT IF EXISTS element_images_concept_id_fkey;

-- Add back the foreign key without CASCADE
-- SET NULL means the concept_id will be set to NULL when the concept is deleted
-- This preserves the element_images
ALTER TABLE element_images 
  ADD CONSTRAINT element_images_concept_id_fkey 
  FOREIGN KEY (concept_id) 
  REFERENCES concepts(id) 
  ON DELETE SET NULL;

-- Make concept_id nullable since concepts can be deleted
ALTER TABLE element_images 
  ALTER COLUMN concept_id DROP NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify the fix was applied, run this query:
-- SELECT constraint_name, delete_rule 
-- FROM information_schema.referential_constraints 
-- WHERE constraint_name = 'element_images_concept_id_fkey';
-- 
-- The delete_rule should now be 'SET NULL' instead of 'CASCADE'
-- ============================================================================
