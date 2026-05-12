import React, { useState, useMemo, useEffect } from 'react';
import { useNomadStore } from '../../store';
import { usePostingAccess } from '../../hooks/usePostingAccess';
import { FamilyPostingPaywall } from '../FamilyPostingPaywall';
import { Search, Globe, Plus, Hash, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { SpaceCard } from './SpaceCard';
import { SpaceDetailView } from './SpaceDetailView';
import { NewSpaceModal } from './NewSpaceModal';
import { getTopicIcon } from '../../lib/topicIcons';


interface GlobalTribeViewProps {
  onReport?: (id: string, type: 'Thread' | 'ThreadReply' | 'User') => void;
}

export const GlobalTribeView: React.FC<GlobalTribeViewProps> = ({ onReport }) => {
  const { 
    topics, 
    threads, 
    currentUser, 
    topicFollows, 
    hashtagFollows, 
    hashtags,
    seedTopics,
    setIsFamilyPaywallOpen,
    setPaywallReason,
    collabMode
  } = useNomadStore();
  const { canPostInFamilyMode } = usePostingAccess();
  
  const [activeTab, setActiveTab] = useState<'home' | 'following' | 'all' | string>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'active'>('hot');
  const [view, setView] = useState<{ type: 'list' | 'detail', id?: string }>({ type: 'list' });
  const [isNewSpaceModalOpen, setIsNewSpaceModalOpen] = useState(false);

  const activeTopic = topics.find(t => t.id === activeTab);

  // Force New sort for social topics
  useEffect(() => {
    if (activeTopic?.type === 'social') {
      setSortBy('new');
    }
  }, [activeTopic?.id]);

  // Sorting logic
  const calculateHotScore = (thread: any) => {
    const score = (thread.votes?.up?.length || 0) - (thread.votes?.down?.length || 0);
    const ageHours = (Date.now() - new Date(thread.createdAt).getTime()) / (1000 * 60 * 60);
    return score / Math.pow(ageHours / 12 + 2, 1.5);
  };

  const filteredThreads = useMemo(() => {
    if (activeTab === 'home') return [];

    let result = [...threads].filter(t => t.status !== 'removed' && t.status !== 'hidden');

    // Tab filtering
    if (activeTab === 'following') {
      const followedTopics = topicFollows.map(f => f.topicId);
      const followedTags = hashtagFollows.map(f => f.hashtag);
      result = result.filter(t => 
        followedTopics.includes(t.topicId) || 
        (t.hashtags || []).some((h: string) => followedTags.includes(h))
      );
    } else if (activeTab !== 'all') {
      result = result.filter(t => t.topicId === activeTab);
    }

    // Hashtag filtering
    if (selectedHashtag) {
      result = result.filter(t => (t.hashtags || []).includes(selectedHashtag));
    }

    // Search filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.body.toLowerCase().includes(q) ||
        (t.hashtags || []).some((h: string) => h.includes(q))
      );
    }

    // Sorting
    if (activeTopic?.type === 'social') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      if (sortBy === 'hot') {
        result.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
      } else if (sortBy === 'new') {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === 'active') {
        result.sort((a, b) => (b.activeUserCount || 0) - (a.activeUserCount || 0));
      }
    }

    return result;
  }, [threads, activeTab, selectedHashtag, searchQuery, sortBy, topicFollows, hashtagFollows, activeTopic]);

  const trendingHashtags = useMemo(() => {
    return [...hashtags]
      .sort((a, b) => b.weeklyCount - a.weeklyCount)
      .slice(0, 10);
  }, [hashtags]);

  if (view.type === 'detail' && view.id) {
    return (
      <SpaceDetailView 
        threadId={view.id} 
        onBack={() => setView({ type: 'list' })} 
        onReport={onReport}
      />
    );
  }

  return (
    <div className={cn(
      "min-h-screen space-y-4 max-w-7xl mx-auto pb-24 transition-colors duration-500",
      collabMode ? "bg-[#006d77] text-white" : "bg-slate-50/50 text-slate-900"
    )}>
      {/* Header Hub */}
      <header className={cn(
        "px-4 py-4 md:p-6 border-b sticky top-0 z-40 backdrop-blur-md transition-colors",
        collabMode 
          ? "bg-[#006d77]/90 border-white/10" 
          : "bg-white/90 border-slate-100 shadow-sm"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('home')}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg rotate-3 hover:rotate-0 transition-all",
                collabMode ? "bg-white text-[#006d77]" : "bg-primary text-white shadow-primary/20"
              )}
            >
              <Users className="w-6 h-6" />
            </button>
            <div onClick={() => setActiveTab('home')} className="cursor-pointer">
              <h1 className={cn("text-2xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>
                {collabMode ? "Collab Network" : "Global Tribe"}
              </h1>
              <p className={cn("font-bold text-xs", collabMode ? "text-white/60" : "text-slate-500")}>
                {activeTab === 'home' 
                  ? (collabMode ? 'Connect with nomad founders' : 'Knowledge base for families') 
                  : (activeTopic?.name || activeTab)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group flex-1 md:w-80">
                <Search className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", collabMode ? "text-white/40 group-focus-within:text-white" : "text-slate-300 group-focus-within:text-primary")} />
                <input 
                  type="text" 
                  placeholder="Search spaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border rounded-2xl text-xs font-bold transition-all focus:outline-none focus:ring-4",
                    collabMode 
                      ? "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:bg-white/20 focus:ring-white/10" 
                      : "bg-slate-50 border-slate-100 text-secondary focus:bg-white focus:ring-primary/10"
                  )}
                />
             </div>
             {activeTab !== 'home' && activeTab !== 'following' && activeTab !== 'all' && (
                <button 
                  onClick={() => {
                    if (!canPostInFamilyMode) {
                      setPaywallReason('post-thread');
                      setIsFamilyPaywallOpen(true);
                      return;
                    }
                    setIsNewSpaceModalOpen(true);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                    collabMode 
                      ? "bg-white text-[#006d77] shadow-xl hover:-translate-y-0.5" 
                      : "bg-primary text-white shadow-xl shadow-primary/20 hover:-translate-y-0.5"
                  )}
                >
                    <Plus className="w-4 h-4" /> New Space
                </button>
             )}
          </div>
        </div>

        {/* Categories Tab Row (Only when not on home) */}
        {activeTab !== 'home' && (
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            <TabButton 
              active={activeTab === 'following'} 
              onClick={() => setActiveTab('following')}
              label="Following" 
              icon={Users}
              collabMode={collabMode}
            />
            <TabButton 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
              label="All Spaces" 
              icon={Globe}
              collabMode={collabMode}
            />
            <div className={cn("w-px h-6 mx-2", collabMode ? "bg-white/10" : "bg-slate-100")} />
            {topics.map((topic: any) => (
              <TabButton 
                key={topic.id}
                active={activeTab === topic.id} 
                onClick={() => setActiveTab(topic.id)}
                label={topic.id === 'introductions' ? '👋 Intros' : topic.name} 
                topicId={topic.id}
                topicIcon={topic.icon}
                isLocked={topic.isLocked}
                collabMode={collabMode}
              />
            ))}
          </div>
        )}

        {/* Trending Hashtags */}
        {activeTab !== 'home' && activeTopic?.type !== 'social' && trendingHashtags.length > 0 && (
          <div className="mt-4 flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
            <span className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0", collabMode ? "text-white/40" : "text-slate-400")}>
              <TrendingUp className="w-3 h-3" /> Trending:
            </span>
            {trendingHashtags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedHashtag(selectedHashtag === tag.id ? null : tag.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border",
                  selectedHashtag === tag.id 
                    ? (collabMode ? "bg-white text-[#006d77] border-white shadow-lg" : "bg-secondary text-white border-secondary shadow-lg")
                    : (collabMode ? "bg-white/5 text-white/60 border-white/10 hover:bg-white/10" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100")
                )}
              >
                #{tag.id}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="px-4 max-w-7xl mx-auto space-y-6">
        {activeTab === 'home' ? (
          <div className="space-y-6 py-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CategoryTile 
                  title="Following"
                  description="Your personalized feed"
                  icon={<Users className="w-6 h-6" />}
                  color={collabMode ? "#ffffff" : "#6366f1"}
                  onClick={() => setActiveTab('following')}
                  collabMode={collabMode}
                />
                <CategoryTile 
                  title="All Spaces"
                  description="Browse everything happening in the tribe"
                  icon={<Globe className="w-6 h-6" />}
                  color={collabMode ? "#4db6ac" : "#14b8a6"}
                  onClick={() => setActiveTab('all')}
                  collabMode={collabMode}
                />
                {topics.map((topic: any) => {
                  const Icon = getTopicIcon(topic.icon || topic.id);
                  return (
                    <CategoryTile 
                      key={topic.id}
                      title={topic.name}
                      description={topic.description}
                      icon={Icon ? <Icon className="w-6 h-6" /> : null}
                      color={collabMode ? "#ffffff" : topic.color}
                      isLocked={topic.isLocked}
                      onClick={() => setActiveTab(topic.id)}
                      collabMode={collabMode}
                    />
                  );
                })}
             </div>

             {topics.length === 0 && currentUser?.role === 'SuperAdmin' && (
                <div className="p-12 bg-white border border-slate-100 rounded-[3rem] text-center space-y-6">
                   <h3 className="text-xl font-black text-secondary">No boards set up yet</h3>
                   <button onClick={() => seedTopics()} className="px-8 py-4 bg-primary text-white rounded-2xl font-black">
                     Seed Default Categories
                   </button>
                </div>
             )}
          </div>
        ) : (
          <>
            {/* Search/Sort Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
              {activeTopic?.type !== 'social' ? (
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", collabMode ? "text-white/40" : "text-slate-400")}>Sort by:</span>
                    <div className={cn("flex p-1 rounded-xl border", collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100")}>
                      <SortButton active={sortBy === 'hot'} onClick={() => setSortBy('hot')} label="Hot" collabMode={collabMode} />
                      <SortButton active={sortBy === 'new'} onClick={() => setSortBy('new')} label="New" collabMode={collabMode} />
                      <SortButton active={sortBy === 'active'} onClick={() => setSortBy('active')} label="Most Active" collabMode={collabMode} />
                    </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest italic", collabMode ? "text-white/40" : "text-slate-400")}>Sorted by newest intro</span>
                </div>
              )}
              
              {(searchQuery || selectedHashtag) && (
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedHashtag(null); }}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                    Clear Filters
                </button>
              )}
            </div>

            {/* Feed Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredThreads.map(thread => (
                <SpaceCard 
                  key={thread.id} 
                  thread={thread} 
                  topic={topics.find(t => t.id === thread.topicId)}
                  onClick={() => setView({ type: 'detail', id: thread.id })}
                  onReport={onReport}
                />
              ))}
            </div>

            {filteredThreads.length === 0 && (
              <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                    {(() => {
                        const Icon = activeTopic?.type === 'social' ? getTopicIcon('introductions') : Hash;
                        return <Icon className="w-10 h-10" />;
                    })()}
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-black tracking-tight", collabMode ? "text-white" : "text-secondary")}>
                      {activeTopic?.type === 'social' ? 'No intros yet!' : 'No spaces found'}
                    </h3>
                    <p className={cn("font-medium", collabMode ? "text-white/40" : "text-slate-400")}>
                      {activeTopic?.type === 'social' ? 'Be the first to introduce yourself!' : 'Try adjusting your filters or be the first to post!'}
                    </p>
                  </div>
              </div>
            )}
          </>
        )}
      </main>

      <NewSpaceModal 
        isOpen={isNewSpaceModalOpen} 
        onClose={() => setIsNewSpaceModalOpen(false)}
        activeTopic={topics.find(t => t.id === activeTab)}
      />
    </div>
  );
};

const CategoryTile = ({ title, description, icon, color, isLocked, onClick, collabMode }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "group relative flex flex-col items-start p-4 border transition-all text-left overflow-hidden h-full",
      collabMode 
        ? "bg-white/5 border-white/10 rounded-[1.5rem] shadow-none hover:bg-white/10 hover:-translate-y-1" 
        : "bg-white border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1"
    )}
  >
    <div 
      className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12"
      style={{ color }}
    >
      {icon}
    </div>
    
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg transition-transform group-hover:scale-110"
      style={collabMode ? { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' } : { backgroundColor: `${color}15`, color }}
    >
      {icon}
    </div>

    <div className="space-y-0.5">
      <h3 className={cn("text-sm font-black flex items-center gap-2", collabMode ? "text-white" : "text-secondary")}>
        {title}
        {isLocked && <span className="text-xs">🔒</span>}
      </h3>
      <p className={cn("text-[10px] font-medium leading-tight line-clamp-2", collabMode ? "text-white/60" : "text-slate-400")}>
        {description}
      </p>
    </div>

    <div className={cn(
      "mt-auto pt-3 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all",
      collabMode ? "text-white" : "text-primary"
    )}>
      Enter Board <span>→</span>
    </div>
  </button>
);

const TabButton = ({ active, onClick, label, topicId, icon, isLocked, topicIcon, collabMode }: any) => {
  const Icon = icon || (topicIcon ? getTopicIcon(topicIcon) : (topicId ? getTopicIcon(topicId) : null));
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
        active 
          ? (collabMode ? "bg-white text-[#006d77] shadow-xl" : "bg-secondary text-white shadow-xl shadow-secondary/10")
          : (collabMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {isLocked && <span className="ml-1 text-[10px]">🔒</span>}
    </button>
  );
};

const SortButton = ({ active, onClick, label, collabMode }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
      active 
        ? (collabMode ? "bg-white/20 text-white" : "bg-slate-100 text-secondary")
        : (collabMode ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600")
    )}
  >
    {label}
  </button>
);
