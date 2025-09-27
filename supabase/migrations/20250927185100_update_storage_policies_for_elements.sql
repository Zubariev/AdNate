-- Create a new bucket for element images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('element-images', 'element-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the element-images bucket
CREATE POLICY "Allow authenticated users to upload element images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'element-images' AND
  auth.uid() = owner
);

-- Allow authenticated users to select their own element images
CREATE POLICY "Allow authenticated users to select their own element images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'element-images' AND
  auth.uid() = owner
);

-- Allow public to view element images
CREATE POLICY "Allow public to view element images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'element-images'
);

-- Allow authenticated users to update their own element images
CREATE POLICY "Allow authenticated users to update their own element images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'element-images' AND
  auth.uid() = owner
);

-- Allow authenticated users to delete their own element images
CREATE POLICY "Allow authenticated users to delete their own element images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'element-images' AND
  auth.uid() = owner
);
