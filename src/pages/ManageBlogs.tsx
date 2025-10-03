import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-typed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useImageGeneration } from '@/hooks/useImageGeneration';

export default function ManageBlogs() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateImage } = useImageGeneration();
  const [blogImage, setBlogImage] = useState<string>('');

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['manage-blogs', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_blogs')
        .select('*')
        .eq('event_id', eventId)
        .order('blog_number', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const generateBlog = async (prompt?: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog', {
        body: {
          eventName: event?.name,
          eventType: event?.event_type,
          prompt: prompt || customPrompt,
        },
      });

      if (error) throw error;
      setContent(data.content);
      
      // Generate a blog cover image
      const image = await generateImage(`Blog cover image for: ${data.content.substring(0, 200)}... Related to ${event?.event_type} event`, { event });
      if (image) {
        setBlogImage(image);
      }
      
      toast({ title: 'Blog generated successfully!' });
    } catch (error) {
      console.error('Error generating blog:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate blog',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const nextNumber = (blogs?.length || 0) + 1;
      const { error } = await supabase
        .from('event_blogs')
        .insert({
          event_id: eventId,
          title,
          content,
          blog_number: nextNumber,
          is_published: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Blog created successfully!' });
      setIsCreateOpen(false);
      setTitle('');
      setContent('');
      setCustomPrompt('');
      queryClient.invalidateQueries({ queryKey: ['manage-blogs', eventId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('event_blogs')
        .update(updates)
        .eq('id', editingBlog.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Blog updated successfully!' });
      setIsEditOpen(false);
      setEditingBlog(null);
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['manage-blogs', eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('event_blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Blog deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['manage-blogs', eventId] });
    },
  });

  const togglePublish = (blog: any) => {
    updateMutation.mutate({
      is_published: !blog.is_published,
    });
  };

  const openEdit = (blog: any) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setContent(blog.content);
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/event/${eventId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Blogs</h1>
            <p className="text-muted-foreground">Create and manage blogs for your event</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Blog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Blog</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>AI Prompt (Optional)</Label>
                  <Textarea
                    placeholder="Describe what you want the blog to be about..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => generateBlog()}
                    disabled={isGenerating}
                    className="mt-2"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
                
                {blogImage && (
                  <div>
                    <Label>Blog Cover Image</Label>
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img src={blogImage} alt="Blog cover" className="w-full h-48 object-cover" />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Blog title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Blog content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={15}
                  />
                </div>
                
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!title || !content || createMutation.isPending}
                  className="w-full"
                >
                  Create Blog
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {blogs && blogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No blogs created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {blogs?.map((blog) => (
              <Card key={blog.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{blog.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Blog #{blog.blog_number} • {blog.is_published ? 'Published' : 'Draft'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(blog)}
                      >
                        {blog.is_published ? (
                          <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" /> Publish</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(blog)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this blog?')) {
                            deleteMutation.mutate(blog.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">{blog.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Blog</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>AI Prompt (Optional)</Label>
                <Textarea
                  placeholder="Describe what you want the blog to be about..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => generateBlog()}
                  disabled={isGenerating}
                  className="mt-2"
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Regenerate with AI'}
                </Button>
              </div>
              
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="Blog title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Content</Label>
                <Textarea
                  placeholder="Blog content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                />
              </div>
              
              <Button
                onClick={() => updateMutation.mutate({ title, content })}
                disabled={!title || !content || updateMutation.isPending}
                className="w-full"
              >
                Update Blog
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
