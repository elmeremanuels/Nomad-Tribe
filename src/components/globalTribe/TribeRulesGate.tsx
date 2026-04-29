import React, { useState } from 'react';
import { useNomadStore } from '../../store';
import { Shield, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TribeRulesGate = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, acceptTribeRules } = useNomadStore();
  const [accepted, setAccepted] = useState(false);

  if (!currentUser) return null;
  if (currentUser.hasAcceptedTribeRules) return <>{children}</>;

  const rules = [
    { title: "No Zero-Value Spam", desc: "Don't post just 'following' or 'me too'. Every post should add value." },
    { title: "Privacy First", desc: "Never share exact locations of other families without consent." },
    { title: "Kindness & Respect", desc: "No hate speech, bullying, or aggressive arguments. We are a tribe." },
    { title: "Moderator Authority", desc: "Moderators have the final say in maintaining the community's quality." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-secondary tracking-tight">Tribe Rules</h2>
          <p className="text-slate-400 font-medium text-sm mt-2">Please accept our community guidelines before joining the Global Tribe.</p>
        </div>

        <div className="space-y-4 mb-8">
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm border border-slate-100 flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest">{rule.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-all">
            <input 
              type="checkbox" 
              checked={accepted} 
              onChange={e => setAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-slate-200 text-primary focus:ring-primary"
            />
            <span className="text-xs font-bold text-slate-500 group-hover:text-secondary transition-colors">I agree to follow the Tribe Rules and respect the community.</span>
          </label>

          <button
            onClick={() => accepted && acceptTribeRules()}
            disabled={!accepted}
            className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg ${
              accepted 
                ? "bg-primary text-white shadow-primary/20 hover:-translate-y-0.5" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            Join Global Tribe
          </button>
        </div>
      </motion.div>
    </div>
  );
};
