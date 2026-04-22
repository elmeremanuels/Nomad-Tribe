import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Briefcase, Search, Sparkles, Check, ChevronDown, Linkedin } from 'lucide-react';
import { CollabCard } from '../../types';
import occupationsSeed from '../../data/occupationsSeed.json';
import skillsSeed from '../../data/skillsSeed.json';
import { motion, AnimatePresence } from 'motion/react';

interface Step4Props {
  openToCollabs: boolean;
  collabCard: CollabCard;
  onModeChange: (open: boolean) => void;
  onCardChange: (field: keyof CollabCard, value: any) => void;
}

export const Step4Collab: React.FC<Step4Props> = ({ openToCollabs, collabCard, onModeChange, onCardChange }) => {
  const [occSearch, setOccSearch] = useState('');
  const [isOccOpen, setIsOccOpen] = useState(false);

  const filteredOccupations = occupationsSeed.filter(occ => 
    occ.name.toLowerCase().includes(occSearch.toLowerCase()) || 
    occ.category.toLowerCase().includes(occSearch.toLowerCase())
  );

  // Group by category
  const categories = Array.from(new Set(filteredOccupations.map(o => o.category)));

  const toggleSuperpower = (skill: string) => {
    const superpowers = collabCard.superpowers.includes(skill)
      ? collabCard.superpowers.filter(s => s !== skill)
      : [...collabCard.superpowers, skill].slice(0, 3);
    onCardChange('superpowers', superpowers);
  };

  const isValidLinkedIn = (url: string) => {
    if (!url) return true;
    return url.startsWith('https://linkedin.com') || url.startsWith('https://www.linkedin.com');
  };

  return (
    <div className="space-y-8 py-4">
      {/* 30 Days Trial Banner */}
      <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl group-hover:bg-amber-200/40 transition-all duration-700" />
        <div className="relative flex gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-amber-900 tracking-tight">Pioneer Business Trial Active</h3>
              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">30 Days Free</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-1">
              As a new member, you've unlocked all **Business & Networking** features for 30 days. This includes finding professional collaborations, listing on the local marketplace, and exclusive business networking events.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 block text-center">Business & Collaboration</label>
        
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onModeChange(true)}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group",
              openToCollabs 
                ? "border-primary bg-primary/10" 
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <div className="flex gap-4 items-center">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                openToCollabs ? "bg-primary text-white" : "bg-slate-50 text-slate-400"
              )}>
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className={cn("font-black", openToCollabs ? "text-primary" : "text-secondary")}>Enable Collab Mode (FREE Trial)</h3>
                <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">Show your professional superpowers & find business partners.</p>
              </div>
              {openToCollabs && <Check className="w-6 h-6 text-primary" />}
            </div>
          </button>

          <button
            onClick={() => onModeChange(false)}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group",
              !openToCollabs 
                ? "border-slate-400 bg-slate-50" 
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <div className="flex gap-4 items-center">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                !openToCollabs ? "bg-slate-400 text-white" : "bg-slate-50 text-slate-300"
              )}>
                <Check className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className={cn("font-black", !openToCollabs ? "text-secondary" : "text-slate-400")}>No, just family mode for now</h3>
                <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">You can always turn this on later in your profile.</p>
              </div>
              {!openToCollabs && <div className="w-6 h-6 rounded-full bg-slate-400" />}
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {openToCollabs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-8 overflow-hidden"
          >
            <div className="pt-4 border-t border-slate-100 space-y-8">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">What do you do? (Occupation)</label>
                <div 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all"
                  onClick={() => setIsOccOpen(!isOccOpen)}
                >
                  <span className={cn("text-sm font-bold", collabCard.occupation ? "text-secondary" : "text-slate-300")}>
                    {collabCard.occupation || "Search or select occupation..."}
                  </span>
                  <ChevronDown className={cn("w-5 h-5 text-slate-300 transition-transform", isOccOpen && "rotate-180")} />
                </div>

                <AnimatePresence>
                  {isOccOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 flex flex-col max-h-[300px]"
                    >
                      <div className="p-3 border-b border-slate-50 sticky top-0 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-slate-50 border-none rounded-xl p-3 pl-10 text-xs font-bold outline-none"
                            placeholder="Type to filter..."
                            value={occSearch}
                            onChange={(e) => setOccSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
                        {categories.map(cat => (
                          <div key={cat} className="space-y-1">
                            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-2">{cat}</h4>
                            <div className="grid grid-cols-1">
                              {filteredOccupations.filter(o => o.category === cat).map(occ => (
                                <button
                                  key={occ.id}
                                  onClick={() => {
                                    onCardChange('occupation', occ.name);
                                    setIsOccOpen(false);
                                  }}
                                  className={cn(
                                    "w-full p-3 rounded-xl text-sm font-bold text-left transition-colors",
                                    collabCard.occupation === occ.name ? "bg-primary/5 text-primary" : "hover:bg-slate-50 text-secondary"
                                  )}
                                >
                                  {occ.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your top 3 superpowers</label>
                  <span className="text-[10px] font-bold text-slate-400">{collabCard.superpowers.length} of 3 selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillsSeed.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSuperpower(skill)}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 text-[10px] font-bold transition-all flex items-center gap-2",
                        collabCard.superpowers.includes(skill)
                          ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                          : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {collabCard.superpowers.includes(skill) && <Sparkles className="w-3 h-3" />}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Current Mission</label>
                <input
                  type="text"
                  placeholder="Building a SaaS product for remote teams."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-secondary outline-none focus:border-primary/20 transition-all placeholder:text-slate-300"
                  value={collabCard.currentMission}
                  onChange={(e) => onCardChange('currentMission', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-1">
                  <Linkedin className="w-3 h-3 text-slate-400" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LinkedIn Profile</label>
                </div>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  className={cn(
                    "w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-secondary outline-none transition-all placeholder:text-slate-300",
                    collabCard.linkedInUrl && !isValidLinkedIn(collabCard.linkedInUrl) ? "border-red-200 focus:border-red-300" : "focus:border-primary/20"
                  )}
                  value={collabCard.linkedInUrl}
                  onChange={(e) => onCardChange('linkedInUrl', e.target.value)}
                />
                {collabCard.linkedInUrl && !isValidLinkedIn(collabCard.linkedInUrl) && (
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest px-1">Must start with https://linkedin.com</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
