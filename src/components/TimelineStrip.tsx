import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { LocationNode } from '../lib/timeline';

interface TimelineStripProps {
  timeline: LocationNode[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  dark?: boolean;
}

export const TimelineStrip: React.FC<TimelineStripProps> = ({
  timeline,
  activeIndex,
  setActiveIndex,
  dark
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeChip = container.children[activeIndex] as HTMLElement;
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex]);

  const prev = () => setActiveIndex(activeIndex <= 0 ? timeline.length - 1 : activeIndex - 1);
  const next = () => setActiveIndex(activeIndex >= timeline.length - 1 ? 0 : activeIndex + 1);

  const truncate = (str: string, max = 10) =>
    str.length > max ? str.slice(0, max) + '…' : str;

  if (timeline.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
          dark 
            ? "bg-white/5 border-white/10 text-white/40 hover:text-white" 
            : "bg-white border-slate-100 text-slate-400 hover:text-black shadow-sm"
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar max-w-[130px] py-1 px-1"
      >
        {timeline.map((node, i) => {
          const isActive = i === activeIndex;
          
          let colorClass = "";
          if (node.type === 'current') {
            colorClass = isActive 
              ? "bg-[#006d77] text-white border-[#006d77] shadow-md shadow-[#006d77]/10" 
              : "bg-white text-[#006d77] border-[#006d77]/20 hover:border-[#006d77]/40";
          } else if (node.type === 'future') {
            colorClass = isActive 
              ? "bg-[#e2725b] text-white border-[#e2725b] shadow-md shadow-[#e2725b]/10" 
              : "bg-white text-[#e2725b] border-[#e2725b]/20 hover:border-[#e2725b]/40";
          } else {
            colorClass = isActive 
              ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-black/10" 
              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300";
          }

          if (dark && !isActive) {
            colorClass = node.type === 'current' 
              ? "bg-white/10 text-white border-white/20" 
              : node.type === 'future' 
                ? "bg-white/10 text-[#e9c46a] border-[#e9c46a]/30"
                : "bg-white/5 text-white/20 border-white/5";
          }

          return (
            <button
              key={node.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl cursor-pointer transition-all border text-center w-[80px]',
                colorClass,
                isActive ? "z-10" : "opacity-60"
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                {truncate(node.label.split(',')[0])}
              </span>
              <span className={cn(
                'text-[8px] font-bold mt-1 leading-none uppercase tracking-tighter',
                isActive ? 'opacity-80' : 'opacity-40'
              )}>
                {node.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={next}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 border",
          dark 
            ? "bg-white/5 border-white/10 text-white/40 hover:text-white" 
            : "bg-white border-slate-100 text-slate-400 hover:text-black shadow-sm"
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
