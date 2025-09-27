import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
}

const LoadingSpinner = ({ size = 'md', className }: { size: string; className?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size as keyof typeof sizeClasses],
        className
      )}
      role="status"
      aria-label="Loading"
      data-testid="loading-spinner"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingDots = ({ className }: { className?: string }) => (
  <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading" data-testid="loading-dots">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="h-2 w-2 bg-current rounded-full animate-pulse"
        style={{
          animationDelay: `${i * 0.2}s`,
          animationDuration: '1s'
        }}
        aria-hidden="true"
      />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
);

const LoadingPulse = ({ className }: { className?: string }) => (
  <div 
    className={cn('h-4 w-16 bg-current/20 rounded animate-pulse', className)}
    role="status"
    aria-label="Loading"
    data-testid="loading-pulse"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

export const Loading: React.FC<LoadingProps> = ({
  className,
  size = 'md',
  variant = 'spinner',
  text
}) => {
  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots className={className} />;
      case 'pulse':
        return <LoadingPulse className={className} />;
      case 'skeleton':
        return <div className={cn('animate-pulse bg-muted rounded', className)} />;
      default:
        return <LoadingSpinner size={size} className={className} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2" data-testid="loading-container">
      {renderLoading()}
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );
};

// Enhanced skeleton component
export const EnhancedSkeleton = ({ 
  className, 
  animate = true 
}: { 
  className?: string; 
  animate?: boolean; 
}) => (
  <div
    className={cn(
      'bg-muted rounded-md',
      animate && 'loading-shimmer',
      className
    )}
  />
);

// Page loading component
export const PageLoading = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95" role="status" data-testid="page-loading">
    <div className="text-center space-y-4">
      <div className="relative">
        <Loading size="lg" variant="spinner" className="text-primary" />
        <div className="absolute inset-0 animate-ping" aria-hidden="true">
          <Loading size="lg" variant="spinner" className="text-primary/30" />
        </div>
      </div>
      <p className="text-lg font-medium text-foreground animate-pulse" aria-live="polite">
        {message}
      </p>
    </div>
  </div>
);