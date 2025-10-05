-- ============================================================================
-- FIX FOR DESIGNS TRIGGER NULL DATA ERROR
-- ============================================================================
-- The create_design_from_brief() trigger was inserting NULL into designs.data
-- which violates the NOT NULL constraint. This fixes it by inserting an empty
-- JSONB object instead.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

BEGIN;

-- Update the trigger function to insert an empty JSONB object instead of NULL
CREATE OR REPLACE FUNCTION public.create_design_from_brief()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.designs(id, user_id, name, data)
  VALUES (
    gen_random_uuid(),
    NEW.user_id,
    NEW.projectname,
    '{}'::jsonb  -- Empty JSONB object instead of NULL
  );
  RETURN NEW;
END;
$$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, try creating a new brief. The trigger should work without
-- the NULL constraint violation error.
-- ============================================================================

