import { supabase } from '@/lib/supabase-typed';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { toast } from '@/hooks/use-toast';

const GUEST_BALLOONS_KEY = 'guest_balloons';

export const useBalloons = () => {
  const { userId, balloons, refetchBalloons, isGuest } = useClerkAuth();

  const spendBalloons = async (amount: number, description: string) => {
    if (balloons < amount) {
      toast({
        title: "Not enough balloons",
        description: `You need ${amount} balloons but only have ${balloons}. ${isGuest ? 'Sign in to get more balloons!' : 'Visit the pricing page to get more!'}`,
        variant: "destructive",
      });
      return false;
    }

    try {
      if (isGuest) {
        // Handle guest balloon spending via localStorage
        const newBalance = balloons - amount;
        localStorage.setItem(GUEST_BALLOONS_KEY, newBalance.toString());
        refetchBalloons();
        return true;
      }

      // Handle authenticated user balloon spending via database
      const { error: updateError } = await (supabase as any)
        .from('user_balloons')
        .update({ balance: balloons - amount })
        .eq('clerk_user_id', userId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await (supabase as any)
        .from('balloon_transactions')
        .insert({
          clerk_user_id: userId,
          amount: -amount,
          transaction_type: 'spend',
          description,
        });

      if (transactionError) console.error('Transaction error:', transactionError);

      refetchBalloons();
      return true;
    } catch (error) {
      console.error('Error spending balloons:', error);
      toast({
        title: "Error",
        description: "Failed to process balloon transaction",
        variant: "destructive",
      });
      return false;
    }
  };

  const earnBalloons = async (amount: number, description: string) => {
    try {
      if (isGuest) {
        // Handle guest balloon earning via localStorage
        const newBalance = balloons + amount;
        localStorage.setItem(GUEST_BALLOONS_KEY, newBalance.toString());
        refetchBalloons();
        
        toast({
          title: "Balloons earned! 🎈",
          description: `You earned ${amount} balloons for ${description}`,
        });
        return;
      }

      // Handle authenticated user balloon earning via database
      if (!userId) return;

      // Ensure a row exists; then update or insert accordingly
      const { data: existing, error: selErr } = await (supabase as any)
        .from('user_balloons')
        .select('balance')
        .eq('clerk_user_id', userId)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing) {
        const { error: updateError } = await (supabase as any)
          .from('user_balloons')
          .update({ balance: (existing.balance || 0) + amount })
          .eq('clerk_user_id', userId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await (supabase as any)
          .from('user_balloons')
          .insert({ clerk_user_id: userId, balance: amount });
        if (insertError) throw insertError;
      }

      const { error: transactionError } = await (supabase as any)
        .from('balloon_transactions')
        .insert({
          clerk_user_id: userId,
          amount,
          transaction_type: 'earn',
          description,
        });

      if (transactionError) console.error('Transaction error:', transactionError);

      refetchBalloons();
      
      toast({
        title: "Balloons earned! 🎈",
        description: `You earned ${amount} balloons for ${description}`,
      });
    } catch (error) {
      console.error('Error earning balloons:', error);
    }
  };

  return { spendBalloons, earnBalloons, balloons, userId, isGuest };
};