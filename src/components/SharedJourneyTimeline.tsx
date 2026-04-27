import React, { useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns';
import { Trip } from '../types';

interface SharedJourneyTimelineProps {
  userTrips: Trip[];
  otherTrips: Trip[];
}

export const SharedJourneyTimeline: React.FC<SharedJourneyTimelineProps> = ({ userTrips, otherTrips }) => {
  const months = useMemo(() => {
    const start = startOfMonth(new Date());
    return Array.from({ length: 6 }).map((_, i) => addMonths(start, i));
  }, []);

  const timelineStart = months[0];
  const timelineEnd = endOfMonth(months[5]);

  const overlaps = useMemo(() => {
    const results: { location: string; days: number }[] = [];
    userTrips.forEach(u => {
      const uLocName = u.location.toLowerCase();
      otherTrips.forEach(o => {
        const oLocName = o.location.toLowerCase();
        if (uLocName === oLocName) {
          const uStart = parseISO(u.startDate);
          const uEnd = parseISO(u.endDate);
          const oStart = parseISO(o.startDate);
          const oEnd = parseISO(o.endDate);

          const overlapStart = uStart > oStart ? uStart : oStart;
          const overlapEnd = uEnd < oEnd ? uEnd : oEnd;

          if (overlapStart <= overlapEnd) {
            results.push({
              location: u.location,
              days: differenceInDays(overlapEnd, overlapStart) + 1
            });
          }
        }
      });
    });
    return results;
  }, [userTrips, otherTrips]);

  const summary = overlaps.length > 0
    ? `You overlap in ${overlaps.map(o => `${o.location} (${o.days} days)`).join(' and ')}.`
    : "No overlapping dates found in the next 6 months.";

  const getDayPosition = (date: Date) => {
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const dayOffset = differenceInDays(date, timelineStart);
    return (dayOffset / totalDays) * 100;
  };

  const getTripWidth = (start: Date, end: Date) => {
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const duration = differenceInDays(end, start) + 1;
    return (duration / totalDays) * 100;
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 card-shadow space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-black text-secondary uppercase tracking-[0.2em]">Shared Journey Timeline</h3>
          <p className="text-sm font-medium text-slate-500">{summary}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Them</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Overlap</span>
          </div>
        </div>
      </div>

      <div className="relative pt-10 pb-6">
        {/* Month Labels */}
        <div className="absolute top-0 left-0 w-full flex border-b border-slate-50 pb-3">
          {months.map(m => (
            <div key={m.toISOString()} className="flex-1 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">
              {format(m, 'MMMM')}
            </div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div className="relative h-32 mt-6 bg-slate-50/50 rounded-[2rem] overflow-hidden border border-slate-100">
          {/* Vertical Grid Lines */}
          {months.map((m, i) => (
            <div 
              key={`grid-${i}`} 
              className="absolute top-0 bottom-0 border-l border-slate-200/50" 
              style={{ left: `${(i / 6) * 100}%` }} 
            />
          ))}

          {/* User Trips (Blue) */}
          <div className="absolute top-6 left-0 w-full h-8">
            {userTrips.map(t => {
              const start = parseISO(t.startDate);
              const end = parseISO(t.endDate);
              if (start > timelineEnd || end < timelineStart) return null;
              
              const displayStart = start < timelineStart ? timelineStart : start;
              const displayEnd = end > timelineEnd ? timelineEnd : end;

              return (
                <div 
                  key={t.id}
                  className="absolute h-full bg-primary rounded-xl flex items-center px-3 shadow-lg shadow-primary/20 z-10"
                  style={{ 
                    left: `${getDayPosition(displayStart)}%`, 
                    width: `${getTripWidth(displayStart, displayEnd)}%` 
                  }}
                >
                  <span className="text-[9px] font-black text-white truncate uppercase tracking-wider">{t.location}</span>
                </div>
              );
            })}
          </div>

          {/* Other Trips (Orange) */}
          <div className="absolute top-18 left-0 w-full h-8">
            {otherTrips.map(t => {
              const start = parseISO(t.startDate);
              const end = parseISO(t.endDate);
              if (start > timelineEnd || end < timelineStart) return null;

              const displayStart = start < timelineStart ? timelineStart : start;
              const displayEnd = end > timelineEnd ? timelineEnd : end;

              return (
                <div 
                  key={t.id}
                  className="absolute h-full bg-accent rounded-xl flex items-center px-3 shadow-lg shadow-accent/20 z-10"
                  style={{ 
                    left: `${getDayPosition(displayStart)}%`, 
                    width: `${getTripWidth(displayStart, displayEnd)}%` 
                  }}
                >
                  <span className="text-[9px] font-black text-white truncate uppercase tracking-wider">{t.location}</span>
                </div>
              );
            })}
          </div>

          {/* Overlap Highlights (Bright Green) */}
          {userTrips.map(u => otherTrips.map(o => {
            const uLocName = u.location.toLowerCase();
            const oLocName = o.location.toLowerCase();
            if (uLocName !== oLocName) return null;
            const uStart = parseISO(u.startDate);
            const uEnd = parseISO(u.endDate);
            const oStart = parseISO(o.startDate);
            const oEnd = parseISO(o.endDate);
            
            const overlapStart = uStart > oStart ? uStart : oStart;
            const overlapEnd = uEnd < oEnd ? uEnd : oEnd;

            if (overlapStart <= overlapEnd) {
              const displayStart = overlapStart < timelineStart ? timelineStart : overlapStart;
              const displayEnd = overlapEnd > timelineEnd ? timelineEnd : overlapEnd;

              if (displayStart <= displayEnd) {
                return (
                  <div 
                    key={`${u.id}-${o.id}`}
                    className="absolute top-0 bottom-0 bg-green-500/30 border-x-2 border-green-500/50 z-0 animate-pulse"
                    style={{ 
                      left: `${getDayPosition(displayStart)}%`, 
                      width: `${getTripWidth(displayStart, displayEnd)}%` 
                    }}
                  />
                );
              }
            }
            return null;
          }))}
        </div>
      </div>
    </div>
  );
};
