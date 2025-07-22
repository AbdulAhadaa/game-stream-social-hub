import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown, MessageCircle, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PostInteractionsProps {
  postId: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: number | null;
  onVoteChange?: () => void;
}

const PostInteractions = ({ 
  postId, 
  upvotes, 
  downvotes, 
  commentCount, 
  userVote,
  onVoteChange 
}: PostInteractionsProps) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes);
  const [currentUserVote, setCurrentUserVote] = useState(userVote);

  const handleVote = async (voteType: number) => {
    if (!user || isVoting) return;
    
    setIsVoting(true);
    
    try {
      // If user clicked the same vote type, remove the vote
      if (currentUserVote === voteType) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Update local state
        if (voteType === 1) {
          setCurrentUpvotes(prev => prev - 1);
        } else {
          setCurrentDownvotes(prev => prev - 1);
        }
        setCurrentUserVote(null);
      } else {
        // Insert or update vote
        const { error } = await supabase
          .from('votes')
          .upsert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });
          
        if (error) throw error;
        
        // Update local state
        if (currentUserVote === 1) {
          setCurrentUpvotes(prev => prev - 1);
        } else if (currentUserVote === -1) {
          setCurrentDownvotes(prev => prev - 1);
        }
        
        if (voteType === 1) {
          setCurrentUpvotes(prev => prev + 1);
        } else {
          setCurrentDownvotes(prev => prev + 1);
        }
        
        setCurrentUserVote(voteType);
      }
      
      onVoteChange?.();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error voting",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Check out this post on GameHub",
        url: window.location.origin + `/posts/${postId}`
      });
    } catch (error) {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.origin + `/posts/${postId}`);
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard"
      });
    }
  };

  const score = currentUpvotes - currentDownvotes;

  return (
    <div className="flex items-center gap-1">
      {/* Voting */}
      <div className="flex items-center bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${currentUserVote === 1 ? 'text-primary bg-primary/10' : ''}`}
          onClick={() => handleVote(1)}
          disabled={isVoting}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
          {score > 0 ? `+${score}` : score}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${currentUserVote === -1 ? 'text-destructive bg-destructive/10' : ''}`}
          onClick={() => handleVote(-1)}
          disabled={isVoting}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments */}
      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">{commentCount}</span>
      </Button>

      {/* Share */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleShare}
        className="gap-1 text-muted-foreground"
      >
        <Share2 className="h-4 w-4" />
        <span className="text-sm hidden sm:inline">Share</span>
      </Button>
    </div>
  );
};

export default PostInteractions;