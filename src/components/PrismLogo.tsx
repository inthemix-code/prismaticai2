import React from 'react';
import { cn } from '@/lib/utils';

interface PrismLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function PrismLogo({ className, size = 'md', animated = true }: PrismLogoProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      {/* Prism SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          'w-full h-full',
          animated && 'animate-[prismRotate_8s_linear_infinite]'
        )}
      >
        {/* Main prism triangle */}
        <path
          d="M12 2 L22 20 L2 20 Z"
          fill="url(#prismGradient)"
          stroke="url(#prismStroke)"
          strokeWidth="1"
          className="drop-shadow-sm"
        />
        
        {/* Inner light refraction lines - Single axis */}
        <path
          d="M12 2 L12 20"
          stroke="url(#lightGradient1)"
          strokeWidth="0.5"
          opacity="0.6"
          className={animated ? 'animate-[prismPulse_2s_ease-in-out_infinite]' : ''}
        />
        <path
          d="M12 2 L7 20"
          stroke="url(#lightGradient2)"
          strokeWidth="0.5"
          opacity="0.4"
          className={animated ? 'animate-[prismPulse_2s_ease-in-out_infinite_0.3s]' : ''}
        />
        <path
          d="M12 2 L17 20"
          stroke="url(#lightGradient3)"
          strokeWidth="0.5"
          opacity="0.4"
          className={animated ? 'animate-[prismPulse_2s_ease-in-out_infinite_0.6s]' : ''}
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
          </linearGradient>
          
          <linearGradient id="prismStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          
          <linearGradient id="lightGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="lightGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.2" />
          </linearGradient>
          
          <linearGradient id="lightGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Shimmer effect overlay */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[prismShimmer_3s_ease-in-out_infinite] opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
}