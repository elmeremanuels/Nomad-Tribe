import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Briefcase, Rocket, Globe, Users, Star, Lock } from 'lucide-react';
import { useNomadStore } from '../store';

interface CollabPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  reason?:
    | 'collab-mode'
    | 'post-collab-ask'
    | 'post-in-collab-topic'
    | 'post-opportunity'
    | 'post-meeting'
    | 'collab-marketplace';
}

const REASON_COPY: Record<NonNullable<CollabPaywallProps['reason']>, { title: string; subtitle: string }> = {
  'collab-mode': {
    title: 'Unlock Collab Mode',
    subtitle: 'See the professional side of the Tribe — workspaces, founders, opportunities, and more.',
  },
  'post-collab-ask': {
    title: 'Post your first Collab Ask',
    subtitle: 'Tell the Tribe what you need. Find a co-builder, mentor, or help with a project.',
  },
  'post-in-collab-topic': {
    title: 'Join the conversation',
    subtitle: 'Premium members can post in Business, Tools, and Founder Spaces.',
  },
  'post-opportunity': {
    title: 'Post your opportunity',
    subtitle: 'Reach 1,000+ nomad founders, freelancers, and operators worldwide.',
  },
  'post-meeting': {
    title: 'Schedule a professional meeting',
    subtitle: 'Organize coworking days, founder dinners, and meetups.',
  },
  'collab-marketplace': {
    title: 'Sell professional services',
    subtitle: 'List consulting hours, design work, code reviews, and more.',
  },
};

export const CollabPaywall = ({ isOpen, onClose, reason = 'collab-mode' }: CollabPaywallProps) => {
  const { currentUser, updateProfile } = useNomadStore();
  const copy = REASON_COPY[reason] || REASON_COPY['collab-mode'];

  const handleStartTrial = async () => {
    if (!currentUser) return;
    await updateProfile({
      isPremium: true,
      premiumType: 'TRIAL',
      premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    onClose();
  };

  const features = [
    { icon: <Briefcase className="w-5 h-5" />, text: "Professional Collab Mode" },
    { icon: <Rocket className="w-5 h-5" />, text: "Post Opportunities & Gigs" },
    { icon: <Globe className="w-5 h-5" />, text: "Global Network Exposure" },
    { icon: <Users className="w-5 h-5" />, text: "Skill-based Founder Matching" },
    { icon: <Star className="w-5 h-5" />, text: "Premium Badge & Visibility" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-secondary/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header Image/Pattern */}
            <div className="h-32 bg-primary flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              </div>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-secondary leading-tight">{copy.title}</h2>
                <p className="text-slate-500 font-medium">{copy.subtitle}</p>
              </div>

              <div className="space-y-4 mb-8">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                      {f.icon}
                    </div>
                    <span className="font-bold text-slate-700">{f.text}</span>
                    <Check className="w-5 h-5 text-emerald-500 ml-auto" />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleStartTrial}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all"
                >
                  Start 30-Day Free Trial
                </button>
                <button 
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all text-sm"
                >
                  Already a member? Restore purchase
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">
                  Then €24.99/mo • Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
