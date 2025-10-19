-- Create table for storing color assets associated with briefs
CREATE TABLE IF NOT EXISTS brief_colors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id uuid NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'Name not set',
    color_value text NOT NULL DEFAULT 'Color not set', -- Stores hex or rgb value
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE brief_colors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own brief colors
CREATE POLICY "Users can view their own brief colors" ON brief_colors
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policy to allow users to insert their own brief colors
CREATE POLICY "Users can insert their own brief colors" ON brief_colors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own brief colors
CREATE POLICY "Users can update their own brief colors" ON brief_colors
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create policy to allow users to delete their own brief colors
CREATE POLICY "Users can delete their own brief colors" ON brief_colors
  FOR DELETE
  USING (user_id = auth.uid());

-- Create index for faster lookups by brief_id
CREATE INDEX idx_brief_colors_brief_id ON brief_colors(brief_id);

-- Create index for faster lookups by user_id
CREATE INDEX idx_brief_colors_user_id ON brief_colors(user_id);

