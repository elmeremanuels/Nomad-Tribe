import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { FamilyProfile, Spot, MarketItem, PopUpEvent, LookingForRequest } from '../types';

interface MapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  spots?: Spot[];
  marketItems?: MarketItem[];
  events?: PopUpEvent[]
  requests?: LookingForRequest[];
  className?: string;
  onSelectFamily?: (family: FamilyProfile) => void;
  onSelectSpot?: (spot: Spot) => void;
  onSelectItem?: (item: MarketItem) => void;
  onSelectEvent?: (event: PopUpEvent) => void;
  onSelectRequest?: (req: LookingForRequest) => void;
  userPhotoUrl?: string;
  radiusKm?: number;
}

const hasValidCoords = (lat?: number, lng?: number) =>
  lat != null && lng != null &&
  !isNaN(lat) && !isNaN(lng);

const RecenterMap = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (!map || !center || typeof center.lat !== 'number' || typeof center.lng !== 'number' || isNaN(center.lat) || isNaN(center.lng)) return;

    const latChanged = Math.abs(prevCenter.current.lat - center.lat) > 0.001;
    const lngChanged = Math.abs(prevCenter.current.lng - center.lng) > 0.001;

    if (latChanged || lngChanged) {
      map.panTo({ lat: center.lat, lng: center.lng });
      prevCenter.current = center;
    }
  }, [center.lat, center.lng, map]);

  return null;
};

const SPOT_COLORS: Record<string, string> = {
  Playground:     'bg-green-400',
  Workspace:      'bg-primary',
  Medical:        'bg-red-400',
  Accommodation:  'bg-secondary',
  Restaurant:     'bg-amber-400',
  Cafe:           'bg-amber-500',
  Default:        'bg-slate-500',
};

const SpotMarker: React.FC<{ category: string; isVetted?: boolean }> = ({ category, isVetted }) => {
  const bg = SPOT_COLORS[category] || SPOT_COLORS.Default;

  return (
    <div className={cn(
      "w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform relative",
      bg
    )}>
      <span className="text-sm">
        {category === 'Playground' ? '🛝' :
         category === 'Workspace' ? '💻' :
         category === 'Medical' ? '🏥' :
         category === 'Accommodation' ? '🏨' :
         category === 'Restaurant' ? '🍽️' : 
         category === 'Cafe' ? '☕' : '📍'}
      </span>
      {isVetted && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div className="w-2.5 h-2.5 bg-primary rounded-full" />
        </div>
      )}
    </div>
  );
};

