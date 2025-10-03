import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FiCalendar, FiLoader, FiZap } from "react-icons/fi";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-typed";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDetailsStepProps {
  data: any;
  onChange: (data: any) => void;
}

const currencies = [
  "KWD",
  "Riyal",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
];
const genderOptions = ["All", "Male", "Female", "Non-binary", "Other"];
const ageRanges = [
  "All Ages",
  "0-12",
  "13-17",
  "18-25",
  "26-35",
  "36-50",
  "50+",
];

export function EnhancedDetailsStep({
  data,
  onChange,
}: EnhancedDetailsStepProps) {
  const [enableTime, setEnableTime] = useState(!!data.event_time);
  const [filling, setFilling] = useState(false);
  const { toast } = useToast();

  // Set default random date 2-9 days from today if no date is set
  const getDefaultDate = () => {
    if (data.event_date) {
      return new Date(data.event_date);
    }
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 8) + 2; // 2-9 days
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + randomDays);

    // Set the default date in the data
    onChange({ ...data, event_date: format(defaultDate, "yyyy-MM-dd") });
    return defaultDate;
  };

  const [date, setDate] = useState<Date | undefined>(getDefaultDate());

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onChange({ ...data, event_date: format(selectedDate, "yyyy-MM-dd") });
    }
  };

  const handleFillWithAI = async () => {
    setFilling(true);
    try {
      const { data: result } = await supabase.functions.invoke("ai-enhance", {
        body: {
          text: `Event: ${data.name}, Type: ${data.event_type}`,
          context: `Generate realistic values for budget, guests, and duration`,
          type: "event_details",
        },
      });

      if (result?.estimated_budget) {
        onChange({
          ...data,
          estimated_budget: result.estimated_budget,
          estimated_guests: result.estimated_guests,
          event_duration: result.event_duration,
        });
        toast({
          title: "Filled!",
          description: "Event details filled with AI suggestions",
        });
      }
    } catch (error) {
      console.error("Error filling details:", error);
      toast({
        title: "Error",
        description: "Failed to fill details",
        variant: "destructive",
      });
    } finally {
      setFilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleFillWithAI}
          disabled={filling || !data.name || !data.event_type}
          className="gap-2"
        >
          {filling ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiZap className="h-4 w-4" />
          )}
          Fill with AI
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Event Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <FiCalendar className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="time-toggle">Enable Time Selection</Label>
          <Switch
            id="time-toggle"
            checked={enableTime}
            onCheckedChange={(checked) => {
              setEnableTime(checked);
              if (!checked) {
                onChange({ ...data, event_time: null });
              }
            }}
          />
        </div>
        {enableTime && (
          <Input
            type="time"
            value={data.event_time || ""}
            onChange={(e) => onChange({ ...data, event_time: e.target.value })}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Event Duration (hours)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          placeholder="Duration in hours"
          value={data.event_duration || ""}
          onChange={(e) =>
            onChange({
              ...data,
              event_duration: parseInt(e.target.value) || null,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Estimated Budget</Label>
        <Input
          id="budget"
          type="number"
          min="0"
          placeholder="Enter budget amount"
          value={data.estimated_budget || ""}
          onChange={(e) =>
            onChange({
              ...data,
              estimated_budget: parseFloat(e.target.value) || null,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={data.currency || "USD"}
          onValueChange={(value) => onChange({ ...data, currency: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((curr) => (
              <SelectItem key={curr} value={curr}>
                {curr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guests">Estimated Number of Guests</Label>
        <Input
          id="guests"
          type="number"
          min="1"
          placeholder="Number of guests"
          value={data.estimated_guests || ""}
          onChange={(e) =>
            onChange({
              ...data,
              estimated_guests: parseInt(e.target.value) || null,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Guest Gender</Label>
        <Select
          value={data.guest_gender || "all"}
          onValueChange={(value) => onChange({ ...data, guest_gender: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            {genderOptions.map((gender) => (
              <SelectItem key={gender} value={gender.toLowerCase()}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Guest Age Range</Label>
        <Select
          value={data.guest_age_range || "all ages"}
          onValueChange={(value) =>
            onChange({ ...data, guest_age_range: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select age range" />
          </SelectTrigger>
          <SelectContent>
            {ageRanges.map((age) => (
              <SelectItem key={age} value={age.toLowerCase()}>
                {age}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color Theme</Label>
        <Input
          id="color"
          type="color"
          value={data.color_theme || "#6366f1"}
          onChange={(e) => onChange({ ...data, color_theme: e.target.value })}
          className="h-12 w-full"
        />
      </div>
    </div>
  );
}
