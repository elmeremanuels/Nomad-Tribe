import React, { useEffect, useRef, useState } from 'react';
import { Locate } from 'lucide-react';
import { cn } from '../lib/utils';
import { PlaceResult } from '../types';
import { useNomadStore } from '../store';

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
  const { addToast } = useNomadStore();
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
      const place = picker.value as any;
      if (!place) { 
        onChange(null); 
        return; 
      }

      // Try to use properties directly from the Place object, handle toJSON fallbacks
      const p = place;
      const json = p.toJSON ? p.toJSON() : {} as any;
      
      const components: any[] = p.addressComponents || json.addressComponents || p.address_components || json.address_components || [];
      const getC = (type: string) => components.find((c: any) => c.types?.includes(type));

      const cityVal = 
        getC('locality')?.longText || getC('locality')?.long_name ||
        getC('administrative_area_level_1')?.longText || getC('administrative_area_level_1')?.long_name ||
        getC('administrative_area_level_2')?.longText || getC('administrative_area_level_2')?.long_name ||
        (p.formattedAddress || json.formattedAddress || '').split(',')[0] || '';

      const displayName = p.displayName || json.displayName?.text || p.name || json.name;
      const nameVal = (typeof displayName === 'object' ? (displayName?.text || displayName?.long_name) : displayName) || cityVal || 'Selected Location';

      const result: PlaceResult = {
        placeId: p.id || json.id || '',
        name: nameVal,
        address: p.formattedAddress || json.formattedAddress || '',
        city: cityVal,
        country: getC('country')?.longText || getC('country')?.long_name || 
          (p.formattedAddress || json.formattedAddress || '').split(',').pop()?.trim() || '',
        countryCode: getC('country')?.shortText || getC('country')?.short_name || '',
        lat: typeof p.location?.lat === 'function' ? p.location.lat() : (p.location?.lat ?? 0),
        lng: typeof p.location?.lng === 'function' ? p.location.lng() : (p.location?.lng ?? 0),
        types: p.types || json.types || []
      };

      onChange(result);
    };

    picker.addEventListener('gmpx-placechange', handlePlaceChange);
    return () => picker.removeEventListener('gmpx-placechange', handlePlaceChange);
  }, [onChange]);

  // Sync initial/updated value from prop to the web component
  useEffect(() => {
    if (pickerRef.current && value?.placeId) {
      // Use the 'place' attribute to set the initial location
      pickerRef.current.setAttribute('place', value.placeId);
    } else if (pickerRef.current && !value) {
      pickerRef.current.removeAttribute('place');
    }
  }, [value?.placeId, value]);

  // GPS detectie → reverse geocode via Geocoding API
  const detectLocation = () => {
    if (!navigator.geolocation) {
      addToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!key) {
        addToast("Google Maps API Key is missing. Cannot detect location.", "error");
        setIsDetecting(false);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const r = data.results?.[0];
        if (data.status === 'REQUEST_DENIED') {
          throw new Error(`Google Maps API Request Denied: ${data.error_message || 'Check if Geocoding API is enabled and API Key is valid.'}`);
        }
        if (!r) { 
          setIsDetecting(false); 
          addToast("Could not determine city from GPS coordinates. Check your Google Cloud console settings.", "error");
          return; 
        }

        const getC = (type: string) => r.address_components?.find((c: any) => c.types.includes(type));
        
        // Robust city detection
        const cityName = 
          getC('locality')?.long_name || 
          getC('administrative_area_level_2')?.long_name || 
          getC('administrative_area_level_1')?.long_name || '';

        const name = cityName || r.formatted_address?.split(',')?.[0] || 'Selected Location';

        onChange({
          placeId: r.place_id,
          name: name,
          address: r.formatted_address || '',
          city: cityName,
          country: getC('country')?.long_name || '',
          countryCode: getC('country')?.short_name || '',
          lat,
          lng,
          types: r.types || []
        });
      } catch (error) {
        console.error("Geocoding failed:", error);
        addToast("Geocoding failed. Please search manually.", "error");
      } finally {
        setIsDetecting(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      setIsDetecting(false);
      addToast(`GPS Error: ${error.message}. Please check your browser settings.`, "error");
    }, { timeout: 10000 });
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
        {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
          <div className="w-full p-3 bg-red-50 border-2 border-red-100 rounded-2xl text-[10px] font-bold text-red-400">
            Maps API Key required for search
          </div>
        ) : (
          <gmpx-place-picker
            ref={pickerRef}
            api-key={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            placeholder={placeholder}
            {...(pickerType ? { type: pickerType } : {})}
            {...(countryRestrict ? { 'country-codes': countryRestrict } : {})}
            style={{ width: '100%' }}
          />
        )}
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
