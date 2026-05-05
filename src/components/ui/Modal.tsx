import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
  fullScreen?: boolean;
}

export const Modal = React.memo(({ isOpen, onClose, title, children, dark, fullScreen }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className={cn("fixed inset-0 z-[100] flex items-center justify-center", fullScreen ? "p-0" : "p-4")}>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        <motion.div 
          initial={fullScreen ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }} 
          animate={fullScreen ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }} 
          exit={fullScreen ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "relative w-full overflow-hidden transition-colors flex flex-col",
            fullScreen ? "h-full max-w-full rounded-none" : "max-w-md rounded-3xl card-shadow",
            dark ? "bg-[#004d55] text-white" : "bg-white text-secondary"
          )}
        >
          <div className={cn(
            "p-6 border-b flex justify-between items-center shrink-0",
            dark ? "border-white/10" : "border-slate-100"
          )}>
            <h2 className={cn("text-xl font-bold", dark ? "text-white" : "text-secondary")}>{title}</h2>
            <button onClick={onClose} className={cn(
              "p-2 rounded-full transition-colors",
              dark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            )}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={cn(
            "overflow-y-auto no-scrollbar",
            fullScreen ? "p-4 md:p-8 flex-1" : "p-6 max-h-[70vh]"
          )}>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
));
