import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue using CDN
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  locations: { lat: number; lng: number; name: string }[];
  center?: [number, number];
  zoom?: number;
}

export default function Map({ locations, center, zoom = 13 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center || [0, 0], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (locations.length > 0) {
      const bounds = L.latLngBounds([]);
      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng])
          .addTo(mapInstanceRef.current!)
          .bindPopup(`<b>${loc.name}</b>`);
        markersRef.current.push(marker);
        bounds.extend([loc.lat, loc.lng]);
      });

      if (!center) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapInstanceRef.current.setView(center, zoom);
      }
    }

    return () => {
      // We don't necessarily want to destroy the map on every re-render, 
      // but we do want to cleanup if the component actually unmounts.
    };
  }, [locations, center, zoom]);

  // Handle unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      id="map-container"
    />
  );
}
