import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-typed";
import { LocationMap } from "@/components/map/LocationMap";
import { FiMapPin, FiSave } from "react-icons/fi";

interface LocationCoordinatesCardProps {
  eventId: string;
}

export function LocationCoordinatesCard({
  eventId,
}: LocationCoordinatesCardProps) {
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    40.7128, -74.006,
  ]);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    40.7128, -74.006,
  ]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    const { data } = await supabase
      .from("events" as any)
      .select("*")
      .eq("id", eventId)
      .single();
    if (data) {
      setEvent(data);
      if (data.location_lat && data.location_lng) {
        const coords: [number, number] = [
          parseFloat(data.location_lat),
          parseFloat(data.location_lng),
        ];
        setMapCenter(coords);
        setMarkerPosition(coords);
      }
    }
  };

  const handleMarkerDragEnd = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    setHasChanges(true);
  };

  const handleSaveCoordinates = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events" as any)
        .update({
          location_lat: markerPosition[0],
          location_lng: markerPosition[1],
        })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location coordinates saved successfully",
      });
      setHasChanges(false);
      await fetchEvent();
    } catch (error) {
      console.error("Error saving coordinates:", error);
      toast({
        title: "Error",
        description: "Failed to save coordinates",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiMapPin className="h-5 w-5" />
          Location Coordinates
        </CardTitle>
        <CardDescription>
          Set or update event location coordinates for maps and directions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className=" z-[-99] rounded-lg overflow-hidden border border-border h-[400px]">
          <LocationMap
            center={mapCenter}
            markerPosition={markerPosition}
            onMarkerDragEnd={handleMarkerDragEnd}
            onLocationSelect={(countryName) => {
              // Optional: Update country if needed
            }}
          />
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Latitude: {markerPosition[0].toFixed(6)}</p>
          <p>Longitude: {markerPosition[1].toFixed(6)}</p>
        </div>

        {hasChanges && (
          <Button
            onClick={handleSaveCoordinates}
            disabled={saving}
            className="w-full"
          >
            <FiSave className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Coordinates"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
