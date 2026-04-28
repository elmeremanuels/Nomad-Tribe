import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface DateRangePickerProps {
  startDate: string; // ISO 'YYYY-MM-DD'
  endDate: string;   // ISO 'YYYY-MM-DD'
  onChange: (start: string, end: string) => void;
  minDate?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  minDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selecting, setSelecting] = useState<'start' | 'end'>(startDate && !endDate ? 'end' : 'start');
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2 = viewMonth === 11 ? viewYear + 1 : viewYear;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDayClick = (dateStr: string) => {
    if (minDate && dateStr < minDate) return;

    if (selecting === 'start') {
      onChange(dateStr, '');
      setSelecting('end');
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, '');
        setSelecting('end');
      } else {
        onChange(startDate, dateStr);
        setSelecting('start');
        setIsOpen(false);
      }
    }
  };

  const MonthGrid = ({ month, year }: { month: number; year: number }) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty cells for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      days.push(dateStr);
    }

    return (
      <div className="flex-1">
        <div className="text-center mb-4">
          <span className="text-sm font-black text-slate-800">{MONTH_NAMES[month]} {year}</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(d => (
            <div key={d} className="text-[10px] font-black text-slate-400 uppercase text-center py-1">{d}</div>
          ))}
          {days.map((dateStr, idx) => {
            if (!dateStr) return <div key={`empty-${idx}`} />;

            const isStart = dateStr === startDate;
            const isEnd = dateStr === endDate;
            const inRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isPast = minDate && dateStr < minDate;
            const isHovering = selecting === 'end' && startDate && !endDate && hoverDate && dateStr > startDate && dateStr <= hoverDate;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast}
                onMouseEnter={() => setHoverDate(dateStr)}
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  "relative h-9 w-full text-xs font-bold transition-all flex items-center justify-center rounded-xl",
                  isPast ? "text-slate-200 cursor-not-allowed" : "text-slate-700 hover:bg-slate-100",
                  isToday && !isStart && !isEnd && "underline decoration-[#e2725b] decoration-2 underline-offset-4",
                  (isStart || isEnd) && "bg-[#006d77] text-white rounded-xl shadow-md z-10",
                  inRange && "bg-[#006d77]/10 text-[#006d77] rounded-none",
                  isHovering && !isStart && !isEnd && "bg-[#006d77]/5 text-[#006d77]",
                  isStart && endDate && "rounded-r-none",
                  isEnd && startDate && "rounded-l-none"
                )}
              >
                {dateStr.split('-')[2]}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left group"
      >
        <CalendarIcon className="w-4 h-4 text-[#006d77] flex-shrink-0 group-hover:scale-110 transition-transform" />
        <div className="flex-1 min-w-0">
          {startDate && endDate ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Travel Dates</span>
              <span className="font-black text-sm text-slate-800">
                {formatDisplay(startDate)} — {formatDisplay(endDate)}
              </span>
            </div>
          ) : startDate ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Select Return</span>
              <span className="font-black text-sm text-[#006d77]">
                {formatDisplay(startDate)} — <span className="text-slate-300">Choose...</span>
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-sm font-medium">Select travel dates</span>
          )}
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onChange('', '');
              setSelecting('start');
            }}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 sm:absolute sm:inset-auto sm:left-0 sm:top-full mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-[150] sm:min-w-[580px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              type="button"
              className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex gap-40 text-center">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{MONTH_NAMES[month2]} {year2}</span>
            </div>
            <div className="sm:hidden text-sm font-black text-slate-400 uppercase tracking-widest">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              onClick={nextMonth}
              type="button"
              className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-black transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <MonthGrid month={viewMonth} year={viewYear} />
            <div className="hidden sm:block w-px bg-slate-50" />
            <div className="hidden sm:block flex-1">
              <MonthGrid month={month2} year={year2} />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#e2725b]">
              {selecting === 'start' ? 'Select departure' : 'Select return'}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onChange('', '');
                  setSelecting('start');
                }}
                className="px-4 py-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-[#006d77] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#006d77]/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
