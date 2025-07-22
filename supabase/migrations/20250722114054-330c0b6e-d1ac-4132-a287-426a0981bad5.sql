-- Add foreign key constraints to establish proper relationships
ALTER TABLE posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(user_id);

ALTER TABLE posts 
ADD CONSTRAINT posts_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES groups(id);

ALTER TABLE comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES profiles(user_id);

ALTER TABLE comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id);

ALTER TABLE votes 
ADD CONSTRAINT votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

ALTER TABLE votes 
ADD CONSTRAINT votes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id);

ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

ALTER TABLE group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES groups(id);

-- Create some sample groups to get started
INSERT INTO groups (name, description, member_count) VALUES
('gaming', 'General gaming discussions and news', 0),
('streaming', 'Live streaming tips, setups, and community', 0),
('esports', 'Competitive gaming and tournaments', 0),
('reviews', 'Game reviews and recommendations', 0),
('memes', 'Gaming memes and funny content', 0);