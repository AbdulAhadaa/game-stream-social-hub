import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Users, ImageIcon, X } from "lucide-react";

const CreateGroup = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive"
      });
      return;
    }

    // Check if group name already exists
    const { data: existingGroups } = await supabase
      .from('groups')
      .select('name')
      .eq('name', formData.name.trim().toLowerCase());

    if (existingGroups && existingGroups.length > 0) {
      toast({
        title: "Group name taken",
        description: "A group with this name already exists",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('group-images')
          .upload(fileName, selectedImage);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('group-images')
          .getPublicUrl(uploadData.path);
          
        imageUrl = urlData.publicUrl;
      }

      const { data: groupData, error } = await supabase
        .from('groups')
        .insert({
          name: formData.name.trim().toLowerCase(),
          description: formData.description.trim(),
          image_url: imageUrl,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically join the creator to the group
      await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id
        });

      toast({
        title: "Group created",
        description: "Your group has been created successfully"
      });
      
      navigate('/groups');
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error creating group",
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Create New Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name (e.g., valorant, minecraft, streamers)"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Group name will be displayed as "r/{formData.name.toLowerCase()}"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your group is about..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Group Image (Optional)</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <span>
                        <ImageIcon className="h-4 w-4" />
                        Add Image
                      </span>
                    </Button>
                  </label>
                </div>
                
                {previewUrl && (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="max-w-full h-48 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Group Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Choose a descriptive and unique name</li>
                  <li>• Keep the description clear and welcoming</li>
                  <li>• Add an appropriate image to help identify your group</li>
                  <li>• As the creator, you'll automatically become a member</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Creating..." : "Create Group"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/groups')}>
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

export default CreateGroup;