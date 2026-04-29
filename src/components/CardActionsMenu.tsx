import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export const CardActionsMenu = ({
  isOwn,
  onReport,
  onDelete,
  onEdit,
  dark = false
}: {
  isOwn: boolean;
  onReport: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  dark?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={cn(
          "p-1.5 rounded-lg transition-all",
          dark 
            ? "text-white/40 hover:text-white hover:bg-white/10" 
            : "text-slate-300 hover:text-slate-600 hover:bg-slate-50"
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute right-0 top-full mt-1 w-44 border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100",
            dark ? "bg-[#004d55] border-white/10" : "bg-white border-slate-100"
          )}>
            {isOwn && onEdit && (
              <button
                onClick={() => { onEdit(); setOpen(false); }}
                className={cn(
                  "w-full px-4 py-3 text-left text-xs font-bold transition-colors flex items-center gap-2",
                  dark ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
            {!isOwn && (
              <button
                onClick={() => { onReport(); setOpen(false); }}
                className="w-full px-4 py-3 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Report
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
