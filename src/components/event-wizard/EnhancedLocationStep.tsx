import { useState, useEffect } from 'react';
import { Country, State } from 'country-state-city';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FiMapPin, FiGlobe } from 'react-icons/fi';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { LocationMap } from '@/components/map/LocationMap';

interface EnhancedLocationStepProps {
  data: any;
  onChange: (data: any) => void;
}


export function EnhancedLocationStep({ data, onChange }: EnhancedLocationStepProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(data.countryCode || '');
  const [isDifferentCountry, setIsDifferentCountry] = useState(data.current_country_code ? true : false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    data.location_lat || 40.7128,
    data.location_lng || -74.0060
  ]);

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const { data: genData, error } = await supabase.functions.invoke('ai-enhance', {
        body: {
          type: 'fill_field',
          text: 'venue name',
          context: `Event: ${data.name || 'event'}, Type: ${data.event_type || 'general'}, Country: ${data.country || 'any'}, State: ${data.state || 'any'}`
        }
      });

      if (error) throw error;

      onChange({
        ...data,
        location_name: genData.result || data.location_name,
      });

      toast({
        title: "Generated!",
        description: "AI has suggested a venue for your event",
      });
    } catch (error) {
      console.error('AI generate error:', error);
      toast({
        title: "Error",
        description: "Failed to generate venue suggestion",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getLocationFromCity = async () => {
    if (!data.location_name) return;
    
    try {
      // Simple geocoding approximation for common cities
      const cityCoords: Record<string, [number, number]> = {
        'new york': [40.7128, -74.0060],
        'london': [51.5074, -0.1278],
        'paris': [48.8566, 2.3522],
        'tokyo': [35.6762, 139.6503],
        'sydney': [-33.8688, 151.2093],
        'san francisco': [37.7749, -122.4194],
        'los angeles': [34.0522, -118.2437],
        'chicago': [41.8781, -87.6298],
        'toronto': [43.6532, -79.3832],
        'berlin': [52.5200, 13.4050],
      };

      const cityKey = data.location_name.toLowerCase();
      const coords = cityCoords[cityKey];
      
      if (coords) {
        onChange({
          ...data,
          location_lat: coords[0],
          location_lng: coords[1],
        });
        setMapCenter(coords);
        toast({
          title: "Location found!",
          description: `Coordinates set for ${data.location_name}`,
        });
      }
    } catch (error) {
      console.error('Location lookup error:', error);
    }
  };

  const handleMapPositionChange = (lat: number, lng: number) => {
    onChange({
      ...data,
      location_lat: lat,
      location_lng: lng,
    });
    setMapCenter([lat, lng]);
  };

  const handleLocationSelect = (countryName: string) => {
    const country = countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase()
    );
    
    if (country) {
      setSelectedCountry(country.isoCode);
      onChange({ 
        ...data, 
        country: country.name, 
        countryCode: country.isoCode,
        state: '',
        stateCode: ''
      });
      
      toast({
        title: "Country selected",
        description: `Set to ${country.name}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select
          value={selectedCountry}
          onValueChange={(value) => {
            setSelectedCountry(value);
            const country = countries.find(c => c.isoCode === value);
            onChange({ 
              ...data, 
              country: country?.name || '', 
              countryCode: value,
              state: '',
              stateCode: ''
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.isoCode} value={country.isoCode}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State/Region</Label>
        <Select
          value={data.stateCode || ''}
          onValueChange={(value) => {
            const state = states.find(s => s.isoCode === value);
            onChange({ 
              ...data, 
              state: state?.name || '',
              stateCode: value
            });
          }}
          disabled={!selectedCountry}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state/region" />
          </SelectTrigger>
          <SelectContent>
            {states.length > 0 ? (
              states.map((state) => (
                <SelectItem key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No states available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Select Location on Map</Label>
        <div className="rounded-lg overflow-hidden border border-border h-[400px]">
          {mapCenter && mapCenter[0] && mapCenter[1] ? (
            <LocationMap
              center={mapCenter}
              markerPosition={[data.location_lat || mapCenter[0], data.location_lng || mapCenter[1]]}
              onMarkerDragEnd={handleMapPositionChange}
              onLocationSelect={handleLocationSelect}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Use the search bar on the map to find a location
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Search for a location using the search bar, or drag the marker to set precise coordinates
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="differentCountry"
            checked={isDifferentCountry}
            onCheckedChange={(checked) => {
              setIsDifferentCountry(checked as boolean);
              if (!checked) {
                onChange({
                  ...data,
                  current_country: '',
                  current_country_code: ''
                });
              }
            }}
          />
          <Label 
            htmlFor="differentCountry" 
            className="text-sm font-normal cursor-pointer"
          >
            Are you living in a different country?
          </Label>
        </div>

        {isDifferentCountry && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="currentCountry">Current Country of Residence</Label>
            <Select
              value={data.current_country_code || ''}
              onValueChange={(value) => {
                const country = countries.find(c => c.isoCode === value);
                onChange({ 
                  ...data, 
                  current_country: country?.name || '',
                  current_country_code: value
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your current country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FiMapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-sm">Location Coordinates</p>
              <p className="text-xs text-muted-foreground">
                Latitude: {data.location_lat?.toFixed(6) || 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground">
                Longitude: {data.location_lng?.toFixed(6) || 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Use the globe button to auto-fill coordinates for common cities, or drag the marker on the map.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}