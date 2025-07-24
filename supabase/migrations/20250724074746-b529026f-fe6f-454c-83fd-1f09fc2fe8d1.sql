-- Create storage policies for image uploads

-- Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for post-media bucket
CREATE POLICY "Post media are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own post media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for group-images bucket
CREATE POLICY "Group images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'group-images');

CREATE POLICY "Authenticated users can upload group images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'group-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own group images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'group-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own group images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'group-images' AND auth.uid()::text = (storage.foldername(name))[1]);