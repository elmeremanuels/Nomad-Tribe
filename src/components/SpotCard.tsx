import React from 'react';
import { ThumbsUp, ThumbsDown, ShieldCheck, Star, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { Spot } from '../types';

interface SpotCardProps {
  spot: Spot;
  collabMode?: boolean;
  currentUserId?: string;
  onVote: (direction: 'up' | 'down') => void;
  onClick?: () => void;
  className?: string;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  collabMode = false,
  currentUserId,
  onVote,
  onClick,
  className
}) => {
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
      <div className="h-36 relative overflow-hidden bg-slate-100">
        {spot.imageUrl ? (
          <img
            src={spot.imageUrl}
            alt={spot.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-slate-300" />
          </div>
        )}

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
};
