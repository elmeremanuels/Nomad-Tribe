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
    if (text.length < 3) {
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
        lat: 0,
        lng: 0
      }));

      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`);
      const data = await response.json();
      
      const apiResults: City[] = data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.display_name.split(',')[0],
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

      setResults(combined.slice(0, 6));
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
            if (searchTerm.length >= 3) searchLocations(searchTerm);
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
        {searchTerm && (
          <button 
            onClick={() => {
              setSearchTerm('');
              onChange('');
              setResults([]);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && searchTerm.length >= 2 && results.length > 0 && (
        <div className="absolute z-[100] w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
        </div>
      )}
    </div>
  );
};
