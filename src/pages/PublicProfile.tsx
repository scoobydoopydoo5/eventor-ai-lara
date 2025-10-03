import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-typed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FiArrowLeft, FiMail, FiPhone, FiGlobe, FiMapPin, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { DonateBalloonsDrawer } from '@/components/profile/DonateBalloonsDrawer';

export default function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const { userId } = useClerkAuth();
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      // Try to find by username first, then by user_id
      let profileData = null;
      
      const { data: usernameProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (usernameProfile) {
        profileData = usernameProfile;
      } else {
        // Try by user_id
        const { data: userIdProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', username)
          .maybeSingle();
        
        profileData = userIdProfile;
      }

      if (!profileData) {
        navigate('/dashboard');
        return;
      }

      // Check if profile is public; if private, keep user on page but mark as private
      if (profileData.profile_visibility !== 'public') {
        setIsPrivate(true);
      } else {
        setIsPrivate(false);
      }

      setProfile(profileData);

      // Load user's events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('clerk_user_id', profileData.clerk_user_id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      setEvents(eventsData || []);

      // Load balloons balance
      const { data: balloonsData } = await supabase
        .from('user_balloons')
        .select('balance')
        .eq('clerk_user_id', profileData.clerk_user_id)
        .single();

      setProfile({ ...profileData, balloons: balloonsData?.balance || 0 });
    } catch (error) {
      console.error('Error loading profile:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">Public Profile</h1>
        </div>
      </header>

      <div className={`container mx-auto px-4 py-8 max-w-4xl ${isPrivate ? 'pointer-events-none blur-sm' : ''}`}>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profile_picture_url} />
                <AvatarFallback className="text-2xl">
                  {profile.show_name && profile.email ? profile.email[0].toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                {profile.show_name && (
                  <div>
                    <h2 className="text-3xl font-bold">{profile.email?.split('@')[0]}</h2>
                    <p className="text-muted-foreground capitalize">{profile.user_role}</p>
                  </div>
                )}

                {profile.bio && (
                  <p className="text-foreground">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {profile.profile_type && (
                    <Badge variant="outline" className="capitalize">
                      {profile.profile_type}
                    </Badge>
                  )}
                  {profile.gender && (
                    <Badge variant="outline" className="capitalize">
                      {profile.gender}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    🎈 {profile.balloons} Balloons
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {profile.show_email && profile.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FiMail className="h-4 w-4" />
                      {profile.email}
                    </div>
                  )}
                  {profile.show_phone && profile.phone_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FiPhone className="h-4 w-4" />
                      {profile.phone_number}
                    </div>
                  )}
                  {profile.company_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FiMapPin className="h-4 w-4" />
                      {profile.company_name}
                    </div>
                  )}
                  {profile.company_website && (
                    <a 
                      href={profile.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <FiGlobe className="h-4 w-4" />
                      {profile.company_website}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Public Events ({events.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FiCalendar className="h-4 w-4" />
                        {format(new Date(event.event_date), 'PPP')}
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {event.event_type}
                      </p>
                      {event.location_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          📍 {event.location_name}{event.country && `, ${event.country}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {isPrivate && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-6 rounded-lg border bg-card shadow-md">
            <h2 className="text-xl font-semibold mb-2">This account is private</h2>
            <p className="text-muted-foreground">Follow or request access to view their profile details.</p>
          </div>
        </div>
      )}
    </div>
  );
}