import React from 'react';
import { useNomadStore } from '../../store';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Globe, Bell, MoreVertical, Eye, MapPin, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { Thread, Topic } from '../../types';

interface SpaceCardProps {
  thread: Thread;
  topic?: Topic;
  onClick: () => void;
  onReport?: (id: string, type: 'Thread' | 'ThreadReply' | 'User') => void;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ thread, topic, onClick, onReport }) => {
  const { currentUser, vote, threadFollows, toggleFollowThread, toggleFollowHashtag, toggleWelcome } = useNomadStore();
  
  const getVoteScore = (votes: { up: string[], down: string[] }) => (votes?.up?.length || 0) - (votes?.down?.length || 0);
  const isUpvoted = thread.votes?.up?.includes(currentUser?.id || '');
  const isDownvoted = thread.votes?.down?.includes(currentUser?.id || '');
  const isFollowing = threadFollows.some(f => f.threadId === thread.id);
  
  const isSocial = topic?.type === 'social';
  const hasWelcomed = thread.welcomes?.includes(currentUser?.id || '');

  const accentColor = topic?.color || '#006d77';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all cursor-pointer group flex gap-4 relative overflow-hidden",
        "bg-white"
      )}
      style={{ 
        borderLeftWidth: '4px', 
        borderLeftColor: accentColor,
        backgroundColor: `${accentColor}10` 
      }}
    >
      {/* Interactive area (Left side) */}
      <div className="flex flex-col items-center gap-1 min-w-[44px] z-10">
        {isSocial ? (
           <button
             onClick={(e) => { e.stopPropagation(); toggleWelcome(thread.id); }}
             className={cn(
               'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all',
               hasWelcomed
                 ? 'bg-[#E76F51]/10 text-[#E76F51]'
                 : 'text-slate-300 hover:bg-slate-50 hover:text-[#E76F51]'
             )}
           >
             <Heart className={cn('w-6 h-6', hasWelcomed && 'fill-[#E76F51]')} />
             <span className="text-[10px] font-black">{thread.welcomes?.length || 0}</span>
           </button>
        ) : (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); vote('threads', thread.id, 'up'); }}
              className={cn(
                "p-1.5 rounded-lg transition-all", 
                isUpvoted ? "text-primary bg-primary/10" : "text-slate-300 hover:text-primary hover:bg-slate-50"
              )}
            >
              <ArrowBigUp className="w-6 h-6" fill={isUpvoted ? "currentColor" : "none"} />
            </button>
            <span className="text-xs font-black text-secondary">{getVoteScore(thread.votes)}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); vote('threads', thread.id, 'down'); }}
              className={cn(
                "p-1.5 rounded-lg transition-all", 
                isDownvoted ? "text-red-500 bg-red-50" : "text-slate-300 hover:text-red-500 hover:bg-slate-50"
              )}
            >
              <ArrowBigDown className="w-6 h-6" fill={isDownvoted ? "currentColor" : "none"} />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xl mr-1">{thread.emoji || '💬'}</span>
          <h3 className="text-base font-black text-secondary group-hover:text-primary transition-colors truncate">
            {thread.title}
          </h3>
        </div>

        {/* Hashtags */}
        {!isSocial && thread.hashtags && thread.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {thread.hashtags.map(tag => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollowHashtag(tag);
                }}
                className="text-[#006d77] hover:bg-[#006d77]/10 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <img src={thread.authorPhotoUrl || '/avatar-placeholder.png'} className="w-5 h-5 rounded-md object-cover" alt="" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{thread.authorFamilyName}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            • {topic?.name} • {thread.region}
          </span>
        </div>

        {/* De Vibe row - only for discussion topics */}
        {!isSocial && (
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <MessageSquare className="w-3.5 h-3.5" /> {thread.activeUserCount || 1} active
            </span>
            <span className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <Globe className="w-3.5 h-3.5" /> {thread.countryCount || 0} countries
            </span>
            <span className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <Eye className="w-3.5 h-3.5" /> {thread.viewCount} views
            </span>
          </div>
        )}

        {isSocial && (
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
             <span className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <Eye className="w-3.5 h-3.5" /> {thread.viewCount} views
            </span>
             <span className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount || 0} replies
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] font-bold text-slate-400">
            {format(parseISO(thread.createdAt), 'MMM d, yyyy')}
          </span>
          <div className="flex items-center gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); toggleFollowThread(thread.id); }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isFollowing ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
              )}
             >
               {isFollowing ? 'Following' : 'Follow'}
             </button>
             <div className="relative group/report">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-1.5 text-slate-300 hover:text-slate-500"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 opacity-0 group-hover/report:opacity-100 pointer-events-none group-hover/report:pointer-events-auto transition-all z-[100]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReport?.(thread.id, 'Thread'); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Report Space
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReport?.(thread.authorId, 'User'); }}
                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Report Author
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
