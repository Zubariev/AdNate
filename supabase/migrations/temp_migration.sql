CREATE TABLE IF NOT EXISTS public.designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own designs
CREATE POLICY IF NOT EXISTS "Users can read own designs"
  ON public.designs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own designs
CREATE POLICY IF NOT EXISTS "Users can insert own designs"
  ON public.designs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own designs
CREATE POLICY IF NOT EXISTS "Users can update own designs"
  ON public.designs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own designs
CREATE POLICY IF NOT EXISTS "Users can delete own designs"
  ON public.designs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_designs_updated_at ON public.designs;
CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict do nothing;

-- Skip the RLS on storage.objects since we don't have permissions

-- Policy for public designs
CREATE POLICY IF NOT EXISTS "select"
ON "public"."designs"
AS PERMISSIVE
FOR SELECT
TO public
USING (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);

CREATE POLICY IF NOT EXISTS "insert"
ON "public"."designs"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);

CREATE POLICY IF NOT EXISTS "update"
ON "public"."designs"
AS PERMISSIVE
FOR UPDATE
TO public
USING (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
)
WITH CHECK (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);

CREATE POLICY IF NOT EXISTS "delete"
ON "public"."designs"
AS PERMISSIVE
FOR DELETE
TO public
USING (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);
