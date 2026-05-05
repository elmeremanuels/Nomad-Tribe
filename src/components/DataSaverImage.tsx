import React from 'react';
import { useNomadStore } from '../store';
import { ImageOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface DataSaverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackIcon?: React.ReactNode;
}

export const DataSaverImage = ({ src, alt, className, fallbackIcon, ...props }: DataSaverImageProps) => {
  const dataSaver = useNomadStore(state => state.dataSaver);

  if (dataSaver || !src) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-100 text-slate-300', className)}>
        {fallbackIcon || <ImageOff className="w-1/3 h-1/3" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
