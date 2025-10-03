import { useState } from 'react';
import { z } from 'zod';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';

interface DonateBalloonsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName?: string;
  onSuccess?: () => void;
}

const amountSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+$/, { message: 'Enter a valid number' })
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive().max(100000, { message: 'Too large' })),
});

export function DonateBalloonsDrawer({ open, onOpenChange, recipientId, recipientName = 'user', onSuccess }: DonateBalloonsDrawerProps) {
  const { userId, balloons, refetchBalloons } = useClerkAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    if (!userId) {
      toast({ title: 'Sign in required', description: 'Please sign in to donate balloons', variant: 'destructive' });
      return;
    }

    const parsed = amountSchema.safeParse({ amount });
    if (!parsed.success) {
      toast({ title: 'Invalid amount', description: parsed.error.errors[0]?.message || 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    const amt = parsed.data.amount;
    if (amt > balloons) {
      toast({ title: 'Not enough balloons', description: `You only have ${balloons} balloons`, variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await (supabase as any).functions.invoke('donate-balloons', {
        body: {
          donor_id: userId,
          recipient_id: recipientId,
          amount: amt,
        },
      });

      if (error) throw error;

      await refetchBalloons();
      onSuccess?.();

      toast({
        title: 'Donation successful 🎁',
        description: `You donated ${amt} and received ${amt * 2} bonus balloons!`,
      });
      setAmount('');
      onOpenChange(false);
    } catch (e) {
      console.error('Donation error', e);
      toast({ title: 'Error', description: 'Failed to process donation', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Button variant="secondary" onClick={() => onOpenChange(true)}>Donate Balloons</Button>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Donate Balloons</DrawerTitle>
          <DrawerDescription>
            Send balloons to {recipientName}. You currently have {balloons} balloons.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-3">
          <Label htmlFor="donation-amount">Amount</Label>
          <Input
            id="donation-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter number of balloons"
          />
        </div>
        <DrawerFooter>
          <Button onClick={handleDonate} disabled={loading || !amount.trim()} className="w-full">
            {loading ? 'Processing...' : 'Donate'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">Cancel</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
