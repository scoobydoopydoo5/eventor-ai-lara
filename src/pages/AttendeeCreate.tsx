import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowRight, FiLoader, FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';

const steps = ['Event Info', 'Your Details', 'Planning', 'Budget & Gifts'];

export default function AttendeeCreate() {
  const { eventId } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [event, setEvent] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      setEvent(data);
      setFormData({
        event_name: (data as any).name,
        event_type: (data as any).event_type,
        event_date: (data as any).event_date,
        event_time: (data as any).event_time,
        location: (data as any).location_name,
        theme: (data as any).theme_preferences,
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event details',
        variant: 'destructive',
      });
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(`/event/${eventId}/guests`);
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.attendee_name) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    toast({
      title: 'Creating your attendee plan...',
      description: 'AI is generating a personalized plan for you',
    });

    try {
      // Generate AI plan for attendee
      const { data: planData, error: planError } = await supabase.functions.invoke('generate-attendee-plan', {
        body: { 
          eventData: event,
          attendeeData: formData 
        }
      });

      if (planError) throw planError;

      // Store attendee plan
      const { error: insertError } = await (supabase as any)
        .from('attendee_plans')
        .insert({
          event_id: eventId,
          attendee_name: formData.attendee_name,
          plan_data: planData,
          outfit_suggestions: planData?.outfits || [],
          prep_checklist: planData?.prep || [],
          gift_ideas: planData?.gifts || [],
          budget_breakdown: planData?.budget || {},
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success!',
        description: 'Your attendee plan has been created',
      });

      navigate(`/attendee/${eventId}`);
    } catch (error) {
      console.error('Error creating attendee plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create attendee plan',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Event Information</h3>
            <div>
              <Label>Event Name</Label>
              <Input value={formData.event_name || ''} disabled />
            </div>
            <div>
              <Label>Event Type</Label>
              <Input value={formData.event_type || ''} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input value={formData.event_date || ''} disabled />
              </div>
              <div>
                <Label>Time</Label>
                <Input value={formData.event_time || 'TBA'} disabled />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={formData.location || 'TBA'} disabled />
            </div>
            {formData.theme && (
              <div>
                <Label>Theme</Label>
                <Input value={formData.theme} disabled />
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Your Details</h3>
            <div>
              <Label>Your Name *</Label>
              <Input
                value={formData.attendee_name || ''}
                onChange={(e) => setFormData({ ...formData, attendee_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
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
            <div>
              <Label>Dietary Restrictions</Label>
              <Input
                value={formData.dietary_restrictions || ''}
                onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
                placeholder="E.g., Vegetarian, Gluten-free"
              />
            </div>
            <div>
              <Label>Special Needs</Label>
              <Textarea
                value={formData.special_needs || ''}
                onChange={(e) => setFormData({ ...formData, special_needs: e.target.value })}
                placeholder="Any accessibility needs or special requirements"
                rows={3}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Planning Preferences</h3>
            <div>
              <Label>Outfit Style Preference</Label>
              <Select
                value={formData.outfit_style || ''}
                onValueChange={(value) => setFormData({ ...formData, outfit_style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                  <SelectItem value="themed">Themed/Costume</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transportation</Label>
              <Select
                value={formData.transportation || ''}
                onValueChange={(value) => setFormData({ ...formData, transportation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How will you get there?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own-car">Own Car</SelectItem>
                  <SelectItem value="carpool">Carpool</SelectItem>
                  <SelectItem value="public-transport">Public Transport</SelectItem>
                  <SelectItem value="rideshare">Rideshare/Taxi</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any other planning considerations"
                rows={3}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Budget & Gifts</h3>
            <div>
              <Label>Gift Budget (optional)</Label>
              <Input
                type="number"
                value={formData.gift_budget || ''}
                onChange={(e) => setFormData({ ...formData, gift_budget: e.target.value })}
                placeholder="Enter your budget for gifts"
              />
            </div>
            <div>
              <Label>Gift Preferences</Label>
              <Textarea
                value={formData.gift_preferences || ''}
                onChange={(e) => setFormData({ ...formData, gift_preferences: e.target.value })}
                placeholder="Any gift ideas or preferences you have in mind"
                rows={3}
              />
            </div>
            <div>
              <Label>Other Expenses Budget</Label>
              <Input
                type="number"
                value={formData.other_budget || ''}
                onChange={(e) => setFormData({ ...formData, other_budget: e.target.value })}
                placeholder="Budget for travel, outfit, etc."
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient">Create Attendee Plan</h1>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Plan Your Attendance</h2>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <Progress value={progress} className="mb-2" />

          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((step, idx) => (
              <span
                key={step}
                className={`transition-smooth ${
                  idx === currentStep ? 'text-primary font-medium' : ''
                }`}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        <Card className="p-6 shadow-card animate-slide-up">
          {renderStep()}
        </Card>

        <div className="flex items-center justify-between mt-6 animate-fade-in">
          <Button variant="outline" onClick={handleBack} disabled={creating}>
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleCreatePlan} disabled={creating} className="gap-2">
              {creating ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Plan
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Next
              <FiArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
