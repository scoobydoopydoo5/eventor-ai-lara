import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DetailsStepProps {
  data: any;
  onChange: (data: any) => void;
}

export function DetailsStep({ data, onChange }: DetailsStepProps) {
  const [date, setDate] = useState<Date | undefined>(data.date);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          placeholder="5000"
          value={data.budget || ''}
          onChange={(e) => onChange({ ...data, budget: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Input
          id="currency"
          placeholder="USD"
          value={data.currency || 'USD'}
          onChange={(e) => onChange({ ...data, currency: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Event Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                onChange({ ...data, date: newDate });
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="startTime"
              type="time"
              className="pl-10"
              value={data.startTime || ''}
              onChange={(e) => onChange({ ...data, startTime: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endTime"
              type="time"
              className="pl-10"
              value={data.endTime || ''}
              onChange={(e) => onChange({ ...data, endTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (hours)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="4"
          value={data.duration || ''}
          onChange={(e) => onChange({ ...data, duration: e.target.value })}
        />
      </div>

      {data.mode === 'attendee' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="clothes">What to Wear</Label>
            <Textarea
              id="clothes"
              placeholder="Dress code suggestions..."
              rows={2}
              value={data.clothes || ''}
              onChange={(e) => onChange({ ...data, clothes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gifts">Gift Ideas</Label>
            <Textarea
              id="gifts"
              placeholder="Gift suggestions..."
              rows={2}
              value={data.gifts || ''}
              onChange={(e) => onChange({ ...data, gifts: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectations">Expectations</Label>
            <Textarea
              id="expectations"
              placeholder="What to expect..."
              rows={2}
              value={data.expectations || ''}
              onChange={(e) => onChange({ ...data, expectations: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}
