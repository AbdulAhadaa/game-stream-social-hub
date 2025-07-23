import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/Feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Clock, Users, Zap } from "lucide-react";

const Trending = () => {
  const { user, loading } = useAuth();
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [popularGroups, setPopularGroups] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrendingPosts();
      fetchPopularGroups();
    }
  }, [user]);

  const fetchTrendingPosts = async () => {
    try {
      // Get posts with high engagement (upvotes - downvotes + comments)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(username, display_name, avatar_url),
          groups!posts_group_id_fkey(name)
        `)
        .order('upvotes', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Calculate engagement score and sort
      const postsWithScore = (data || []).map(post => ({
        ...post,
        engagement_score: (post.upvotes - post.downvotes) + (post.comment_count * 2)
      })).sort((a, b) => b.engagement_score - a.engagement_score);
      
      setTrendingPosts(postsWithScore);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchPopularGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .gte('member_count', 1)
        .order('member_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setPopularGroups(data || []);
    } catch (error) {
      console.error('Error fetching popular groups:', error);
    } finally {
      setIsLoadingGroups(false);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                Trending
              </h1>
              <p className="text-muted-foreground">
                Discover the hottest content in the gaming community
              </p>
            </div>

            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Hot Posts
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-2">
                  <Users className="h-4 w-4" />
                  Groups
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-6 mt-6">
                {isLoadingPosts ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : trendingPosts.length > 0 ? (
                  trendingPosts.map((post, index) => (
                    <div key={post.id} className="relative">
                      {index === 0 && (
                        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full z-10">
                          🔥 #1 Trending
                        </div>
                      )}
                      <PostCard post={post} />
                    </div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No trending posts yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-6 mt-6">
                {trendingPosts.slice().reverse().map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                {trendingPosts.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No recent posts available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="groups" className="space-y-4 mt-6">
                {isLoadingGroups ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : popularGroups.length > 0 ? (
                  popularGroups.map((group, index) => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">#{index + 1}</span>
                              <h3 className="font-semibold">r/{group.name}</h3>
                            </div>
                            {group.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {group.description}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">
                              {group.member_count} members
                            </p>
                          </div>
                          {group.image_url && (
                            <img 
                              src={group.image_url} 
                              alt={group.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No groups available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Trending Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hot Posts</span>
                    <span className="font-medium">{trendingPosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Popular Groups</span>
                    <span className="font-medium">{popularGroups.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Engagement</span>
                    <span className="font-medium">
                      {trendingPosts.reduce((acc, post) => acc + post.engagement_score, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Trending Topics</h3>
                <div className="space-y-2">
                  {['Gaming', 'Streaming', 'Esports', 'Reviews', 'Community'].map((topic, index) => (
                    <div key={topic} className="flex items-center gap-2 text-sm">
                      <span className="text-primary font-bold">#{index + 1}</span>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trending;