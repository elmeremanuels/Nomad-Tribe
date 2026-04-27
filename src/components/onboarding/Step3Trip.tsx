import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { MapPin, Calendar, Plus, X, Search } from 'lucide-react';
import { Trip, PlaceResult } from '../../types';
import { PlacesAutocomplete } from '../PlacesAutocomplete';

interface Step3Props {
  trips: Trip[];
  onChange: (trips: Trip[]) => void;
}

export const Step3Trip: React.FC<Step3Props> = ({ trips, onChange }) => {
  const addTrip = () => {
    if (trips.length >= 3) return;
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const newTrip: Trip = {
      id: `trip_${Date.now()}`,
      familyId: '', // Set by store
      location: '',
      lat: 0,
      lng: 0,
      startDate,
      endDate
    };
    onChange([...trips, newTrip]);
  };

  const removeTrip = (id: string) => {
    onChange(trips.filter(t => t.id !== id));
  };

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    onChange(trips.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-6">
        {trips.map((trip, index) => (
          <div key={trip.id} className="p-6 bg-white rounded-3xl border-2 border-slate-100 space-y-6 relative group">
            {trips.length > 1 && (
              <div className="absolute top-0 right-0 p-2">
                <button 
                  onClick={() => removeTrip(trip.id)}
                  className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-secondary">{index === 0 ? 'Your Current/Next Destination' : `Destination #${index + 1}`}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Where to meet the tribe</p>
              </div>
            </div>

            <div className="space-y-4">
              <PlacesAutocomplete 
                label="Location"
                placeholder="Where are you going? (e.g. Bali, Indonesia)"
                value={trip.place || null}
                searchType="cities"
                onChange={(place) => {
                  if (place) {
                    updateTrip(trip.id, {
                      place,
                      location: `${place.city}, ${place.country}`,
                      lat: place.lat,
                      lng: place.lng,
                      citySlug: place.city.toLowerCase().replace(/\s+/g, '-'),
                      countryCode: place.countryCode
                    });
                  } else {
                    updateTrip(trip.id, {
                      place: undefined,
                      location: '',
                      lat: 0,
                      lng: 0,
                      citySlug: undefined,
                      countryCode: undefined
                    });
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-xs font-bold text-secondary outline-none focus:border-primary/20 transition-all"
                      value={trip.startDate}
                      min={new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => updateTrip(trip.id, { startDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                    <button 
                      onClick={() => {
                        const start = new Date(trip.startDate);
                        const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
                        updateTrip(trip.id, { endDate: end.toISOString().split('T')[0] });
                      }}
                      className="text-[9px] font-black text-primary hover:underline uppercase"
                    >
                      I don't know
                    </button>
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-xs font-bold text-secondary outline-none focus:border-primary/20 transition-all"
                      value={trip.endDate}
                      min={new Date(new Date(trip.startDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => updateTrip(trip.id, { endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {trips.length < 3 && (
          <button
            onClick={addTrip}
            className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.99]"
          >
            <Plus className="w-5 h-5" /> Add Another Destination
          </button>
        )}
      </div>
    </div>
  );
};
