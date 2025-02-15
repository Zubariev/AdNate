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
CREATE POLICY "Users can read own designs"
  ON public.designs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own designs
CREATE POLICY "Users can insert own designs"
  ON public.designs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own designs
CREATE POLICY "Users can update own designs"
  ON public.designs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own designs
CREATE POLICY "Users can delete own designs"
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

CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict do nothing;

-- Enable RLS on the storage.objects table
alter table storage.objects enable row level security;

-- Policy for reading design files
create policy "Anyone can read design files"
on storage.objects for select
using (bucket_id = 'designs');

-- Policy for inserting design files
create policy "Authenticated users can upload design files"
on storage.objects for insert
with check (
  bucket_id = 'designs' 
  and auth.role() = 'authenticated'
  and (select auth.uid()) = owner
);

-- Policy for updating design files
create policy "Users can update their own design files"
on storage.objects for update
using (
  bucket_id = 'designs'
  and auth.role() = 'authenticated'
  and (select auth.uid()) = owner
);

-- Policy for deleting design files
create policy "Users can delete their own design files"
on storage.objects for delete
using (
  bucket_id = 'designs'
  and auth.role() = 'authenticated'
  and (select auth.uid()) = owner
);

create policy "select"
on "public"."designs"
as PERMISSIVE
for SELECT
to public
using (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);

create policy "insert"
on "public"."designs"
as PERMISSIVE
for INSERT
to public
with check (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);

create policy "update"
on "public"."designs"
as PERMISSIVE
for UPDATE
to public
using (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
)
with check (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);

create policy "delete"
on "public"."designs"
as PERMISSIVE
for DELETE
to public
using (
  auth.role() = 'authenticated' 
  and auth.uid() = user_id
);