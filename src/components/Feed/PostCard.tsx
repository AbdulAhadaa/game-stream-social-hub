import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PostInteractions from "./PostInteractions";
import CommentSection from "../Comments/CommentSection";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content?: string;
    media_url?: string;
    post_type: 'image' | 'video' | 'text';
    tags?: string[];
    upvotes: number;
    downvotes: number;
    comment_count: number;
    created_at: string;
    profiles?: {
      username: string;
      display_name?: string;
      avatar_url?: string;
    } | null;
    groups?: {
      name: string;
    } | null;
    // Fallback for older structure
    author?: {
      username: string;
      display_name?: string;
      avatar_url?: string;
    };
    group?: {
      name: string;
    };
  };
  onVote?: (postId: string, voteType: 1 | -1) => void;
  userVote?: 1 | -1 | null;
}

const PostCard = ({ post, onVote, userVote }: PostCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  // Get author data from either profiles or author (for compatibility)
  const authorData = post.profiles || post.author || { username: 'Unknown', display_name: 'Unknown User' };
  const groupData = post.groups || post.group || { name: 'unknown' };

  const netScore = post.upvotes - post.downvotes;

  const handleVote = (voteType: 1 | -1) => {
    if (onVote) {
      onVote(post.id, voteType);
    }
  };

  const renderMedia = () => {
    if (!post.media_url) return null;

    if (post.post_type === 'image') {
      return (
        <img
          src={post.media_url}
          alt={post.title}
          className="w-full max-h-96 object-cover rounded-md"
        />
      );
    }

    if (post.post_type === 'video') {
      return (
        <div className="relative">
          <video
            src={post.media_url}
            className="w-full max-h-96 object-cover rounded-md"
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={authorData.avatar_url} />
              <AvatarFallback>{authorData.username?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorData.display_name || authorData.username}</span>
                <span className="text-muted-foreground text-xs">•</span>
                <Badge variant="secondary" className="text-xs">r/{groupData.name}</Badge>
              </div>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(post.created_at))} ago
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <h3 
          className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary transition-colors" 
          onClick={() => navigate(`/post/${post.id}`)}
        >
          {post.title}
        </h3>
        
        {post.content && (
          <p className="text-muted-foreground text-sm mb-3">{post.content}</p>
        )}

        {renderMedia()}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-0">
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
      
      <div className="px-6 pb-6">
        <CommentSection 
          postId={post.id}
          commentCount={post.comment_count || 0}
          onCommentCountChange={() => {}}
        />
      </div>
    </Card>
  );
};

export default PostCard;