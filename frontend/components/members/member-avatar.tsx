'use client';

import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface MemberAvatarProps {
  photoUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8', 
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5', 
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

const MemberAvatar: React.FC<MemberAvatarProps> = ({
  photoUrl,
  firstName,
  lastName,
  size = 'md',
  className
}) => {
  const initials = React.useMemo(() => {
    if (!firstName && !lastName) return '';
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`.substring(0, 2);
  }, [firstName, lastName]);

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  if (photoUrl) {
    return (
      <div className={cn(
        'relative rounded-full overflow-hidden bg-white border border-gray-200',
        sizeClass,
        className
      )}>
        <Image
          key={photoUrl} // Force re-render when URL changes
          src={photoUrl}
          alt={`${firstName || ''} ${lastName || ''}`.trim() || 'Member photo'}
          fill
          className="object-cover object-center"
          sizes={size === 'xl' ? '64px' : size === 'lg' ? '48px' : size === 'md' ? '40px' : size === 'sm' ? '32px' : '24px'}
          unoptimized={true}
          onError={(e) => {
            // Hide image if it fails to load, will show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Fallback for broken images */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center',
          'group-hover:bg-primary/20 transition-colors'
        )}>
          {initials ? (
            <span className={cn(
              'font-medium text-primary select-none',
              size === 'xs' && 'text-xs',
              size === 'sm' && 'text-xs', 
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base',
              size === 'xl' && 'text-lg'
            )}>
              {initials}
            </span>
          ) : (
            <User className={cn('text-primary/60', iconSize)} />
          )}
        </div>
      </div>
    );
  }

  // Fallback when no photo
  return (
    <div className={cn(
      'rounded-full bg-primary/10 border border-gray-200 flex items-center justify-center',
      'group-hover:bg-primary/20 transition-colors',
      sizeClass,
      className
    )}>
      {initials ? (
        <span className={cn(
          'font-medium text-primary select-none',
          size === 'xs' && 'text-xs',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm', 
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg'
        )}>
          {initials}
        </span>
      ) : (
        <User className={cn('text-primary/60', iconSize)} />
      )}
    </div>
  );
};

export default MemberAvatar;
