import React from 'react';
import { cn } from '../lib/utils';

export const Avatar = ({ src, name, size = 'sm', className }: {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textClasses = {
    xs: 'text-[9px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  const sizeClass = sizeClasses[size];
  const textClass = textClasses[size];

  // Get initials: "The Smiths" -> "TS"
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src && !src.includes('avatar-placeholder.png')) {
    return (
      <img
        src={src}
        className={cn(sizeClass, 'rounded-xl object-cover shadow-sm', className)}
        alt={name}
        onError={(e) => { 
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement?.classList.add('flex');
        }}
      />
    );
  }

  return (
    <div className={cn(
      sizeClass, 
      'rounded-xl flex items-center justify-center bg-primary/15 text-primary shadow-sm font-black',
      textClass,
      className
    )}>
      {initials || '?'}
    </div>
  );
};
