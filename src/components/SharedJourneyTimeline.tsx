import React, { useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns';
import { Trip } from '../types';
import { Plane } from 'lucide-react';
import { cn } from '../lib/utils';

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
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 card-shadow space-y-10 overflow-hidden relative group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Plane className="w-5 h-5 flex-shrink-0" />
             </div>
             <h3 className="text-sm font-black text-secondary uppercase tracking-[0.25em]">Shared Journey Timeline</h3>
          </div>
          <p className="text-base font-bold text-slate-500 max-w-lg leading-relaxed">{summary}</p>
        </div>
        
        <div className="flex flex-wrap gap-6 bg-slate-50/80 backdrop-blur-sm p-4 rounded-[2rem] border border-slate-100/50 self-start md:self-auto">
          <LegendItem color="bg-primary" label="You" />
          <LegendItem color="bg-accent" label="Them" />
          <LegendItem color="bg-emerald-500" label="Overlap" pulse />
        </div>
      </div>

      <div className="relative pt-12 pb-4">
        {/* Month Headings */}
        <div className="flex mb-8 border-b border-slate-100/50">
          {months.map((m, i) => (
            <div key={m.toISOString()} className={cn(
              "flex-1 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
              i === 0 ? "text-primary" : "text-slate-300"
            )}>
              {format(m, 'MMM')}
            </div>
          ))}
        </div>

        {/* The Track */}
        <div className="relative h-40 bg-slate-50/50 rounded-[2.5rem] border border-slate-100/80 group/track overflow-hidden">
          {/* Grid lines */}
          {months.map((_, i) => (
            <div 
              key={`grid-${i}`} 
              className="absolute top-0 bottom-0 border-l border-slate-200/30" 
              style={{ left: `${(i / 6) * 100}%` }} 
            />
          ))}

          {/* User Swimlane */}
          <div className="absolute top-8 left-0 w-full h-10 px-1">
            {userTrips.map(t => {
              const start = parseISO(t.startDate);
              const end = parseISO(t.endDate);
              if (start > timelineEnd || end < timelineStart) return null;
              const displayStart = start < timelineStart ? timelineStart : start;
              const displayEnd = end > timelineEnd ? timelineEnd : end;

              return (
                <div 
                  key={t.id}
                  className="absolute h-full bg-primary rounded-2xl flex items-center px-4 shadow-xl shadow-primary/20 z-10 transition-transform hover:scale-[1.02] cursor-default border-2 border-white/20"
                  style={{ 
                    left: `${getDayPosition(displayStart)}%`, 
                    width: `${getTripWidth(displayStart, displayEnd)}%` 
                  }}
                >
                  <span className="text-[10px] font-black text-white truncate uppercase tracking-widest">{t.location}</span>
                </div>
              );
            })}
          </div>

          {/* Other Swimlane */}
          <div className="absolute top-22 left-0 w-full h-10 px-1">
            {otherTrips.map(t => {
              const start = parseISO(t.startDate);
              const end = parseISO(t.endDate);
              if (start > timelineEnd || end < timelineStart) return null;
              const displayStart = start < timelineStart ? timelineStart : start;
              const displayEnd = end > timelineEnd ? timelineEnd : end;

              return (
                <div 
                  key={t.id}
                  className="absolute h-full bg-accent rounded-2xl flex items-center px-4 shadow-xl shadow-accent/20 z-10 transition-transform hover:scale-[1.02] cursor-default border-2 border-white/20"
                  style={{ 
                    left: `${getDayPosition(displayStart)}%`, 
                    width: `${getTripWidth(displayStart, displayEnd)}%` 
                  }}
                >
                  <span className="text-[10px] font-black text-white truncate uppercase tracking-widest">{t.location}</span>
                </div>
              );
            })}
          </div>

          {/* Overlap Highlights */}
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
                    className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-500/30 z-0"
                    style={{ 
                      left: `${getDayPosition(displayStart)}%`, 
                      width: `${getTripWidth(displayStart, displayEnd)}%` 
                    }}
                  >
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                  </div>
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

const LegendItem = ({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <div className={cn("w-3 h-3 rounded-full shadow-sm", color, pulse && "animate-pulse ring-4 ring-emerald-500/20")} />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
  </div>
);
