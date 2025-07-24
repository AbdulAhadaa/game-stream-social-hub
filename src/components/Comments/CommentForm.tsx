import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

const CommentForm = ({ 
  postId, 
  parentId = null, 
  placeholder = "Write a comment...", 
  onSuccess, 
  onCancel,
  autoFocus = false 
}: CommentFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          post_id: postId,
          author_id: user.id,
          parent_id: parentId
        });

      if (error) throw error;

      setContent("");
      onSuccess?.();
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error posting comment",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.user_metadata?.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          autoFocus={autoFocus}
        />
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            size="sm"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
          
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CommentForm;