import React, { useEffect, useRef, useState } from 'react';
import { Locate } from 'lucide-react';
import { cn } from '../lib/utils';
import { PlaceResult } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-place-picker': any;
    }
  }
}

interface PlacesAutocompleteProps {
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  // Zoektype — bepaalt welke resultaten Google teruggeeft
  searchType?: 'cities'       // alleen steden (voor trips, profiel, events)
             | 'businesses'   // bedrijven + steden (voor spots, marketplace, deals)
             | 'all';         // alles
  // Restrict op land (ISO 3166-1 alpha-2, bijv. 'nl' of 'id')
  countryRestrict?: string;
  // Toon "Gebruik mijn locatie" knop
  showDetectButton?: boolean;
}

export const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search for a place...',
  className,
  label,
  searchType = 'all',
  countryRestrict,
  showDetectButton = false,
}) => {
  const pickerRef = useRef<HTMLElement & {
    value?: { toJSON: () => any };
    addEventListener: (event: string, handler: (e: any) => void) => void;
    removeEventListener: (event: string, handler: (e: any) => void) => void;
  }>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Mapping searchType → gmpx type attribuut
  const pickerType =
    searchType === 'cities' ? '(cities)' :
    searchType === 'businesses' ? 'establishment' :
    '';

  // Luister op place-change event van de web component
  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;

    const handlePlaceChange = () => {
      const place = picker.value;
      if (!place) { 
        onChange(null); 
        return; 
      }

      const p = place.toJSON ? place.toJSON() : place;
      const components: any[] = p.addressComponents || p.address_components || [];
      const getC = (type: string) => components.find((c: any) => c.types?.includes(type));

      const result: PlaceResult = {
        placeId: p.id || p.place_id || '',
        name: p.displayName?.text || p.name || '',
        address: p.formattedAddress || p.formatted_address || '',
        city:
          getC('locality')?.longText || getC('locality')?.long_name ||
          getC('administrative_area_level_2')?.longText || getC('administrative_area_level_2')?.long_name ||
          getC('administrative_area_level_1')?.longText || getC('administrative_area_level_1')?.long_name || '',
        country: getC('country')?.longText || getC('country')?.long_name || '',
        countryCode: getC('country')?.shortText || getC('country')?.short_name || '',
        lat: typeof p.location?.lat === 'function' ? p.location.lat() : (p.geometry?.location?.lat ?? 0),
        lng: typeof p.location?.lng === 'function' ? p.location.lng() : (p.geometry?.location?.lng ?? 0),
        types: p.types || []
      };

      onChange(result);
    };

    picker.addEventListener('gmpx-placechange', handlePlaceChange);
    return () => picker.removeEventListener('gmpx-placechange', handlePlaceChange);
  }, [onChange]);

  // GPS detectie → reverse geocode via Geocoding API
  const detectLocation = () => {
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const r = data.results?.[0];
        if (!r) { setIsDetecting(false); return; }

        const getC = (type: string) => r.address_components?.find((c: any) => c.types.includes(type));
        onChange({
          placeId: r.place_id,
          name: getC('locality')?.long_name || r.formatted_address.split(',')[0],
          address: r.formatted_address,
          city: getC('locality')?.long_name || '',
          country: getC('country')?.long_name || '',
          countryCode: getC('country')?.short_name || '',
          lat,
          lng,
          types: r.types || []
        });
      } catch (error) {
        console.error("Geocoding failed:", error);
      } finally {
        setIsDetecting(false);
      }
    }, () => setIsDetecting(false));
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center gap-2">
        {/* gmpx-place-picker rendert zijn eigen input + dropdown */}
        <gmpx-place-picker
          ref={pickerRef}
          placeholder={placeholder}
          {...(pickerType ? { type: pickerType } : {})}
          {...(countryRestrict ? { 'country-codes': countryRestrict } : {})}
          style={{ width: '100%' }}
        />
        {showDetectButton && (
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            className="flex-shrink-0 p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-primary hover:border-primary/30 transition-colors"
            title="Use my location"
          >
            <Locate className={cn('w-4 h-4', isDetecting && 'animate-spin')} />
          </button>
        )}
      </div>
    </div>
  );
};
