import React, { useState, useEffect } from 'react';
import { useNomadStore } from '../../store';
import { ArrowLeft, MessageSquare, Globe, Eye, Bell, BellOff, ArrowBigUp, ArrowBigDown, CheckCircle2, ThumbsUp, MessageCircle, X, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { Thread, Topic } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar } from '../Avatar';
import { CardActionsMenu } from '../CardActionsMenu';

interface SpaceDetailViewProps {
  threadId: string;
  onBack: () => void;
  onReport?: (id: string, type: 'Thread' | 'ThreadReply' | 'User' | 'LookingFor' | 'Event' | 'Spot' | 'MarketItem' | 'CollabAsk') => void;
}

export const SpaceDetailView: React.FC<SpaceDetailViewProps> = ({ threadId, onBack, onReport }) => {
  const { 
    threads, 
    threadReplies, 
    topics, 
    currentUser, 
    loadThreadReplies, 
    addReply, 
    vote, 
    toggleFollowThread, 
    threadFollows,
    deleteThread,
    deleteReply
  } = useNomadStore();

  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySort, setReplySort] = useState<'top' | 'new'>('top');

  const thread = threads.find(t => t.id === threadId);
  const topic = topics.find(t => t.id === thread?.topicId);
  const isFollowing = threadFollows.some(f => f.threadId === threadId);
  const isSocial = topic?.type === 'social';
  const hasWelcomed = thread?.welcomes?.includes(currentUser?.id || '');

  useEffect(() => {
    loadThreadReplies(threadId);
  }, [threadId, loadThreadReplies]);

  if (!thread) return null;

  const sortedReplies = [...threadReplies.filter(r => r.threadId === threadId)].sort((a, b) => {
    if (replySort === 'top' && !isSocial) {
      const scoreA = (a.votes.up.length - a.votes.down.length);
      const scoreB = (b.votes.up.length - b.votes.down.length);
      return scoreB - scoreA;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getVoteScore = (votes: { up: string[], down: string[] }) => (votes?.up?.length || 0) - (votes?.down?.length || 0);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    await addReply(threadId, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-40 relative">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 font-bold hover:text-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {topic?.name || 'Community'}
      </button>

      {/* Vibe header (sticky-ish) */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md border border-slate-100 p-4 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {!isSocial ? (
            <>
              <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary" /> {thread.activeUserCount || 1} active</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> {thread.countryCount || 0} countries</span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 italic text-primary"><Users className="w-4 h-4" /> Community Intro</span>
          )}
          <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-primary" /> {thread.viewCount} views</span>
        </div>
        <div className="flex items-center gap-2">
          {isSocial && (
             <button 
                onClick={() => useNomadStore.getState().toggleWelcome(thread.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  hasWelcomed ? "bg-[#E76F51] text-white shadow-lg" : "bg-[#E76F51]/10 text-[#E76F51] border border-[#E76F51]/20"
                )}
             >
               <ThumbsUp className={cn("w-4 h-4", hasWelcomed && "fill-current")} />
               Welcome
             </button>
          )}
          <button 
            onClick={() => toggleFollowThread(thread.id)}
            className={cn(
              "p-2 rounded-xl border transition-all",
              isFollowing ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-100"
            )}
          >
            {isFollowing ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          
          <CardActionsMenu
            isOwn={currentUser?.id === thread.authorId}
            onReport={() => onReport?.(thread.id, 'Thread')}
            onDelete={() => { deleteThread(thread.id); onBack(); }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        {!isSocial && thread.hashtags && thread.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {thread.hashtags?.map(tag => (
              <span key={tag} className="text-[#006d77] font-black text-xs">#{tag}</span>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-black text-secondary mb-4 tracking-tight leading-tight">
          <span className="mr-3">{thread.emoji}</span>
          {thread.title}
        </h1>

        <div className="flex items-center gap-3 mb-8">
          <Avatar src={thread.authorPhotoUrl} name={thread.authorFamilyName} size="md" />
          <div>
            <p className="text-xs font-black text-secondary uppercase tracking-widest">{thread.authorFamilyName}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {thread.region} • {thread.createdAt ? format(parseISO(thread.createdAt), 'MMMM d, yyyy') : ''}
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-10 text-lg">
          {thread.body}
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
           {!isSocial ? (
             <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 px-3">
                <button 
                  onClick={() => vote('threads', thread.id, 'up')}
                  className={cn("p-2 transition-all", thread.votes.up.includes(currentUser?.id || '') ? "text-primary scale-110" : "text-slate-300 hover:text-primary")}
                 >
                   <ArrowBigUp className="w-8 h-8" fill={thread.votes.up.includes(currentUser?.id || '') ? "currentColor" : "none"} />
                </button>
                <span className="text-base font-black text-secondary mx-1">{getVoteScore(thread.votes)}</span>
                <button 
                  onClick={() => vote('threads', thread.id, 'down')}
                  className={cn("p-2 transition-all", thread.votes.down.includes(currentUser?.id || '') ? "text-red-500 scale-110" : "text-slate-300 hover:text-red-500")}
                 >
                   <ArrowBigDown className="w-8 h-8" fill={thread.votes.down.includes(currentUser?.id || '') ? "currentColor" : "none"} />
                </button>
             </div>
           ) : (
             <button 
                onClick={() => useNomadStore.getState().toggleWelcome(thread.id)}
                className={cn(
                  "flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                  hasWelcomed ? "bg-[#E76F51] text-white shadow-xl shadow-[#E76F51]/20" : "bg-[#E76F51]/10 text-[#E76F51]"
                )}
             >
               <ThumbsUp className={cn("w-6 h-6", hasWelcomed && "fill-current")} />
               {hasWelcomed ? 'Welcomed!' : 'Give a Warm Welcome'}
             </button>
           )}
           
           <button 
            onClick={() => toggleFollowThread(thread.id)}
            className={cn(
              "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
              isFollowing ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
            )}
           >
             {isFollowing ? 'Space Followed' : 'Follow Space'}
           </button>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {thread.replyCount} {isSocial ? 'Welcomes' : 'Replies'}
          </h3>
          <select 
            value={replySort}
            onChange={e => setReplySort(e.target.value as 'top' | 'new')}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            {!isSocial && <option value="top">Top Replies</option>}
            <option value="new">Newest First</option>
          </select>
        </div>

        <div className="space-y-4">
          {sortedReplies.map((reply, i) => (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               key={reply.id} 
               className={cn(
                 "p-6 rounded-[2.5rem] border transition-all",
                 reply.isHelpful ? "bg-emerald-50/50 border-emerald-100 shadow-lg shadow-emerald-50" : "bg-white border-slate-100"
               )}
             >
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <Avatar src={reply.authorPhotoUrl} name={reply.authorFamilyName} size="sm" />
                     <div>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{reply.authorFamilyName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{format(parseISO(reply.createdAt), 'MMM d, HH:mm')}</p>
                     </div>
                  </div>
                  {reply.isHelpful && !isSocial && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                       <CheckCircle2 className="w-2.5 h-2.5" /> Helpful
                    </div>
                  )}
               </div>
               <p className="text-sm text-secondary font-medium leading-relaxed mb-4 whitespace-pre-wrap">{reply.body}</p>
               <div className="flex items-center gap-4">
                  {!isSocial && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-xl">
                      <button 
                          onClick={() => vote('threadReplies', reply.id, 'up')}
                          className={cn("p-1 transition-all", reply.votes.up.includes(currentUser?.id || '') ? "text-primary bg-primary/10" : "text-slate-300 hover:text-primary")}
                      >
                          <ThumbsUp className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-secondary">{getVoteScore(reply.votes)}</span>
                    </div>
                  )}
                  
                  {!isSocial && currentUser?.id === thread.authorId && !reply.isHelpful && (
                    <button 
                       onClick={() => useNomadStore.getState().markReplyHelpful(thread.id, reply.id)}
                       className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1.5 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                       Mark as Helpful
                    </button>
                  )}
                  <CardActionsMenu
                    isOwn={currentUser?.id === reply.authorId}
                    onReport={() => onReport?.(reply.id, 'ThreadReply')}
                    onDelete={() => deleteReply(reply.id)}
                  />
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reply Section (Inline instead of fixed) */}
      <div className="mt-12 mb-20 px-4">
        <div className="max-w-4xl mx-auto w-full">
          {!isReplying ? (
            <motion.button
              layoutId="reply-box"
              onClick={() => setIsReplying(true)}
              className="w-full flex items-center gap-4 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl text-left transition-all hover:bg-slate-50"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-base font-bold text-slate-400">{isSocial ? 'Say hi to the community...' : 'Reply to this space...'}</span>
            </motion.button>
          ) : (
            <motion.div 
              layoutId="reply-box"
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-secondary uppercase tracking-widest">{isSocial ? 'Say hello!' : 'Share your thoughts'}</h4>
                <button onClick={() => setIsReplying(false)} className="p-1.5 hover:bg-slate-50 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <textarea
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={isSocial ? "Send a warm welcome..." : "Share what you know..."}
                rows={6}
                maxLength={1000}
                className="w-full p-6 bg-slate-50 rounded-[2rem] text-base font-medium border border-slate-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">{replyText.length} / 1000</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setIsReplying(false); setReplyText(''); }}
                    className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim()}
                    className="px-10 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 disabled:opacity-30 transition-all hover:-translate-y-0.5"
                  >
                    {isSocial ? 'Send Welcome' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
