-- Create a new bucket for assets images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the assets bucket
CREATE POLICY "Allow authenticated users to upload assets images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid() = owner
);

-- Allow authenticated users to select their own assets images
CREATE POLICY "Allow authenticated users to select their own assets images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets' AND
  auth.uid() = owner
);

-- Allow public to view assets images
CREATE POLICY "Allow public to view assets images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'assets'
);

-- Allow authenticated users to update their own assets images
CREATE POLICY "Allow authenticated users to update their own assets images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND
  auth.uid() = owner
);

-- Allow authenticated users to delete their own assets images
CREATE POLICY "Allow authenticated users to delete their own assets images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND
  auth.uid() = owner
);
