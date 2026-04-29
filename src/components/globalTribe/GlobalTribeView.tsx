import React, { useState, useMemo, useEffect } from 'react';
import { useNomadStore } from '../../store';
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
    seedTopics 
  } = useNomadStore();
  
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
    <div className="min-h-screen bg-slate-50/50 space-y-4 max-w-7xl mx-auto pb-24">
      {/* Header Hub */}
      <header className="px-4 py-4 md:p-6 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('home')}
              className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform"
            >
              <Users className="w-6 h-6" />
            </button>
            <div onClick={() => setActiveTab('home')} className="cursor-pointer">
              <h1 className="text-2xl font-black text-secondary tracking-tight">Global Tribe</h1>
              <p className="text-slate-500 font-bold text-xs">
                {activeTab === 'home' ? 'Knowledge base for families' : (activeTopic?.name || activeTab)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search spaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
             </div>
             {activeTab !== 'home' && activeTab !== 'following' && activeTab !== 'all' && (
                <button 
                  onClick={() => setIsNewSpaceModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all"
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
            />
            <TabButton 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
              label="All Spaces" 
              icon={Globe}
            />
            <div className="w-px h-6 bg-slate-100 mx-2" />
            {topics.map((topic: any) => (
              <TabButton 
                key={topic.id}
                active={activeTab === topic.id} 
                onClick={() => setActiveTab(topic.id)}
                label={topic.id === 'introductions' ? '👋 Intros' : topic.name} 
                topicId={topic.id}
                topicIcon={topic.icon}
                isLocked={topic.isLocked}
              />
            ))}
          </div>
        )}

        {/* Trending Hashtags */}
        {activeTab !== 'home' && activeTopic?.type !== 'social' && trendingHashtags.length > 0 && (
          <div className="mt-4 flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
              <TrendingUp className="w-3 h-3" /> Trending:
            </span>
            {trendingHashtags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedHashtag(selectedHashtag === tag.id ? null : tag.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap",
                  selectedHashtag === tag.id 
                    ? "bg-secondary text-white shadow-lg" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
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
                  color="#6366f1"
                  onClick={() => setActiveTab('following')}
                />
                <CategoryTile 
                  title="All Spaces"
                  description="Browse everything happening in the tribe"
                  icon={<Globe className="w-6 h-6" />}
                  color="#14b8a6"
                  onClick={() => setActiveTab('all')}
                />
                {topics.map((topic: any) => {
                  const Icon = getTopicIcon(topic.icon || topic.id);
                  return (
                    <CategoryTile 
                      key={topic.id}
                      title={topic.name}
                      description={topic.description}
                      icon={Icon ? <Icon className="w-6 h-6" /> : null}
                      color={topic.color}
                      isLocked={topic.isLocked}
                      onClick={() => setActiveTab(topic.id)}
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort by:</span>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-100">
                      <SortButton active={sortBy === 'hot'} onClick={() => setSortBy('hot')} label="Hot" />
                      <SortButton active={sortBy === 'new'} onClick={() => setSortBy('new')} label="New" />
                      <SortButton active={sortBy === 'active'} onClick={() => setSortBy('active')} label="Most Active" />
                    </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Sorted by newest intro</span>
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
                    <h3 className="text-xl font-black text-secondary tracking-tight">
                      {activeTopic?.type === 'social' ? 'No intros yet!' : 'No spaces found'}
                    </h3>
                    <p className="text-slate-400 font-medium">
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

const CategoryTile = ({ title, description, icon, color, isLocked, onClick }: any) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-start p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden h-full"
  >
    <div 
      className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12"
      style={{ color }}
    >
      {icon}
    </div>
    
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg transition-transform group-hover:scale-110"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {icon}
    </div>

    <div className="space-y-0.5">
      <h3 className="text-sm font-black text-secondary flex items-center gap-2">
        {title}
        {isLocked && <span className="text-xs">🔒</span>}
      </h3>
      <p className="text-[10px] font-medium text-slate-400 leading-tight line-clamp-2">
        {description}
      </p>
    </div>

    <div className="mt-auto pt-3 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">
      Enter Board <span>→</span>
    </div>
  </button>
);

const TabButton = ({ active, onClick, label, topicId, icon, isLocked, topicIcon }: any) => {
  const Icon = icon || (topicIcon ? getTopicIcon(topicIcon) : (topicId ? getTopicIcon(topicId) : null));
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
        active ? "bg-secondary text-white shadow-xl shadow-secondary/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {isLocked && <span className="ml-1 text-[10px]">🔒</span>}
    </button>
  );
};

const SortButton = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors",
      active ? "bg-slate-100 text-secondary" : "text-slate-400 hover:text-slate-600"
    )}
  >
    {label}
  </button>
);
