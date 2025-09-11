-- Migration: Add reference images table with Supabase Storage support
-- Date: 2025-08-29
-- Description: Creates table for storing reference images with concept IDs and file paths for Supabase Storage

-- Add columns to reference_images if they don't exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reference_images' AND column_name='image_path') THEN
        ALTER TABLE reference_images ADD COLUMN image_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reference_images' AND column_name='file_name') THEN
        ALTER TABLE reference_images ADD COLUMN file_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reference_images' AND column_name='file_size') THEN
        ALTER TABLE reference_images ADD COLUMN file_size BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reference_images' AND column_name='mime_type') THEN
        ALTER TABLE reference_images ADD COLUMN mime_type TEXT;
    END IF;
END
$$;

-- Create reference_images table
CREATE TABLE IF NOT EXISTS reference_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    brief_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    image_url TEXT DEFAULT '',
    image_path TEXT, -- Supabase Storage file path
    file_name TEXT, -- Original file name
    file_size BIGINT, -- File size in bytes
    mime_type TEXT, -- MIME type (image/jpeg, image/png, etc.)
    image_data JSONB DEFAULT '{}', -- Additional metadata
    prompt_used TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reference_images_user_id ON reference_images(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_brief_id ON reference_images(brief_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_concept_id ON reference_images(concept_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_created_at ON reference_images(created_at DESC);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_reference_images_user_brief ON reference_images(user_id, brief_id);

-- Enable Row Level Security (RLS)
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own reference images
CREATE POLICY "Users can view their own reference images" 
    ON reference_images FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reference images" 
    ON reference_images FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reference images" 
    ON reference_images FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reference images" 
    ON reference_images FOR DELETE 
    USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reference_images_updated_at
    BEFORE UPDATE ON reference_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create Supabase Storage bucket for reference images (if not exists)
-- Note: This needs to be run in Supabase dashboard or via SQL editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for reference-images bucket
-- Users can upload images to their own folder
CREATE POLICY "Users can upload reference images to their folder" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'reference-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own reference images
CREATE POLICY "Users can view their own reference images" 
    ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'reference-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own reference images
CREATE POLICY "Users can update their own reference images" 
    ON storage.objects FOR UPDATE 
    USING (
        bucket_id = 'reference-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own reference images
CREATE POLICY "Users can delete their own reference images" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'reference-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );