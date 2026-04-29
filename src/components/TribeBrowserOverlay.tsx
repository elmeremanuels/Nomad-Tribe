import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Calendar, List, Plus, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spot, PopUpEvent, MarketItem, FamilyProfile, CollabAsk } from '../types';

interface TribeBrowserOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onAdd?: () => void;
  showToggle?: boolean;
  isCalendarView?: boolean;
  onToggleView?: (view: boolean) => void;
  collabMode?: boolean;
}

export const TribeBrowserOverlay: React.FC<TribeBrowserOverlayProps> = ({
  isOpen,
  onClose,
  category,
  title,
  icon,
  children,
  onAdd,
  showToggle,
  isCalendarView,
  onToggleView,
  collabMode
}) => {
  const [search, setSearch] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-50/95 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {icon}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-secondary">{title}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{category}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showToggle && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => onToggleView?.(false)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      !isCalendarView ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleView?.(true)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      isCalendarView ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="px-6 py-3 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Post New
                </button>
              )}
            </div>
          </div>

          {/* Filters/Search */}
          <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar bg-white/50 border-b border-slate-100">
             <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-100 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                />
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
