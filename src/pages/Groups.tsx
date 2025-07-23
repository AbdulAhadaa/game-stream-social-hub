import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, Search, TrendingUp } from "lucide-react";

const Groups = () => {
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchUserGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setUserGroups(data?.map(gm => gm.group_id) || []);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id
        });
      
      if (error) throw error;
      
      setUserGroups(prev => [...prev, groupId]);
      toast({
        title: "Joined group",
        description: "You have successfully joined the group"
      });
      
      // Refresh groups to update member count
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining group",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setUserGroups(prev => prev.filter(id => id !== groupId));
      toast({
        title: "Left group",
        description: "You have left the group"
      });
      
      // Refresh groups to update member count
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error leaving group",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold">Gaming Groups</h1>
                <p className="text-muted-foreground">Discover and join gaming communities</p>
              </div>
              <Link to="/groups/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Group
                </Button>
              </Link>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
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
            ) : (
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <Link key={group.id} to={`/groups/${group.name}`} className="block">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">r/{group.name}</h3>
                              {group.member_count > 100 && (
                                <Badge variant="secondary" className="gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-muted-foreground mb-3">{group.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {group.member_count} members
                              </span>
                              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            {userGroups.includes(group.id) ? (
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleLeaveGroup(group.id);
                                }}
                              >
                                Leave
                              </Button>
                            ) : (
                              <Button onClick={(e) => {
                                e.preventDefault();
                                handleJoinGroup(group.id);
                              }}>
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                
                {filteredGroups.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">
                        {searchTerm ? "No groups found matching your search" : "No groups available"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="lg:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Groups</CardTitle>
              </CardHeader>
              <CardContent>
                {userGroups.length > 0 ? (
                  <div className="space-y-2">
                    {groups
                      .filter(group => userGroups.includes(group.id))
                      .map((group) => (
                        <div key={group.id} className="flex items-center justify-between">
                          <span className="font-medium">r/{group.name}</span>
                          <Badge variant="outline">{group.member_count}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">You haven't joined any groups yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/groups/create">
                  <Button className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </Link>
                <Link to="/create-post">
                  <Button variant="outline" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Create Post
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;