-- =============================================================================
-- Grant public access to reference images
-- =============================================================================

-- 1. Make the bucket public (if it isn't already)
-- Note: This makes all files publicly accessible via their URL without a token.
-- If you need finer-grained control, keep the bucket private and generate signed URLs.
UPDATE storage.buckets
SET public = true
WHERE id = 'reference-images';

-- =============================================================================
-- Drop Existing RLS Policies for Simpler Access Control
-- =============================================================================

-- Drop the old, more restrictive policies on storage.objects
DROP POLICY IF EXISTS "Users can upload reference images to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own reference images" ON storage.objects;

-- =============================================================================
-- Create New Simplified RLS Policies
-- =============================================================================

-- 1. Allow authenticated users to upload to the 'reference-images' bucket.
-- This policy is simpler and does not enforce a user-id-based folder structure.
-- It relies on the application logic to create unique, non-colliding file paths.
CREATE POLICY "Allow authenticated uploads to reference-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reference-images');

-- 2. Allow public, read-only access to all objects in the 'reference-images' bucket.
-- This is necessary for displaying the images in the application without requiring users to be logged in
-- or generating signed URLs for every image view.
CREATE POLICY "Allow public read access to reference-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'reference-images');


CREATE POLICY "Allow service uploads to reference-images"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'reference-images');


