-- First, ensure we have the foreign key constraints with proper names
-- Add foreign key constraints to establish proper relationships

-- For posts table
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(user_id);

ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_group_id_fkey;
ALTER TABLE posts 
ADD CONSTRAINT posts_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES groups(id);

-- For comments table
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(user_id);

ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id);

-- For votes table
ALTER TABLE votes 
DROP CONSTRAINT IF EXISTS votes_user_id_fkey;
ALTER TABLE votes 
ADD CONSTRAINT votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

ALTER TABLE votes 
DROP CONSTRAINT IF EXISTS votes_post_id_fkey;
ALTER TABLE votes 
ADD CONSTRAINT votes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id);

-- For group_members table
ALTER TABLE group_members 
DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

ALTER TABLE group_members 
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES groups(id);