import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface LocationStepProps {
  data: any;
  onChange: (data: any) => void;
}

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Other',
];

export function LocationStep({ data, onChange }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="venue">Venue Name</Label>
        <Input
          id="venue"
          placeholder="Event venue or location"
          value={data.venue || ''}
          onChange={(e) => onChange({ ...data, venue: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="123 Main St"
            className="pl-10"
            value={data.address || ''}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="New York"
            value={data.city || ''}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State/Region</Label>
          <Input
            id="state"
            placeholder="NY"
            value={data.state || ''}
            onChange={(e) => onChange({ ...data, state: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select
          value={data.country}
          onValueChange={(value) => onChange({ ...data, country: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country.toLowerCase()}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">Zip Code</Label>
        <Input
          id="zipCode"
          placeholder="10001"
          value={data.zipCode || ''}
          onChange={(e) => onChange({ ...data, zipCode: e.target.value })}
        />
      </div>

      <div className="rounded-lg border border-border p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          Map preview would appear here
        </p>
      </div>
    </div>
  );
}
