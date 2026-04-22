import React from 'react';
import { cn } from '../../lib/utils';
import { Sparkles, CheckCircle2, Calendar, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface Step5Props {
  onComplete: () => void;
  isLoading: boolean;
}

export const Step5Welcome: React.FC<Step5Props> = ({ onComplete, isLoading }) => {
  const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const perks = [
    { icon: <Zap className="w-4 h-4" />, text: "Family Matching Radar" },
    { icon: <ShieldCheck className="w-4 h-4" />, text: "Full Collab Mode" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Exclusive Spots & Deals" },
    { icon: <Calendar className="w-4 h-4" />, text: "Pop-Up Events" }
  ];

  return (
    <div className="space-y-8 py-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="w-24 h-24 bg-accent/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-accent shadow-2xl shadow-accent/20"
      >
        <Sparkles className="w-12 h-12" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black text-secondary tracking-tight">Welcome to the tribe! 🎉</h2>
        <p className="text-slate-500 font-medium max-w-[280px] mx-auto text-sm">
          Your 30-day free trial is now active. Both Family Mode and Collab Mode are fully unlocked — no credit card needed.
        </p>
      </div>

      <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border-2 border-slate-100">
        <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
          <CheckCircle2 className="w-4 h-4" />
          Trial Activated
        </div>
        <div className="grid grid-cols-2 gap-3 text-left">
          {perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
              <div className="text-accent">{perk.icon}</div>
              <span className="text-[10px] font-black text-secondary uppercase tracking-tight">{perk.text}</span>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-200">
           <p className="text-xs text-slate-400 font-bold">Free until <span className="text-secondary">{trialEnds}</span></p>
        </div>
      </div>

      <button
        disabled={isLoading}
        onClick={onComplete}
        className={cn(
          "w-full py-5 bg-primary text-white rounded-[2rem] font-black shadow-2xl shadow-primary/40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all group",
          isLoading && "opacity-50 cursor-wait"
        )}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Explore the tribe
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.div>
          </>
        )}
      </button>
    </div>
  );
};
