import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/lib/supabase-typed';
import { toast } from '@/hooks/use-toast';
import { FiArrowLeft, FiSave, FiEye, FiLoader } from 'react-icons/fi';
import { useBalloons } from '@/hooks/useBalloons';
import { Cat } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { userId, balloons } = useClerkAuth();
  const { spendBalloons } = useBalloons();
  const { kawaiiColor } = useKawaiiTheme();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generatingBio, setGeneratingBio] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    bio: '',
    phoneNumber: '',
    userRole: 'attendee',
    gender: '',
    companyWebsite: '',
    profileType: 'personal',
    language: 'en',
    profileVisibility: 'public',
    showEmail: true,
    showPhone: true,
    showName: true,
  });

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_user_id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          companyName: data.company_name || '',
          bio: data.bio || '',
          phoneNumber: data.phone_number || '',
          userRole: data.user_role || 'attendee',
          gender: data.gender || '',
          companyWebsite: data.company_website || '',
          profileType: data.profile_type || 'personal',
          language: data.language || 'en',
          profileVisibility: data.profile_visibility || 'public',
          showEmail: data.show_email ?? true,
          showPhone: data.show_phone ?? true,
          showName: data.show_name ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const generateBio = async () => {
    const canSpend = await spendBalloons(1, 'AI bio generation');
    if (!canSpend) return;

    setGeneratingBio(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-bio', {
        body: {
          userInfo: {
            name: user?.emailAddresses[0]?.emailAddress?.split('@')[0],
            role: formData.userRole,
            company: formData.companyName,
            profileType: formData.profileType,
          }
        }
      });

      if (error) throw error;
      setFormData(prev => ({ ...prev, bio: data.bio }));
      toast({
        title: "Bio generated!",
        description: "AI has created a professional bio for you",
      });
    } catch (error) {
      console.error('Error generating bio:', error);
      toast({
        title: "Error",
        description: "Failed to generate bio",
        variant: "destructive",
      });
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          user_id: userId,
          clerk_user_id: userId,
          company_name: formData.companyName,
          bio: formData.bio,
          phone_number: formData.phoneNumber,
          user_role: formData.userRole,
          gender: formData.gender,
          company_website: formData.companyWebsite,
          profile_type: formData.profileType,
          language: formData.language,
          username: user?.username || user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || '',
          profile_visibility: formData.profileVisibility,
          show_email: formData.showEmail,
          show_phone: formData.showPhone,
          show_name: formData.showName,
          profile_picture_url: user?.imageUrl,
        })
        .eq('clerk_user_id', userId);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your profile</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Profile</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Balloon Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Cat size={80} mood="excited" color={kawaiiColor} />
                <div>
                  <p className="text-3xl font-bold">{balloons} 🎈</p>
                  <p className="text-sm text-muted-foreground">Available Balloons</p>
                </div>
              </div>
              <Button onClick={() => navigate('/pricing')}>Get More</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {user?.username && formData.profileVisibility === 'public' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/p/${user.username || user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0]}`)}
                >
                  <FiEye className="mr-2 h-4 w-4" />
                  Preview Public Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                value={user.emailAddresses[0]?.emailAddress || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={user?.username || user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Username is set by your account. Your public profile: /p/{user?.username || user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'username'}
              </p>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <div className="flex gap-2">
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  disabled={loadingProfile}
                  rows={4}
                  className="flex-1"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateBio}
                disabled={generatingBio || loadingProfile}
                className="mt-2"
              >
                {generatingBio ? (
                  <>
                    <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  '✨ AI Generate Bio (1 🎈)'
                )}
              </Button>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                disabled={loadingProfile}
              />
            </div>

            <div>
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter your company name"
                disabled={loadingProfile}
              />
            </div>

            <div>
              <Label htmlFor="companyWebsite">Company Website (Optional)</Label>
              <Input
                id="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                placeholder="https://yourcompany.com"
                disabled={loadingProfile}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userRole">Usual Role</Label>
                <Select
                  value={formData.userRole}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userRole: value }))}
                  disabled={loadingProfile}
                >
                  <SelectTrigger id="userRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="attendee">Attendee</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="speaker">Speaker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  disabled={loadingProfile}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profileType">Profile Type</Label>
                <Select
                  value={formData.profileType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, profileType: value }))}
                  disabled={loadingProfile}
                >
                  <SelectTrigger id="profileType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  disabled={loadingProfile}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profileVisibility">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile at /p/{user?.username || user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'username'}
                </p>
              </div>
              <Switch
                id="profileVisibility"
                checked={formData.profileVisibility === 'public'}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, profileVisibility: checked ? 'public' : 'private' }))
                }
                disabled={loadingProfile}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showName">Show Name</Label>
                <p className="text-sm text-muted-foreground">Display your name on public profile</p>
              </div>
              <Switch
                id="showName"
                checked={formData.showName}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showName: checked }))}
                disabled={loadingProfile}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showEmail">Show Email</Label>
                <p className="text-sm text-muted-foreground">Display your email on public profile</p>
              </div>
              <Switch
                id="showEmail"
                checked={formData.showEmail}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showEmail: checked }))}
                disabled={loadingProfile}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showPhone">Show Phone</Label>
                <p className="text-sm text-muted-foreground">Display your phone number on public profile</p>
              </div>
              <Switch
                id="showPhone"
                checked={formData.showPhone}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showPhone: checked }))}
                disabled={loadingProfile}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={loading || loadingProfile}
          className="w-full"
          size="lg"
        >
          <FiSave className="mr-2" />
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}