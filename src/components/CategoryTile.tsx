import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface CategoryTileProps {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
  color: string;
  collabMode?: boolean;
  onClick: () => void;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({
  label,
  count,
  icon: Icon,
  color,
  collabMode,
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border transition-all text-center",
        collabMode 
          ? "bg-white/5 border-white/10 hover:bg-white/10" 
          : "bg-white border-slate-100 card-shadow hover:shadow-xl"
      )}
    >
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        <Icon className="w-7 h-7" />
      </div>
      
      <div className="space-y-1">
        <p className={cn(
          "text-xs font-black uppercase tracking-widest",
          collabMode ? "text-white" : "text-secondary"
        )}>
          {label}
        </p>
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em]",
          collabMode ? "text-white/40" : "text-slate-400"
        )}>
          {count} Available
        </p>
      </div>
      
      {count > 0 && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
      )}
    </motion.button>
  );
};
