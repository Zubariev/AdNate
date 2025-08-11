
-- Create design_shares table for sharing functionality
CREATE TABLE design_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
    token VARCHAR(32) NOT NULL UNIQUE,
    permissions VARCHAR(10) NOT NULL CHECK (permissions IN ('view', 'edit')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on design_shares table
ALTER TABLE design_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for design_shares
CREATE POLICY "Users can manage shares for own designs" ON design_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM designs 
      WHERE designs.id = design_shares.design_id 
      AND designs.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX idx_design_shares_token ON design_shares(token);
CREATE INDEX idx_design_shares_design_id ON design_shares(design_id);
