-- Supabase Storage Configuration SQL Script
-- Run this script in your Supabase SQL Editor after creating the storage bucket
-- Date: 2025-08-29
-- Description: Complete storage policies and security configuration for reference-images bucket

-- =============================================================================
-- STORAGE BUCKET CREATION
-- =============================================================================

-- Create the reference-images storage bucket (if not already created via dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reference-images',
    'reference-images', 
    false, -- Private bucket for security
    10485760, -- 10MB file size limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STORAGE ACCESS POLICIES
-- =============================================================================

-- Drop existing policies if they exist (for clean re-deployment)
DROP POLICY IF EXISTS "Users can upload reference images to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own reference images" ON storage.objects;

-- Policy 1: Upload Policy
-- Users can upload files only to their own folder structure: user_id/concept_id/filename
CREATE POLICY "Users can upload reference images to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'reference-images'
    AND auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND array_length(storage.foldername(name), 1) >= 2 -- Ensure proper folder structure
);

-- Policy 2: Select Policy  
-- Users can view/download files from their own folders
CREATE POLICY "Users can view their own reference images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'reference-images'
    AND auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Update Policy
-- Users can update metadata of their own files
CREATE POLICY "Users can update their own reference images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'reference-images'
    AND auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Delete Policy
-- Users can delete their own files
CREATE POLICY "Users can delete their own reference images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'reference-images'
    AND auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to validate file extensions (additional security layer)
CREATE OR REPLACE FUNCTION validate_image_file_extension(file_name TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if file has valid image extension
    RETURN file_name ~* '\.(jpg|jpeg|png|gif|webp|svg)$';
END;
$$;

-- Function to get storage usage stats
CREATE OR REPLACE FUNCTION get_user_storage_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    file_count BIGINT,
    total_size_bytes BIGINT,
    total_size_mb NUMERIC,
    latest_upload TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as file_count,
        SUM((metadata->>'size')::BIGINT) as total_size_bytes,
        ROUND(SUM((metadata->>'size')::BIGINT) / 1024.0 / 1024.0, 2) as total_size_mb,
        MAX(created_at) as latest_upload
    FROM storage.objects
    WHERE bucket_id = 'reference-images'
    AND (metadata->>'owner')::UUID = user_uuid;
END;
$$;

-- Function to clean up old temporary files (optional maintenance function)
CREATE OR REPLACE FUNCTION cleanup_old_temp_files(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
    file_record RECORD;
BEGIN
    -- Only allow authenticated users to run cleanup on their own files
    IF auth.role() != 'authenticated' OR auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Find and delete files older than specified days for the current user
    FOR file_record IN 
        SELECT name 
        FROM storage.objects 
        WHERE bucket_id = 'reference-images'
        AND (metadata->>'owner')::UUID = auth.uid()
        AND created_at < NOW() - (days_old || ' days')::INTERVAL
        AND name LIKE '%/temp/%' -- Only cleanup temp files
    LOOP
        DELETE FROM storage.objects 
        WHERE bucket_id = 'reference-images' 
        AND name = file_record.name
        AND (metadata->>'owner')::UUID = auth.uid();
        
        deleted_count := deleted_count + 1;
    END LOOP;

    RETURN deleted_count;
END;
$$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify bucket configuration
DO $$
DECLARE
    bucket_exists BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Check if bucket exists
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'reference-images' AND public = false
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
        RAISE NOTICE 'WARNING: reference-images bucket not found or is public!';
    ELSE
        RAISE NOTICE 'SUCCESS: reference-images bucket configured correctly';
    END IF;
    
    -- Check if policies are created
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE '%reference images%';
    
    IF policy_count < 4 THEN
        RAISE NOTICE 'WARNING: Expected 4 storage policies, found %', policy_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All % storage policies created', policy_count;
    END IF;
END $$;

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant execute permissions on utility functions to authenticated users
GRANT EXECUTE ON FUNCTION validate_image_file_extension(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_storage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_temp_files(INTEGER) TO authenticated;

-- =============================================================================
-- INDEXES FOR PERFORMANCE (Optional)
-- =============================================================================

-- Create indexes on storage.objects for better performance
-- Note: These may already exist depending on Supabase version
CREATE INDEX IF NOT EXISTS idx_objects_bucket_owner 
ON storage.objects (bucket_id, (metadata->>'owner'));

CREATE INDEX IF NOT EXISTS idx_objects_bucket_created 
ON storage.objects (bucket_id, created_at DESC);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Supabase Storage configuration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test upload functionality using the ImageUploader component';
    RAISE NOTICE '2. Verify signed URL generation works correctly';
    RAISE NOTICE '3. Check user storage stats: SELECT * FROM get_user_storage_stats();';
    RAISE NOTICE '4. Monitor storage usage and set up alerts if needed';
    RAISE NOTICE '';
    RAISE NOTICE 'Configuration includes:';
    RAISE NOTICE '- Private storage bucket with 10MB file limit';
    RAISE NOTICE '- User-isolated folder structure';
    RAISE NOTICE '- Complete CRUD policies for authenticated users';
    RAISE NOTICE '- Utility functions for monitoring and maintenance';
    RAISE NOTICE '- Performance indexes';
    RAISE NOTICE '';
END $$;