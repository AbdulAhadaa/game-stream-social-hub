import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Trash2, Reply, Edit } from "lucide-react";

interface CommentProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    parent_id: string | null;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  };
  onReply?: (parentId: string) => void;
  onUpdate?: () => void;
}

const Comment = ({ comment, onReply, onUpdate }: CommentProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);

  const authorData = comment.profiles || {
    username: 'unknown',
    display_name: 'Unknown User',
    avatar_url: null
  };

  const handleEdit = async () => {
    if (!user || !editContent.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate?.();
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error updating comment",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      onUpdate?.();
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error deleting comment",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthor = user?.id === comment.author_id;

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={authorData.avatar_url || undefined} />
        <AvatarFallback>{authorData.username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{authorData.display_name || authorData.username}</span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-muted-foreground text-xs">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px]"
              placeholder="Edit your comment..."
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleEdit}
                disabled={isLoading || !editContent.trim()}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply?.(comment.id)}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {isAuthor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Comment;