import React, { useState, useMemo } from 'react';
import { useNomadStore } from '../../store';
import { X, Plus, Hash, Smile, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Topic, ThreadRegion } from '../../types';
import { cn } from '../../lib/utils';

interface NewSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTopic?: Topic;
}

const REGIONS: ThreadRegion[] = ['Global', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania'];

const CATEGORY_EMOJIS: Record<string, string[]> = {
  introductions: ['👋', '🌍', '🏠', '🎒', '👪', '✨', '📸'],
  worldschooling: ['📚', '🎓', '✏️', '🏫', '🧠', '🌍', '🎒'],
  'business-tax-money': ['💰', '📊', '🏢', '📈', '🤝', '🏦', '💹'],
  'visas-residency': ['🛂', '✈️', '🌍', '📋', '🛂', '📜', '🏛️'],
  'health-insurance-safety': ['🏥', '💊', '🩺', '⚠️', '🛡️', '🦺', '🆘'],
  'travel-logistics-gear': ['🛠', '✈️', '🎒', '🗺', '🧳', '📍', '💡'],
  'lifestyle-mental-health': ['🧘', '❤️', '🧠', '🌊', '🌿', '⛰️', '☀️'],
};

export const NewSpaceModal: React.FC<NewSpaceModalProps> = ({ isOpen, onClose, activeTopic }) => {
  const { topics, createThread, hashtags: allHashtags, addToast } = useNomadStore();
  
  const [topicId, setTopicId] = useState(activeTopic?.id || 'worldschooling');
  const [region, setRegion] = useState<ThreadRegion>('Global');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [emoji, setEmoji] = useState('💬');
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const currentTopic = topics.find(t => t.id === topicId);
  const isSocial = currentTopic?.type === 'social';
  
  const suggestionList = useMemo(() => {
    if (!hashtagInput) return [];
    const lowerInput = hashtagInput.toLowerCase().replace(/^#/, '');
    return allHashtags
      .filter(h => h.id.startsWith(lowerInput))
      .sort((a, b) => b.spaceCount - a.spaceCount)
      .slice(0, 5);
  }, [hashtagInput, allHashtags]);

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, '');
    if (normalized.length < 2 || selectedTags.length >= 3 || selectedTags.includes(normalized)) return;
    setSelectedTags([...selectedTags, normalized]);
    setHashtagInput('');
    setSuggestions([]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const threadId = await createThread({
      topicId,
      title,
      body,
      region,
      emoji,
      hashtags: selectedTags
    });

    if (threadId) {
      addToast('Space created successfully!', 'success');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-secondary/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-secondary tracking-tight">Start a Space</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                  <div className="relative">
                    <select 
                      value={topicId}
                      onChange={e => setTopicId(e.target.value as any)}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-secondary appearance-none"
                    >
                      {topics.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Region (Optional)</label>
                  <div className="relative">
                    <select 
                      value={region}
                      onChange={e => setRegion(e.target.value as ThreadRegion)}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-secondary appearance-none"
                    >
                      {REGIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Choose an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {(CATEGORY_EMOJIS[topicId] || ['💬', '❓', '💡', '📢', '🔥']).map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all",
                        emoji === e ? "bg-primary/20 scale-110 border-2 border-primary" : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Smile className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Title</label>
                <input 
                  type="text"
                  required
                  maxLength={120}
                  placeholder={isSocial ? "A short intro title (e.g. Hi from the Miller family!)" : "What's your question or topic?"}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-secondary"
                />
                <p className="text-[10px] text-right text-slate-400 font-bold">{title.length} / 120</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Body</label>
                <textarea 
                  required
                  rows={6}
                  maxLength={2000}
                  placeholder={isSocial ? "Tell us about your family, your journey, and what you're looking for..." : "Add details, context, or your experience..."}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-600 resize-none"
                />
                <p className="text-[10px] text-right text-slate-400 font-bold">{body.length} / 2000</p>
              </div>

              {!isSocial && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hashtags (up to 3)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-[#006d77]/10 text-[#006d77] px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedTags.length < 3 && (
                      <div className="relative flex-1 min-w-[120px]">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          value={hashtagInput}
                          onChange={e => setHashtagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (hashtagInput) addTag(hashtagInput);
                            }
                          }}
                          placeholder="Add hashtag..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        
                        <AnimatePresence>
                          {suggestionList.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full mb-2 left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-10 overflow-hidden"
                            >
                              {suggestionList.map(h => (
                                <button
                                  key={h.id}
                                  type="button"
                                  onClick={() => addTag(h.id)}
                                  className="w-full text-left p-3 hover:bg-slate-50 text-xs font-bold text-secondary flex justify-between items-center"
                                >
                                  <span>#{h.id}</span>
                                  <span className="text-[10px] text-slate-400 tracking-widest uppercase">{h.spaceCount} spaces</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 flex items-start gap-4">
                <Globe className="w-5 h-5 text-primary mt-0.5" />
                <div>
                   <p className="text-xs font-black text-primary uppercase tracking-widest">
                     {isSocial ? 'Joining the Tribe!' : `Posting in ${currentTopic?.name}`}
                   </p>
                   <p className="text-[10px] text-primary/70 font-medium mt-1">
                     {isSocial 
                       ? 'Warm welcomes only. Your intro helps other nomads find and connect with you.'
                       : 'Keep it helpful and spam-free. Your space will be visible to all nomad families.'}
                   </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!title.trim() || !body.trim()}
                  className="flex-[2] py-5 bg-primary text-white rounded-[2rem] font-black shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {isSocial ? 'Join the Tribe' : 'Post Space'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
