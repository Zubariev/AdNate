-- Create element_images table for storing individual elements generated from concepts
CREATE TABLE IF NOT EXISTS element_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brief_id uuid NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    element_id text NOT NULL,
    image_url text NOT NULL,
    image_path text,
    file_name text,
    file_size integer,
    mime_type text,
    image_data jsonb,
    prompt_used text NOT NULL,
    image_type text NOT NULL, -- 'original' or 'transparent'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE element_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own element images
CREATE POLICY "Users can view their own element images" ON element_images
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policy to allow users to insert their own element images
CREATE POLICY "Users can insert their own element images" ON element_images
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own element images
CREATE POLICY "Users can update their own element images" ON element_images
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy to allow users to delete their own element images
CREATE POLICY "Users can delete their own element images" ON element_images
  FOR DELETE
  USING (user_id = auth.uid());

-- Create index on brief_id for faster lookups
CREATE INDEX IF NOT EXISTS element_images_brief_id_idx ON element_images(brief_id);

-- Create index on concept_id for faster lookups
CREATE INDEX IF NOT EXISTS element_images_concept_id_idx ON element_images(concept_id);

-- Create index on element_id for faster lookups
CREATE INDEX IF NOT EXISTS element_images_element_id_idx ON element_images(element_id);
