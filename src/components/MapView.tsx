import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../lib/utils';
import { FamilyProfile, Spot, MarketItem } from '../types';

// Fix for default Leaflet icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  profiles?: FamilyProfile[];
  spots?: Spot[];
  marketItems?: MarketItem[];
  className?: string;
  onSelectFamily?: (family: FamilyProfile) => void;
  onSelectSpot?: (spot: Spot) => void;
  onSelectItem?: (item: MarketItem) => void;
}

const RecenterMap = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [center, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  center, 
  zoom = 13, 
  profiles = [], 
  spots = [], 
  marketItems = [],
  className,
  onSelectFamily,
  onSelectSpot,
  onSelectItem
}) => {
  return (
    <div className={cn("w-full h-full rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-inner relative z-0 toner-map", className)}>
      <style>{`
        .toner-map .leaflet-tile {
          filter: grayscale(100%) contrast(150%) brightness(110%);
        }
        .toner-map .leaflet-container {
          background: #000;
        }
      `}</style>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
        />
        
        <RecenterMap center={center} />

        {/* Current Location / Focus Point */}
        <Marker position={[center.lat, center.lng]}>
          <Popup>
            <div className="p-1">
              <p className="font-black text-secondary text-xs uppercase tracking-widest text-center">Focus Location</p>
            </div>
          </Popup>
        </Marker>

        {/* Profiles */}
        {profiles.map(profile => profile.currentLocation && (
          <Marker 
            key={profile.id} 
            position={[profile.currentLocation.lat, profile.currentLocation.lng]}
            icon={new L.DivIcon({
              className: 'custom-div-icon',
              html: `<div class="w-10 h-10 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white hover:scale-110 transition-transform">
                      <img src="${profile.photoUrl || `https://picsum.photos/seed/${profile.id}/50/50`}" class="w-full h-full object-cover" />
                    </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup>
              <div className="p-2 min-w-[120px] text-center">
                <p className="font-bold text-secondary mb-1">{profile.familyName}</p>
                <button 
                  onClick={() => onSelectFamily?.(profile)}
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  View Profile
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Spots */}
        {spots.map(spot => (
          <Marker 
            key={spot.id} 
            position={[spot.coordinates.lat, spot.coordinates.lng]}
            icon={new L.DivIcon({
              className: 'custom-div-icon',
              html: `<div class="w-8 h-8 rounded-xl bg-secondary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div className="p-2 min-w-[120px] text-center">
                <p className="font-bold text-secondary mb-1">{spot.name}</p>
                <button 
                  onClick={() => onSelectSpot?.(spot)}
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Market Items */}
        {marketItems.map(item => item.location && (
          <Marker 
            key={item.id} 
            position={[item.location.lat, item.location.lng]}
            icon={new L.DivIcon({
              className: 'custom-div-icon',
              html: `<div class="w-8 h-8 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>
                    </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
            <Popup>
              <div className="p-2 min-w-[120px] text-center">
                <p className="font-bold text-secondary mb-1">{item.title}</p>
                <p className="text-[10px] font-black text-accent mb-2">${item.price}</p>
                <button 
                  onClick={() => onSelectItem?.(item)}
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  View Item
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
