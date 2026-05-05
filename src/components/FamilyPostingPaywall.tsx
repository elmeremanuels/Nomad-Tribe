import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, CheckCircle2, MapPin, Calendar, ShoppingBag, 
  Search, MessageSquare, Reply 
} from 'lucide-react';
import { useNomadStore } from '../store';
import { Modal } from './ui/Modal';
import { startCheckout } from '../lib/checkout';

interface FamilyPostingPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'post-spot' | 'post-event' | 'post-market' | 'post-request' | 'post-thread' | 'post-reply' | 'generic';
}

const REASON_COPY = {
  'post-spot': {
    icon: MapPin,
    title: 'Recommend a spot to the Tribe',
    subtitle: 'Help other families discover your favorite playgrounds, restaurants, and gems.',
  },
  'post-event': {
    icon: Calendar,
    title: 'Host a meetup',
    subtitle: 'Bring nomad families together for playdates, dinners, and shared adventures.',
  },
  'post-market': {
    icon: ShoppingBag,
    title: 'List something for sale or swap',
    subtitle: 'Pass on outgrown gear, trade items with traveling families.',
  },
  'post-request': {
    icon: Search,
    title: 'Ask the Tribe for help',
    subtitle: 'Find a pediatrician, school recommendation, or local insider tip.',
  },
  'post-thread': {
    icon: MessageSquare,
    title: 'Start a conversation',
    subtitle: "Share what you've learned, ask questions in the global community.",
  },
  'post-reply': {
    icon: Reply,
    title: 'Reply to this space',
    subtitle: 'Add your perspective to the conversation.',
  },
  'generic': {
    icon: Lock,
    title: 'Unlock posting',
    subtitle: 'Join thousands of nomad families sharing tips, gear, and adventures.',
  },
};

export const FamilyPostingPaywall = ({ isOpen, onClose, reason }: FamilyPostingPaywallProps) => {
  const { appSettings, currentUser, addToast, setIsCollabPaywallOpen } = useNomadStore() as any;
  const price = appSettings.pricing?.familyPosting ?? 3.99;
  const currency = appSettings.pricing?.currency === 'USD' ? '$' : appSettings.pricing?.currency === 'GBP' ? '£' : '€';
  
  const copy = REASON_COPY[reason] || REASON_COPY.generic;
  const Icon = copy.icon;

  const handlePurchase = async () => {
    if (!currentUser) return;
    
    const result = await startCheckout('family-posting-unlock', currentUser.id);
    if (!result.success && result.error) {
      addToast(result.error, 'error');
    } else {
      addToast('Redirecting to checkout...', 'info');
      // In this environment, we simulate a successful purchase after a delay for demo purposes
      setTimeout(async () => {
        try {
          await useNomadStore.getState().updateProfile({
            familyPostingUnlocked: true,
            familyPostingUnlockedAt: new Date().toISOString(),
            familyPostingUnlockSource: 'one-time'
          });
          addToast('Family posting unlocked! Welcome to the active Tribe.', 'success');
          onClose();
        } catch (err) {
          console.error(err);
        }
      }, 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-w-md mx-auto py-4 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-secondary">{copy.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{copy.subtitle}</p>
        </div>

        {/* Price box */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">One-time payment</p>
            <p className="text-5xl font-black text-secondary">{currency}{price.toFixed(2)}</p>
            <p className="text-xs text-slate-500 font-bold">Posting unlocked forever</p>
          </div>
        </div>

        {/* What you get */}
        <ul className="space-y-2">
          {[
            'Recommend spots, host events, post in the marketplace',
            'Start threads and reply in Global Tribe',
            'Ask the Tribe for help (Live Requests)',
            'Track your journey with Past Places',
            'Save Vibe Checks for cities you visit',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-slate-600">{item}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={handlePurchase}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Unlock for {currency}{price.toFixed(2)}
        </button>

        {/* Soft sell to Collab */}
        <p className="text-[10px] text-center text-slate-400">
          Working remote? Check out{' '}
          <button 
            onClick={() => { onClose(); setIsCollabPaywallOpen(true); }} 
            className="text-primary font-black underline"
          >
            Collab Mode
          </button>{' '}
          — includes Family posting + business networking.
        </p>

        <button
          onClick={onClose}
          className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
};
