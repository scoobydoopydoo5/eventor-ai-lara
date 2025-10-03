import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FiDroplet as Palette } from 'react-icons/fi';

interface PreferencesStepProps {
  data: any;
  onChange: (data: any) => void;
}

const colorThemes = [
  { name: 'Vibrant', value: 'vibrant', colors: ['bg-purple-500', 'bg-pink-500', 'bg-orange-500'] },
  { name: 'Elegant', value: 'elegant', colors: ['bg-slate-700', 'bg-gray-600', 'bg-zinc-500'] },
  { name: 'Natural', value: 'natural', colors: ['bg-green-600', 'bg-emerald-500', 'bg-teal-500'] },
  { name: 'Ocean', value: 'ocean', colors: ['bg-blue-600', 'bg-cyan-500', 'bg-sky-400'] },
  { name: 'Sunset', value: 'sunset', colors: ['bg-orange-500', 'bg-red-500', 'bg-pink-500'] },
];

export function PreferencesStep({ data, onChange }: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <Label>Event Color Theme</Label>
        </div>
        
        <RadioGroup
          value={data.color_theme}
          onValueChange={(value) => onChange({ ...data, color_theme: value })}
          className="grid grid-cols-1 gap-4"
        >
          {colorThemes.map((theme) => (
            <label
              key={theme.value}
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-border cursor-pointer transition-all hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-accent"
            >
              <RadioGroupItem value={theme.value} className="shrink-0" />
              <div className="flex items-center gap-3 flex-1">
                <div className="flex gap-1">
                  {theme.colors.map((color, idx) => (
                    <div key={idx} className={`h-8 w-8 rounded ${color}`} />
                  ))}
                </div>
                <span className="font-medium">{theme.name}</span>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="rounded-lg border border-border p-4 bg-muted/50 space-y-2">
        <h4 className="font-medium">Weather Information</h4>
        <p className="text-sm text-muted-foreground">
          Weather data will be fetched automatically based on your location and event date.
        </p>
      </div>
    </div>
  );
}
