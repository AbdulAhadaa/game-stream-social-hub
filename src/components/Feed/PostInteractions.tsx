import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown, MessageCircle, Share2, Copy, Twitter, Facebook } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostInteractionsProps {
  postId: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote?: number | null;
  onVoteChange?: () => void;
  postTitle?: string;
  postContent?: string;
}

const PostInteractions = ({ 
  postId, 
  upvotes, 
  downvotes, 
  commentCount, 
  userVote,
  onVoteChange,
  postTitle = "Check out this post on GameHub",
  postContent = ""
}: PostInteractionsProps) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes);
  const [currentUserVote, setCurrentUserVote] = useState(userVote);
  const [hasVoted, setHasVoted] = useState(false);

  // Fetch user's current vote on component mount
  useEffect(() => {
    const fetchUserVote = async () => {
      if (!user) return;
      
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
          setCurrentUserVote(data.vote_type);
          setHasVoted(true);
        }
      } catch (error) {
        console.error('Error fetching user vote:', error);
      }
    };
    
    fetchUserVote();
  }, [user, postId]);

  // Update local state when props change
  useEffect(() => {
    setCurrentUpvotes(upvotes);
    setCurrentDownvotes(downvotes);
  }, [upvotes, downvotes]);

  const handleVote = async (voteType: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote on posts",
        variant: "destructive"
      });
      return;
    }
    
    if (isVoting) return;
    
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
        
        // Update local state optimistically
        if (voteType === 1) {
          setCurrentUpvotes(prev => Math.max(0, prev - 1));
        } else {
          setCurrentDownvotes(prev => Math.max(0, prev - 1));
        }
        setCurrentUserVote(null);
        setHasVoted(false);
        
        toast({
          title: "Vote removed",
          description: "Your vote has been removed"
        });
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
        
        // Update local state optimistically
        if (currentUserVote === 1) {
          setCurrentUpvotes(prev => Math.max(0, prev - 1));
        } else if (currentUserVote === -1) {
          setCurrentDownvotes(prev => Math.max(0, prev - 1));
        }
        
        if (voteType === 1) {
          setCurrentUpvotes(prev => prev + 1);
        } else {
          setCurrentDownvotes(prev => prev + 1);
        }
        
        setCurrentUserVote(voteType);
        setHasVoted(true);
        
        toast({
          title: voteType === 1 ? "Upvoted!" : "Downvoted!",
          description: voteType === 1 ? "You upvoted this post" : "You downvoted this post"
        });
      }
      
      onVoteChange?.();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error voting",
        description: "Please try again",
        variant: "destructive"
      });
      
      // Revert optimistic updates on error
      setCurrentUpvotes(upvotes);
      setCurrentDownvotes(downvotes);
      setCurrentUserVote(userVote);
    } finally {
      setIsVoting(false);
    }
  };

  const getPostUrl = () => {
    return `${window.location.origin}/post/${postId}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getPostUrl());
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard"
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${postTitle}\n\n${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}`);
    const url = encodeURIComponent(getPostUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getPostUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: postContent.substring(0, 200),
          url: getPostUrl()
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
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
          className={`h-8 px-2 transition-colors ${
            currentUserVote === 1 
              ? 'text-primary bg-primary/10 hover:bg-primary/20' 
              : 'hover:text-primary hover:bg-primary/5'
          }`}
          onClick={() => handleVote(1)}
          disabled={isVoting}
        >
          <ChevronUp className={`h-4 w-4 ${isVoting ? 'animate-pulse' : ''}`} />
        </Button>
        <span className={`px-2 text-sm font-medium min-w-[2.5rem] text-center transition-colors ${
          score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {score > 0 ? `+${score}` : score}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 transition-colors ${
            currentUserVote === -1 
              ? 'text-destructive bg-destructive/10 hover:bg-destructive/20' 
              : 'hover:text-destructive hover:bg-destructive/5'
          }`}
          onClick={() => handleVote(-1)}
          disabled={isVoting}
        >
          <ChevronDown className={`h-4 w-4 ${isVoting ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {/* Comments */}
      <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground transition-colors">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">{commentCount}</span>
      </Button>

      {/* Enhanced Share */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Share</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={shareToTwitter}>
            <Twitter className="mr-2 h-4 w-4" />
            Share on Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToFacebook}>
            <Facebook className="mr-2 h-4 w-4" />
            Share on Facebook
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PostInteractions;