-- Create a table for storing brief assets (logos and images)
CREATE TABLE IF NOT EXISTS brief_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'image')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  image_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_brief_assets_brief_id ON brief_assets(brief_id);
CREATE INDEX IF NOT EXISTS idx_brief_assets_user_id ON brief_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_brief_assets_asset_type ON brief_assets(asset_type);

-- Enable RLS
ALTER TABLE brief_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own brief assets
CREATE POLICY "Users can view their own brief assets"
  ON brief_assets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own brief assets
CREATE POLICY "Users can insert their own brief assets"
  ON brief_assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own brief assets
CREATE POLICY "Users can update their own brief assets"
  ON brief_assets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own brief assets
CREATE POLICY "Users can delete their own brief assets"
  ON brief_assets
  FOR DELETE
  USING (auth.uid() = user_id);

