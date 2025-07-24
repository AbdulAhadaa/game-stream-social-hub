-- Drop and recreate more permissive storage policies for post-media and group-images

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload group images" ON storage.objects;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can upload post media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload group images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'group-images' AND auth.role() = 'authenticated');