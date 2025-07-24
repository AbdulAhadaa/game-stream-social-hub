-- Add foreign key constraint between comments.author_id and profiles.user_id
ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_profiles_user_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;