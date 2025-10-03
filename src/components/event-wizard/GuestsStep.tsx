import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface GuestsStepProps {
  data: any;
  onChange: (data: any) => void;
}

export function GuestsStep({ data, onChange }: GuestsStepProps) {
  const [email, setEmail] = useState('');
  const guests = data.guests || [];

  const addGuest = () => {
    if (email && !guests.includes(email)) {
      onChange({ ...data, guests: [...guests, email] });
      setEmail('');
    }
  };

  const removeGuest = (guestEmail: string) => {
    onChange({ ...data, guests: guests.filter((g: string) => g !== guestEmail) });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="expectedGuests">Expected Number of Guests</Label>
        <Input
          id="expectedGuests"
          type="number"
          placeholder="50"
          value={data.expectedGuests || ''}
          onChange={(e) => onChange({ ...data, expectedGuests: e.target.value })}
        />
      </div>

      {data.mode === 'organizer' && (
        <>
          <div className="space-y-4">
            <Label>Guest List</Label>
            <div className="flex gap-2">
              <Input
                placeholder="guest@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGuest()}
              />
              <Button onClick={addGuest} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 rounded-lg border border-border bg-muted/50">
                {guests.map((guest: string) => (
                  <Badge key={guest} variant="secondary" className="gap-1">
                    {guest}
                    <button
                      onClick={() => removeGuest(guest)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="demographics">Demographics/Age Groups</Label>
        <Input
          id="demographics"
          placeholder="e.g., 25-35 years old, professionals"
          value={data.demographics || ''}
          onChange={(e) => onChange({ ...data, demographics: e.target.value })}
        />
      </div>
    </div>
  );
}
