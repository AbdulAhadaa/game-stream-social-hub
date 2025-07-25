import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MoreHorizontal, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PostInteractions from "@/components/Feed/PostInteractions";
import CommentSection from "@/components/Comments/CommentSection";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch post data
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(username, display_name, avatar_url),
          groups!posts_group_id_fkey(name)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!postId
  });

  // Fetch user's vote
  useEffect(() => {
    const fetchUserVote = async () => {
      if (!user || !postId) return;

      try {
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user vote:', error);
          return;
        }

        if (data) {
          setUserVote(data.vote_type as 1 | -1);
        }
      } catch (error) {
        console.error('Error fetching user vote:', error);
      }
    };

    fetchUserVote();
  }, [user, postId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const authorData = post.profiles || { username: 'Unknown', display_name: 'Unknown User', avatar_url: null };
  const groupData = post.groups || { name: 'unknown' };

  const renderMedia = () => {
    if (!post.media_url) return null;

    if (post.post_type === 'image') {
      return (
        <img
          src={post.media_url}
          alt={post.title}
          className="w-full max-h-[500px] object-contain rounded-md bg-muted"
        />
      );
    }

    if (post.post_type === 'video') {
      return (
        <div className="relative">
          <video
            src={post.media_url}
            className="w-full max-h-[500px] object-contain rounded-md"
            controls={isPlaying}
            poster=""
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full h-16 w-16"
                onClick={() => setIsPlaying(true)}
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate(-1)}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Post Card */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={authorData.avatar_url} />
                <AvatarFallback>{authorData.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{authorData.display_name || authorData.username}</span>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary">r/{groupData.name}</Badge>
                </div>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(post.created_at))} ago
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <h1 className="font-bold text-2xl mb-4">{post.title}</h1>
          
          {post.content && (
            <div className="text-base mb-4 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>
          )}

          {renderMedia()}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  #{tag.replace('#', '')}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-4">
          <PostInteractions 
            postId={post.id}
            upvotes={post.upvotes || 0}
            downvotes={post.downvotes || 0}
            commentCount={post.comment_count || 0}
            userVote={userVote}
            onVoteChange={() => {}}
            postTitle={post.title}
            postContent={post.content || ""}
          />
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <div className="mt-6">
        <CommentSection 
          postId={post.id}
          commentCount={post.comment_count || 0}
          onCommentCountChange={() => {}}
        />
      </div>
    </div>
  );
};

export default PostDetail;