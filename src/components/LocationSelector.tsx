import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import citiesData from '../data/citiesSeed.json';

interface City {
  id: string;
  name: string;
  country: string;
  slug: string;
  lat?: number;
  lng?: number;
}

interface LocationSelectorProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number, lng: number }) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search city...", 
  className,
  label
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(value);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const searchLocations = async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      // Prioritize local seed for fast typing matches
      const localMatches: City[] = (citiesData as any[]).filter(c => 
        c.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        country: c.country,
        slug: c.slug,
        lat: c.lat || 0,
        lng: c.lng || 0
      }));

      // OSM search (Nominatim) - improved query for better results
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=8&featuretype=city&accept-language=en,nl`);
      const data = await response.json();
      
      const apiResults: City[] = data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0],
        country: item.address.country || item.display_name.split(',').pop().trim(),
        slug: item.display_name.split(',')[0].toLowerCase().replace(/\s+/g, '-'),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));

      // Combine, avoid duplicates by name
      const combined: City[] = [...localMatches];
      apiResults.forEach((api) => {
        if (!combined.some(c => c.name.toLowerCase() === api.name.toLowerCase())) {
          combined.push(api);
        }
      });

      setResults(combined.slice(0, 8));
    } catch (error) {
      console.error("Location search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (city: City) => {
    const locationStr = `${city.name}, ${city.country}`;
    onChange(locationStr, { lat: city.lat || 0, lng: city.lng || 0 });
    setSearchTerm(locationStr);
    setIsOpen(false);
  };

  const detectLocation = () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en,nl`);
        const data = await response.json();
        
        const cityName = data.address.city || data.address.town || data.address.village || "Current Location";
        const country = data.address.country || "";
        const locationStr = country ? `${cityName}, ${country}` : cityName;
        
        onChange(locationStr, { lat: latitude, lng: longitude });
        setSearchTerm(locationStr);
        setIsOpen(false);
      } catch (err) {
        console.error("Reverse geocode error:", err);
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      setIsLoading(false);
    });
  };

  return (
    <div className={cn("space-y-1 relative", className)} ref={containerRef}>
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? <Search className="w-4 h-4 text-primary animate-pulse" /> : <Search className="w-4 h-4 text-slate-300" />}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-sm font-bold text-secondary outline-none focus:border-primary/20 transition-all"
          value={searchTerm}
          onFocus={() => {
            setIsOpen(true);
            if (searchTerm.length >= 2) searchLocations(searchTerm);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            setIsOpen(true);
            
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
              searchLocations(val);
            }, 400);

            if (val === '') {
                onChange('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm) {
               onChange(searchTerm);
               setIsOpen(false);
            }
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
           {searchTerm && (
            <button 
                onClick={(e) => {
                e.stopPropagation();
                setSearchTerm('');
                onChange('');
                setResults([]);
                }}
                className="p-1 text-slate-300 hover:text-slate-500"
            >
                <X className="w-3 h-3" />
            </button>
            )}
            <button
                type="button"
                onClick={detectLocation}
                className="p-2 bg-white rounded-xl text-primary hover:text-primary-dark transition-all shadow-sm border border-slate-100 active:scale-95"
                title="Use my current location"
            >
                <MapPin className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 py-2">
          {searchTerm.length < 2 && (
             <button
               onClick={detectLocation}
               className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors text-primary font-bold text-sm"
             >
               <MapPin className="w-4 h-4" /> Use my current location
             </button>
          )}
          {results.map(city => (
            <button
              key={city.id}
              onClick={() => handleSelect(city)}
              className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-none group"
            >
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">{city.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{city.country}</p>
              </div>
            </button>
          ))}
          {isOpen && searchTerm.length >= 2 && results.length === 0 && !isLoading && (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  No cities found. Try checking your spelling.
              </div>
          )}
        </div>
      )}
    </div>
  );
};
