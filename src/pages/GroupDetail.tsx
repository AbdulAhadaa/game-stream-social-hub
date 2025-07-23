import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/Feed/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const GroupDetail = () => {
  const { user, loading } = useAuth();
  const { groupName } = useParams();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user && groupName) {
      fetchGroup();
      fetchGroupPosts();
      checkMembership();
    }
  }, [user, groupName]);

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('name', groupName)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setIsLoadingGroup(false);
    }
  };

  const fetchGroupPosts = async () => {
    try {
      const { data: groupData } = await supabase
        .from('groups')
        .select('id')
        .eq('name', groupName)
        .single();

      if (groupData) {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_author_id_fkey(username, display_name, avatar_url),
            groups!posts_group_id_fkey(name)
          `)
          .eq('group_id', groupData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching group posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const checkMembership = async () => {
    try {
      const { data: groupData } = await supabase
        .from('groups')
        .select('id')
        .eq('name', groupName)
        .single();

      if (groupData) {
        const { data } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupData.id)
          .eq('user_id', user.id)
          .single();

        setIsMember(!!data);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (error) throw error;

      setIsMember(true);
      toast({
        title: "Joined group",
        description: `You are now a member of r/${group.name}`
      });
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining group",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    setIsJoining(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsMember(false);
      toast({
        title: "Left group",
        description: `You have left r/${group.name}`
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error leaving group",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Group not found</p>
              <Link to="/groups">
                <Button>Back to Groups</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Group Header */}
        <div className="mb-6">
          <Link to="/groups" className="inline-flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Link>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {group.image_url ? (
                    <img 
                      src={group.image_url} 
                      alt={group.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold">r/{group.name}</h1>
                    <p className="text-muted-foreground">{group.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.member_count} members
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {isMember ? (
                    <>
                      <Link to="/create-post" state={{ selectedGroupId: group.id }}>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Post
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={handleLeaveGroup}
                        disabled={isJoining}
                      >
                        {isJoining ? "Leaving..." : "Leave"}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleJoinGroup}
                      disabled={isJoining}
                    >
                      {isJoining ? "Joining..." : "Join Group"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  No posts in this group yet. {isMember ? "Be the first to post!" : "Join the group to start posting!"}
                </p>
                {isMember && (
                  <Link to="/create-post" state={{ selectedGroupId: group.id }}>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Post
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;