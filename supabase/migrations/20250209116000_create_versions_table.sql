
-- Create design_versions table for version control
CREATE TABLE design_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(design_id, version_number)
);

-- Enable RLS on design_versions table
ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for design_versions
CREATE POLICY "Users can view own design versions" ON design_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM designs 
      WHERE designs.id = design_versions.design_id 
      AND designs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for own designs" ON design_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM designs 
      WHERE designs.id = design_versions.design_id 
      AND designs.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_design_versions_design_id ON design_versions(design_id);
CREATE INDEX idx_design_versions_version_number ON design_versions(design_id, version_number);
