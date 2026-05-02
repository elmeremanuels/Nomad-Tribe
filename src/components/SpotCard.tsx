import React from 'react';
import { ThumbsUp, ThumbsDown, ShieldCheck, Star, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spot } from '../types';
import { CardActionsMenu } from './CardActionsMenu';
import { useNomadStore } from '../store';

interface SpotCardProps {
  spot: Spot;
  collabMode?: boolean;
  currentUserId?: string;
  onVote: (direction: 'up' | 'down') => void;
  onDelete?: (id: string) => void;
  onReport?: (id: string, type: 'Spot') => void;
  onClick?: () => void;
  className?: string;
}

export const SpotCard = React.memo(({
  spot,
  collabMode = false,
  currentUserId,
  onVote,
  onDelete,
  onReport,
  onClick,
  className
}: SpotCardProps) => {
  const dataSaver = useNomadStore(state => state.dataSaver);
  const isOwn = currentUserId === spot.recommendedBy;
  const upvotes = spot.votes?.up || [];
  const downvotes = spot.votes?.down || [];
  const netScore = upvotes.length - downvotes.length;
  const userVote = currentUserId
    ? upvotes.includes(currentUserId) ? 'up'
    : downvotes.includes(currentUserId) ? 'down'
    : null
    : null;

  const scoreColor =
    netScore > 5 ? 'text-green-500' :
    netScore < 0 ? 'text-red-400' :
    'text-slate-500';

  return (
    <div
      className={cn(
        "flex-shrink-0 w-64 rounded-[2rem] overflow-hidden border transition-all",
        collabMode ? "bg-white/5 border-white/10" : "bg-white border-slate-100 shadow-sm",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      {/* Image */}
      <div className="h-44 relative overflow-hidden bg-slate-100">
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          <CardActionsMenu 
            isOwn={isOwn}
            onReport={() => onReport?.(spot.id, 'Spot')}
            onDelete={() => onDelete?.(spot.id)}
            dark={false}
          />
        </div>
        {spot.imageUrl && !dataSaver ? (
          <>
            <img
              src={spot.imageUrl}
              alt={spot.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={e => { (e.target as HTMLImageElement).parentElement!.querySelector('.fallback-gradient')?.classList.remove('hidden'); (e.target as HTMLImageElement).remove(); }}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {spot.googlePlaceId && (
              <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                <span className="text-[8px] text-white/70 font-bold uppercase tracking-widest">© Google</span>
              </div>
            )}
          </>
        ) : null}
        
        {/* Category Gradient Fallback */}
        <div className={cn(
          "fallback-gradient absolute inset-0 bg-gradient-to-br flex items-center justify-center",
          spot.imageUrl && !dataSaver ? "hidden" : "",
          spot.category === 'Playground' ? 'from-green-100 to-green-200' :
          spot.category === 'Workspace' ? 'from-primary/10 to-primary/20' :
          spot.category === 'Medical' ? 'from-red-50 to-red-100' :
          spot.category === 'Accommodation' ? 'from-secondary/10 to-secondary/20' :
          spot.category === 'Restaurant' ? 'from-amber-50 to-amber-100' : 'from-slate-100 to-slate-200'
        )}>
          <span className="text-5xl opacity-20">
            {spot.category === 'Playground' ? '🛝' :
             spot.category === 'Workspace' ? '💻' :
             spot.category === 'Medical' ? '🏥' :
             spot.category === 'Accommodation' ? '🏨' :
             spot.category === 'Restaurant' ? '🍽️' : '📍'}
          </span>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
            {spot.category}
          </span>
        </div>

        {/* Vetted badge */}
        {spot.isVetted && (
          <div className="absolute top-3 right-3 bg-primary p-1.5 rounded-full shadow-lg">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className={cn(
          "font-bold text-sm leading-tight line-clamp-1",
          collabMode ? "text-white" : "text-slate-800"
        )}>
          {spot.name}
        </h3>

        {spot.place?.address && (
          <p className="text-[10px] text-slate-400 line-clamp-1">{spot.place.address}</p>
        )}

        <p className={cn(
          "text-[11px] line-clamp-2",
          collabMode ? "text-white/50" : "text-slate-500"
        )}>
          {spot.description}
        </p>

        {/* Tags */}
        {spot.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {spot.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[9px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Vote row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-black text-slate-500">{spot.rating?.toFixed(1) || '5.0'}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Net score */}
            <span className={cn("text-[10px] font-black tabular-nums w-6 text-center", scoreColor)}>
              {netScore > 0 ? `+${netScore}` : netScore}
            </span>

            {/* Downvote */}
            <button
              onClick={e => { e.stopPropagation(); onVote('down'); }}
              className={cn(
                "p-1.5 rounded-xl transition-colors",
                userVote === 'down'
                  ? "bg-red-100 text-red-500"
                  : "text-slate-300 hover:text-red-400 hover:bg-red-50"
              )}
              title="Not recommended"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            {/* Upvote */}
            <button
              onClick={e => { e.stopPropagation(); onVote('up'); }}
              className={cn(
                "p-1.5 rounded-xl transition-colors",
                userVote === 'up'
                  ? "bg-green-100 text-green-600"
                  : "text-slate-300 hover:text-green-500 hover:bg-green-50"
              )}
              title="Recommended!"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.spot.id === next.spot.id &&
         prev.spot.rating === next.spot.rating &&
         prev.spot.votes?.up?.length === next.spot.votes?.up?.length &&
         prev.spot.votes?.down?.length === next.spot.votes?.down?.length &&
         prev.currentUserId === next.currentUserId &&
         prev.collabMode === next.collabMode;
});
