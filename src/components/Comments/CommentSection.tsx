import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import Comment from "./Comment";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  onCommentCountChange?: () => void;
}

const CommentSection = ({ postId, commentCount, onCommentCountChange }: CommentSectionProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!isExpanded) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!inner(username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [isExpanded, postId]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCommentSuccess = () => {
    fetchComments();
    onCommentCountChange?.();
    setReplyingTo(null);
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Organize comments into parent and child structure
  const parentComments = comments.filter(comment => !comment.parent_id);
  const childComments = comments.filter(comment => comment.parent_id);

  const getChildComments = (parentId: string) => {
    return childComments.filter(comment => comment.parent_id === parentId);
  };

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Comments Section */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment Form */}
            <CommentForm 
              postId={postId} 
              onSuccess={handleCommentSuccess}
              placeholder="Write a comment..."
            />

            {/* Comments List */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 bg-muted rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {parentComments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Parent Comment */}
                    <Comment
                      comment={comment}
                      onReply={handleReply}
                      onUpdate={fetchComments}
                    />

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="ml-11 pl-3 border-l-2 border-muted">
                        <CommentForm
                          postId={postId}
                          parentId={comment.id}
                          placeholder={`Reply to ${comment.profiles?.display_name || comment.profiles?.username || 'user'}...`}
                          onSuccess={handleCommentSuccess}
                          onCancel={handleCancelReply}
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Child Comments (Replies) */}
                    {getChildComments(comment.id).map((childComment) => (
                      <div key={childComment.id} className="ml-11 pl-3 border-l-2 border-muted">
                        <Comment
                          comment={childComment}
                          onUpdate={fetchComments}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentSection;