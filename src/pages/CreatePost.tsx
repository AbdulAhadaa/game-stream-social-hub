import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ImageIcon, VideoIcon, X } from "lucide-react";

const CreatePost = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    group_id: "",
    post_type: "text",
    tags: []
  });
  
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, post_type: 'image' }));
      } else if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, post_type: 'video' }));
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData(prev => ({ ...prev, post_type: 'text' }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.group_id) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and select a group",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let mediaUrl = null;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, selectedFile);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(uploadData.path);
          
        mediaUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          title: formData.title.trim(),
          content: formData.content.trim(),
          group_id: formData.group_id,
          author_id: user.id,
          post_type: formData.post_type as "text" | "image" | "video",
          media_url: mediaUrl,
          tags: formData.tags.length > 0 ? formData.tags : null
        });

      if (error) throw error;

      toast({
        title: "Post created",
        description: "Your post has been published successfully"
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
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
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <Select value={formData.group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        r/{group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Media (Optional)</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload">
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <span>
                        <ImageIcon className="h-4 w-4" />
                        Add Media
                      </span>
                    </Button>
                  </label>
                </div>
                
                {previewUrl && (
                  <div className="relative">
                    {formData.post_type === 'image' ? (
                      <img src={previewUrl} alt="Preview" className="max-w-full h-64 object-cover rounded" />
                    ) : (
                      <video src={previewUrl} controls className="max-w-full h-64 rounded" />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Publishing..." : "Publish Post"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;