import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { WelcomeTour } from '@/components/WelcomeTour';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/lib/supabase-typed';
import { toast } from '@/hooks/use-toast';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { VIPAccessModal } from '@/components/VIPAccessModal';
import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { CreditCard, IceCream } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';
import { Step } from 'react-joyride';

const pricingSteps: Step[] = [
  {
    target: '[data-tour="pricing-plans"]',
    content: 'Choose a balloon bundle that fits your needs. More balloons = more AI features!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="current-balance"]',
    content: 'Keep track of your balloon balance here.',
  },
  {
    target: '[data-tour="earn-balloons"]',
    content: 'You can also earn free balloons by completing events and tasks!',
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { userId, balloons } = useClerkAuth();
  const { isSignedIn } = useUser();
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const { kawaiiColor } = useKawaiiTheme();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handlePurchase = (planName: string) => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase balloons",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Coming soon!",
      description: `${planName} purchase will be available soon. Payment integration coming!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeTour steps={pricingSteps} />
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Pricing & Plans</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/dashboard" />
            ) : (
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userId && (
          <Card className="mb-8 max-w-md mx-auto" data-tour="current-balance">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <IceCream size={100} mood="excited" color={kawaiiColor} />
              </div>
              <p className="text-3xl font-bold mb-2">{balloons} 🎈</p>
              <p className="text-muted-foreground">Your current balloon balance</p>
            </CardContent>
          </Card>
        )}

        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <CreditCard size={120} mood="blissful" color={kawaiiColor} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Get More Balloons</h2>
          <p className="text-muted-foreground">
            Use balloons to access AI features and unlock premium functionality
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" data-tour="pricing-plans">
            {plans?.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                {plan.daily_balloons > 0 && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                    SUBSCRIPTION
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.daily_balloons > 0 && <span className="text-sm">/month</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.balloon_amount > 0 && (
                      <div className="flex items-center gap-2">
                        <FiCheck className="text-primary" />
                        <span>{plan.balloon_amount} Balloons</span>
                      </div>
                    )}
                    {plan.daily_balloons > 0 && (
                      <div className="flex items-center gap-2">
                        <FiCheck className="text-primary" />
                        <span>{plan.daily_balloons} Daily Balloons</span>
                      </div>
                    )}
                    {(plan.features as string[])?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <FiCheck className="text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => handlePurchase(plan.name)}
                    className="w-full"
                    variant={plan.daily_balloons > 0 ? 'default' : 'outline'}
                  >
                    {plan.daily_balloons > 0 ? 'Subscribe' : 'Purchase'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 max-w-2xl mx-auto" data-tour="earn-balloons">
          <CardHeader>
            <CardTitle>How to earn balloons?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎈</span>
              <p>Complete an event - Earn 5 balloons</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎈</span>
              <p>Complete a task - Earn 2 balloons</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎈</span>
              <p>Sign up bonus - 10 balloons</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle>VIP Testing Access 🌟</CardTitle>
            <CardDescription>
              Special access for beta testers and VIP members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setVipModalOpen(true)}
              className="w-full"
              variant="default"
            >
              Enter VIP Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <VIPAccessModal open={vipModalOpen} onOpenChange={setVipModalOpen} />
    </div>
  );
}