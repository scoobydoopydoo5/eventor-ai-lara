import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  center: [number, number];
  markerPosition: [number, number];
  onMarkerDragEnd: (lat: number, lng: number) => void;
  onLocationSelect?: (countryName: string) => void;
}

export function LocationMap({ center, markerPosition, onMarkerDragEnd, onLocationSelect }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add search control
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Search location...',
      keepResult: true,
    });
    
    map.addControl(searchControl);

    // Listen to search results
    map.on('geosearch/showlocation', (result: any) => {
      const { x, y, label } = result.location;
      onMarkerDragEnd(y, x);
      
      // Extract country name from the label
      if (onLocationSelect && label) {
        const parts = label.split(',');
        const countryName = parts[parts.length - 1]?.trim();
        if (countryName) {
          onLocationSelect(countryName);
        }
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMarkerDragEnd, onLocationSelect]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update map center
    map.setView(center, 13);
  }, [center]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create new draggable marker
    const marker = L.marker(markerPosition, { draggable: true }).addTo(map);
    
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onMarkerDragEnd(pos.lat, pos.lng);
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [markerPosition, onMarkerDragEnd]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}
