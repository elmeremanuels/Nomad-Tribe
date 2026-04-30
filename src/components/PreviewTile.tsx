import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PreviewTileProps<T> {
  icon: LucideIcon;
  label: string;
  totalCount: number;
  accentColor: string;          // Tailwind class for icon background
  items: T[];                   // Pre-sliced to first 4
  renderItem: (item: T) => React.ReactNode;
  onItemClick: (item: T) => void;
  onSeeAll: () => void;
  emptyMessage: string;
}

export const PreviewTile = <T extends { id: string }>({
  icon: Icon,
  label,
  totalCount,
  accentColor,
  items,
  renderItem,
  onItemClick,
  onSeeAll,
  emptyMessage,
}: PreviewTileProps<T>) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 card-shadow overflow-hidden flex flex-col h-full">
    {/* Header */}
    <div className="p-5 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', accentColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl font-black text-secondary leading-none mt-1">
            {totalCount} <span className="text-[10px] font-bold text-slate-400">nearby</span>
          </p>
        </div>
      </div>
    </div>

    {/* Items list */}
    <div className="flex-1 px-2 pb-2 space-y-1 overflow-hidden">
      {items.length === 0 ? (
        <div className="px-3 py-8 text-center text-xs text-slate-400 font-medium">
          {emptyMessage}
        </div>
      ) : (
        items.slice(0, 4).map(item => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            {renderItem(item)}
          </button>
        ))
      )}
    </div>

    {/* CTA */}
    <button
      onClick={onSeeAll}
      className="w-full px-5 py-3.5 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1 mt-auto"
    >
      All {label}
      <ChevronRight className="w-3 h-3" />
    </button>
  </div>
);
