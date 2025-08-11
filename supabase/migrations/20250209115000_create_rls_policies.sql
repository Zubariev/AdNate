
-- Enable RLS on designs table
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own designs
CREATE POLICY "Users can view own designs" ON designs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own designs
CREATE POLICY "Users can insert own designs" ON designs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own designs
CREATE POLICY "Users can update own designs" ON designs
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own designs
CREATE POLICY "Users can delete own designs" ON designs
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to comments
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

-- Policy for authenticated users to insert comments
CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Policy for users to update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
