-- Create a new bucket for logos images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the logos bucket
CREATE POLICY "Allow authenticated users to upload logos images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid() = owner
);

-- Allow authenticated users to select their own logos images
CREATE POLICY "Allow authenticated users to select their own logos images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid() = owner
);

-- Allow public to view logos images
CREATE POLICY "Allow public to view logos images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'logos'
);

-- Allow authenticated users to update their own logos images
CREATE POLICY "Allow authenticated users to update their own logos images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid() = owner
);

-- Allow authenticated users to delete their own logos images
CREATE POLICY "Allow authenticated users to delete their own logos images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' AND
  auth.uid() = owner
);
