import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiMapPin } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { supabase } from '@/lib/supabase-typed';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Planet } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function EventLocation() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const kawaiiColor = useKawaiiTheme();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasCoordinates = event?.location_lat && event?.location_lng;
  const lat = parseFloat(event?.location_lat) || 0;
  const lng = parseFloat(event?.location_lng) || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/event/${eventId}`)}
            >
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Event Location</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiMapPin className="h-5 w-5 text-primary" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Location Name</p>
                <p className="font-medium">{event?.location_name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{event?.country || 'Not specified'}</p>
              </div>
              {event?.state && (
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{event.state}</p>
                </div>
              )}
              {event?.venue_recommendation && (
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium">{event.venue_recommendation}</p>
                </div>
              )}
            </div>

            {hasCoordinates && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Map Location</h3>
                <div className="h-[500px] rounded-lg overflow-hidden border border-border">
                  <MapContainer
                    center={[lat, lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[lat, lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">{event.name}</p>
                          <p className="text-sm text-muted-foreground">{event.location_name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {!hasCoordinates && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex justify-center mb-4">
                  <Planet size={120} mood="blissful" color={kawaiiColor.kawaiiColor} />
                </div>
                <FiMapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No map coordinates available for this event</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
