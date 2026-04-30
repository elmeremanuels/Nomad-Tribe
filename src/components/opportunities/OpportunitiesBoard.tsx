import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  MessageSquare,
  Clock,
  Euro,
  Globe,
  Tag,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useNomadStore } from '../../store';
import { Opportunity, OpportunityType } from '../../types';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const OpportunityCard = ({ 
  opportunity, 
  onContact 
}: { 
  opportunity: Opportunity, 
  onContact: (posterId: string) => void 
}) => {
  const { profiles } = useNomadStore();
  const poster = profiles.find(p => p.id === opportunity.posterId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 p-6 space-y-4 hover:shadow-xl transition-all group"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
             <img 
               src={opportunity.posterPhoto || `https://picsum.photos/seed/${opportunity.posterId}/100/100`} 
               alt="" 
               className="w-full h-full object-cover" 
             />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#006d77]">
                {opportunity.type}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400">
                {formatDistanceToNow(new Date(opportunity.createdAt))} ago
              </span>
            </div>
            <h3 className="font-black text-secondary leading-tight group-hover:text-primary transition-colors">
              {opportunity.title}
            </h3>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 font-medium line-clamp-2">
        {opportunity.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {opportunity.skillTags.map(tag => (
          <span 
            key={tag}
            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 flex items-center gap-1.5"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            {opportunity.isRemote ? (
              <div className="flex items-center gap-1 text-[#006d77]">
                <Globe className="w-3 h-3" /> Remote
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {opportunity.city}, {opportunity.countryCode}
              </div>
            )}
          </div>
          {opportunity.compensation && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Euro className="w-3 h-3" /> 
              {opportunity.compensation.amount} 
              {opportunity.compensation.type === 'hourly' ? '/hr' : ' total'}
            </div>
          )}
        </div>

        <button 
          onClick={() => onContact(opportunity.posterId)}
          className="flex items-center gap-2 bg-[#006d77] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#006d77]/20"
        >
          Message
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const OpportunitiesBoard = () => {
  const { opportunities, profiles, currentUser, collabMode } = useNomadStore();
  const [filter, setFilter] = useState<OpportunityType | 'All'>('All');
  const [search, setSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => {
      const matchesFilter = filter === 'All' || o.type === filter;
      const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase()) || 
                           o.description.toLowerCase().includes(search.toLowerCase()) ||
                           o.skillTags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch && o.status === 'open';
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [opportunities, filter, search]);

  const stats = useMemo(() => {
    return {
      total: opportunities.filter(o => o.status === 'open').length,
      remote: opportunities.filter(o => o.status === 'open' && o.isRemote).length,
      gigs: opportunities.filter(o => o.status === 'open' && o.type === 'Gig').length
    };
  }, [opportunities]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Missions', value: stats.total, icon: Briefcase, color: 'text-primary bg-primary/10' },
          { label: 'Remote Gigs', value: stats.remote, icon: Globe, color: 'text-[#006d77] bg-[#006d77]/10' },
          { label: 'Talent Matches', value: '84%', icon: Zap, color: 'text-amber-500 bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-xl font-black text-secondary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text"
            placeholder="Search missions, skills, roles..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-secondary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          {['All', 'Gig', 'Partnership', 'Investment', 'Full-time'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === t 
                  ? "bg-secondary text-white shadow-lg shadow-secondary/20" 
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filteredOpportunities.length === 0 ? (
        <div className="py-20 text-center space-y-6 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto shadow-sm">
              <Briefcase className="w-10 h-10" />
           </div>
           <div className="space-y-2">
             <h3 className="text-xl font-black text-secondary">No missions found</h3>
             <p className="text-slate-400 font-medium max-w-xs mx-auto">Be the first to post a professional opportunity in this region!</p>
           </div>
           {currentUser?.isPremium && (
             <button 
               onClick={() => setIsPosting(true)}
               className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
             >
               Post Opportunity
             </button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map(opp => (
            <OpportunityCard 
              key={opp.id} 
              opportunity={opp} 
              onContact={(posterId) => {
                // Handle contact logic
              }}
            />
          ))}
        </div>
      )}

      <div className="p-8 bg-[#006d77] rounded-[3rem] text-white relative overflow-hidden group">
        <div className="relative z-10 space-y-4 max-w-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Verified Professional Ecosystem</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">Need a professional superpower?</h3>
          <p className="text-white/70 font-medium text-sm">
            NomadTribe Collab connects vetted family-business owners. Hire from the tribe, work with the tribe.
          </p>
          <button className="bg-white text-[#006d77] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
            Post an Opportunity
          </button>
        </div>
        <Zap className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 transition-transform group-hover:scale-110 duration-1000" />
      </div>
    </div>
  );
};
