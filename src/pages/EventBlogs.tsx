import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-typed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function EventBlogs() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['event-blogs', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_blogs')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_published', true)
        .order('blog_number', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Event Blogs
          </h1>
          <p className="text-muted-foreground">
            Read about the highlights and memorable moments from {event?.name}
          </p>
        </div>

        {blogs && blogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No blogs published yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs?.map((blog) => (
              <Card
                key={blog.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/event/${eventId}/blogs/${blog.blog_number}`)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(blog.created_at), 'MMM d, yyyy')}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {blog.content.substring(0, 150)}...
                  </p>
                  <Button variant="link" className="px-0 mt-2">
                    Read more →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
