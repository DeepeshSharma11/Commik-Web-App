import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  onLocationSelect: (address: string, lat: number, lng: number) => void;
}

// Recenter map when position changes
const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 16); }, [lat, lng]);
  return null;
};

// Draggable marker + click-to-move
const DraggableMarker = ({ position, setPosition }: { position: [number, number]; setPosition: (p: [number, number]) => void }) => {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{ dragend: (e) => setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
    />
  );
};

const LocationPicker: React.FC<Props> = ({ onLocationSelect }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(addr);
      onLocationSelect(addr, lat, lng);
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallback);
      onLocationSelect(fallback, lat, lng);
    } finally {
      setGeocoding(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
        setLoading(false);
      },
      () => {
        setLoading(false);
        alert('Unable to retrieve location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePositionChange = (p: [number, number]) => {
    setPosition(p);
    reverseGeocode(p[0], p[1]);
  };

  return (
    <div className="space-y-3">
      {/* Get Current Location Button */}
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeDasharray="4"/></svg>
        )}
        {loading ? 'Getting your location...' : 'Use My Current Location'}
      </button>

      {/* Map */}
      {position && (
        <div className="rounded-2xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-700 shadow-md">
          <MapContainer
            center={position}
            zoom={16}
            style={{ height: '280px', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter lat={position[0]} lng={position[1]} />
            <DraggableMarker position={position} setPosition={handlePositionChange} />
          </MapContainer>
        </div>
      )}

      {/* Detected Address */}
      {position && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
            {geocoding ? '📍 Fetching address...' : '📍 Detected Address'}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{geocoding ? '...' : address}</p>
          <p className="text-[10px] text-slate-400 mt-1">Drag the marker to adjust precisely</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
