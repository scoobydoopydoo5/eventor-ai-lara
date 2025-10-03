import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-typed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { TextToSpeechButton } from '@/components/ui/TextToSpeechButton';
import { ArrowLeft, Calendar, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function EventBlogPost() {
  const { eventId, blogNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  const getUserIdentifier = () => {
    const stored = localStorage.getItem('user_identifier');
    if (stored) return stored;
    const newId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_identifier', newId);
    return newId;
  };

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', eventId, blogNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_blogs')
        .select('*')
        .eq('event_id', eventId)
        .eq('blog_number', parseInt(blogNumber || '0'))
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['blog-comments', blog?.id],
    queryFn: async () => {
      if (!blog) return [];
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_id', blog.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!blog,
  });

  const { data: reactions } = useQuery({
    queryKey: ['blog-reactions', blog?.id],
    queryFn: async () => {
      if (!blog) return { likes: 0, dislikes: 0, userReaction: null };
      const { data, error } = await supabase
        .from('blog_reactions')
        .select('*')
        .eq('blog_id', blog.id);

      if (error) throw error;

      const userIdentifier = getUserIdentifier();
      const userReaction = data.find(r => r.user_identifier === userIdentifier);

      return {
        likes: data.filter(r => r.reaction_type === 'like').length,
        dislikes: data.filter(r => r.reaction_type === 'dislike').length,
        userReaction: userReaction?.reaction_type || null,
      };
    },
    enabled: !!blog,
  });

  const reactionMutation = useMutation({
    mutationFn: async (reactionType: 'like' | 'dislike') => {
      if (!blog) return;
      const userIdentifier = getUserIdentifier();

      // Check if user already reacted
      const { data: existing } = await supabase
        .from('blog_reactions')
        .select('*')
        .eq('blog_id', blog.id)
        .eq('user_identifier', userIdentifier)
        .single();

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Remove reaction
          await supabase
            .from('blog_reactions')
            .delete()
            .eq('id', existing.id);
        } else {
          // Update reaction
          await supabase
            .from('blog_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existing.id);
        }
      } else {
        // Add new reaction
        await supabase
          .from('blog_reactions')
          .insert({
            blog_id: blog.id,
            user_identifier: userIdentifier,
            reaction_type: reactionType,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-reactions', blog?.id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!blog || !commentName.trim() || !commentText.trim()) return;

      await supabase
        .from('blog_comments')
        .insert({
          blog_id: blog.id,
          author_name: commentName,
          comment_text: commentText,
        });
    },
    onSuccess: () => {
      toast({ title: 'Comment added successfully' });
      setCommentName('');
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blog?.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Blog not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/event/${eventId}/blogs`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blogs
        </Button>

        <article>
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(blog.created_at), 'MMMM d, yyyy')}
              </div>
              <span>•</span>
              <span>By {blog.author_name}</span>
            </div>
            <TextToSpeechButton 
              text={blog.content} 
              variant="outline" 
              size="default"
            />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            {blog.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4">{paragraph}</p>
            ))}
          </div>

          {/* Reactions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Reaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={reactions?.userReaction === 'like' ? 'default' : 'outline'}
                  onClick={() => reactionMutation.mutate('like')}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Like ({reactions?.likes || 0})
                </Button>
                <Button
                  variant={reactions?.userReaction === 'dislike' ? 'default' : 'outline'}
                  onClick={() => reactionMutation.mutate('dislike')}
                  className="gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Dislike ({reactions?.dislikes || 0})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {comments?.map((comment) => (
                  <div key={comment.id} className="border-b pb-4">
                    <div className="font-semibold">{comment.author_name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                    <p>{comment.comment_text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  enableVoiceInput
                  enableEnhance
                />
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  enableVoiceInput
                  enableEnhance
                />
                <Button
                  onClick={() => commentMutation.mutate()}
                  disabled={!commentName.trim() || !commentText.trim() || commentMutation.isPending}
                >
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    </div>
  );
}
