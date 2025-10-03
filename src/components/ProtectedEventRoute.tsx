import { useEffect, useState, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/lib/supabase-typed';
import { EventPasswordModal } from './EventPasswordModal';
import { useToast } from '@/hooks/use-toast';

interface ProtectedEventRouteProps {
  children: ReactNode;
  allowPublic?: boolean;
}

export function ProtectedEventRoute({ children, allowPublic = false }: ProtectedEventRouteProps) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userId, isLoading } = useClerkAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [eventId, userId, isLoading]);

  const checkAccess = async () => {
    if (isLoading) return;
    
    try {
      const { data: eventData, error } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !eventData) {
        navigate('/dashboard');
        return;
      }

      setEvent(eventData);

      // Check if already granted access via session
      const sessionAccess = sessionStorage.getItem(`event_access_${eventId}`);
      if (sessionAccess === 'granted') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // If user is authenticated
      if (userId) {
        // Allow access if user owns the event OR the event was created in guest mode (no owner)
        const ownerId = (eventData as any).clerk_user_id;
        if (ownerId === userId || !ownerId) {
          setHasAccess(true);
        } else {
          // User doesn't own this event, redirect
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this event',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
      } else {
        // Guest user
        if (allowPublic) {
          setHasAccess(true);
        } else if ((eventData as any).password) {
          // Password protected
          setShowPasswordModal(true);
        } else {
          // No password, allow access
          setHasAccess(true);
        }
      }
    } catch (error) {
      console.error('Error checking access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (event?.password === password) {
      sessionStorage.setItem(`event_access_${eventId}`, 'granted');
      setHasAccess(true);
      setShowPasswordModal(false);
    } else {
      toast({
        title: 'Incorrect Password',
        description: 'The password you entered is incorrect',
        variant: 'destructive',
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <EventPasswordModal
          open={showPasswordModal}
          onClose={() => navigate('/dashboard')}
          onSubmit={handlePasswordSubmit}
        />
        {!showPasswordModal && (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