const MapLegend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-slate-100 flex flex-col gap-1.5 z-10">
    {[
      { color: 'bg-green-400', label: 'Playground' },
      { color: 'bg-primary', label: 'Workspace' },
      { color: 'bg-amber-400', label: 'Event' },
      { color: 'bg-secondary', label: 'Request' },
    ].map(({ color, label }) => (
      <div key={label} className="flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
    ))}
  </div>
);

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 13,
  spots = [],
  marketItems = [],
  events = [],
  requests = [],
  className,
  onSelectFamily,
  onSelectSpot,
  onSelectItem,
  onSelectEvent,
  onSelectRequest,
  userPhotoUrl,
}) => {
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PopUpEvent | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LookingForRequest | null>(null);

  const closeAll = useCallback(() => {
    setSelectedSpot(null);
    setSelectedEvent(null);
    setSelectedRequest(null);
  }, []);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={cn(
        "w-full h-full rounded-[2.5rem] border-2 border-dashed border-red-100 flex items-center justify-center bg-red-50/30",
        className
      )}>
        <div className="text-center space-y-3 px-6">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-red-600 uppercase tracking-widest">Maps API Key Missing</p>
            <p className="text-[10px] text-red-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
              Please set your <b>VITE_GOOGLE_MAPS_API_KEY</b> in the Project Settings and ensure <b>Maps JavaScript API</b> and <b>Places API</b> are enabled in the Google Cloud Console.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasValidCoords(center.lat, center.lng)) {
    return (
      <div className={cn(
        "w-full h-full rounded-[2.5rem] border-2 border-dashed border-slate-100 flex items-center justify-center bg-slate-50",
        className
      )}>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-slate-400">Set your location to see the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full rounded-[2.5rem] overflow-hidden relative", className)}>
      <Map
        /* 
           Note: mapId is required for AdvancedMarker. 
           fallback to DEMO_MAP_ID which usually works for basic testing.
           Ensure "Advanced Marker" capability is enabled in Google Cloud Console for your API Key.
        */
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID && import.meta.env.VITE_GOOGLE_MAPS_MAP_ID !== 'undefined' ? import.meta.env.VITE_GOOGLE_MAPS_MAP_ID : "DEMO_MAP_ID"}
        defaultCenter={{ lat: center.lat, lng: center.lng }}
        center={{ lat: center.lat, lng: center.lng }}
        defaultZoom={zoom}
        disableDefaultUI={true}
        gestureHandling="cooperative"
        onClick={closeAll}
        className="w-full h-full"
      >
        <RecenterMap center={center} />

        {/* CENTER MARKER */}
        <AdvancedMarker position={center} title="Your location">
          <div className="w-12 h-12 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-primary ring-4 ring-primary/20 hover:scale-110 transition-transform cursor-pointer">
            <img 
              src={userPhotoUrl || 'https://ui-avatars.com/api/?name=Me&background=random'} 
              className="w-full h-full object-cover shadow-inner" 
              alt="Me"
            />
          </div>
        </AdvancedMarker>

        {/* SPOT MARKERS */}
        {spots
          .filter(s => s.place && hasValidCoords(s.place.lat, s.place.lng))
          .map(spot => (
            <AdvancedMarker
              key={spot.id}
              position={{ lat: spot.place.lat, lng: spot.place.lng }}
              title={spot.name}
              onClick={() => { closeAll(); setSelectedSpot(spot); }}
            >
              <SpotMarker category={spot.category} isVetted={spot.isVetted} />
            </AdvancedMarker>
          ))}

        {selectedSpot && (
          <InfoWindow
            position={{ lat: selectedSpot.place.lat, lng: selectedSpot.place.lng }}
            onCloseClick={closeAll}
          >
            <div className="p-2 min-w-[140px]">
              <p className="text-[9px] font-black uppercase tracking-wider text-primary mb-1">{selectedSpot.category}</p>
              <p className="font-bold text-slate-800 text-sm mb-1">{selectedSpot.name}</p>
              {onSelectSpot && (
                <button
                  onClick={() => { onSelectSpot(selectedSpot); closeAll(); }}
                  className="text-[10px] font-black text-primary uppercase tracking-wider"
                >
                  View Details →
                </button>
              )}
            </div>
          </InfoWindow>
        )}

        {/* EVENT MARKERS */}
        {events
          .filter(e => hasValidCoords(e.lat, e.lng))
          .map(event => (
            <AdvancedMarker
              key={event.id}
              position={{ lat: event.lat!, lng: event.lng! }}
              title={event.title}
              onClick={() => { closeAll(); setSelectedEvent(event); }}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                <span className="text-xs">📅</span>
              </div>
            </AdvancedMarker>
          ))}
          
        {selectedEvent && (
          <InfoWindow
            position={{ lat: selectedEvent.lat!, lng: selectedEvent.lng! }}
            onCloseClick={closeAll}
          >
            <div className="p-2 min-w-[140px]">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-500 mb-1">{selectedEvent.category}</p>
              <p className="font-bold text-slate-800 text-sm mb-1">{selectedEvent.title}</p>
              <p className="text-[10px] text-slate-400">{selectedEvent.date}</p>
            </div>
          </InfoWindow>
        )}

        {/* REQUEST MARKERS */}
        {requests
          .filter(r => hasValidCoords(r.lat, r.lng))
          .map(req => (
            <AdvancedMarker
              key={req.id}
              position={{ lat: req.lat, lng: req.lng }}
              title={req.title}
              onClick={() => { closeAll(); setSelectedRequest(req); }}
            >
              <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                <span className="text-xs">🙋</span>
              </div>
            </AdvancedMarker>
          ))}

        {selectedRequest && (
          <InfoWindow
            position={{ lat: selectedRequest.lat, lng: selectedRequest.lng }}
            onCloseClick={closeAll}
          >
            <div className="p-2 min-w-[140px]">
              <p className="text-[9px] font-black uppercase tracking-wider text-secondary mb-1">{selectedRequest.category}</p>
              <p className="font-bold text-slate-800 text-sm mb-2">{selectedRequest.title}</p>
            </div>
          </InfoWindow>
        )}

        {/* MARKET ITEM MARKERS */}
        {marketItems
          .filter(item => hasValidCoords(item.lat, item.lng))
          .map(item => (
            <AdvancedMarker
              key={item.id}
              position={{ lat: item.lat!, lng: item.lng! }}
              title={item.title}
              onClick={() => onSelectItem?.(item)}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-600 flex items-center justify-center border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                <span className="text-xs">📦</span>
              </div>
            </AdvancedMarker>
          ))}

      </Map>
      <MapLegend />
    </div>
  );
};
