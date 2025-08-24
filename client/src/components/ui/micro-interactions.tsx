import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Enhanced Button with micro-interactions
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    default: 'bg-background border border-input hover:bg-accent hover:text-accent-foreground',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md active:shadow-sm transform-gpu',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
        />
      ) : null}
      {children}
    </motion.button>
  );
};

// Enhanced Card with hover effects
interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  clickable?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  className,
  hover = true,
  clickable = false,
  children,
  ...props
}) => (
  <motion.div
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-md transition-all duration-300 transform-gpu',
      hover && 'hover:shadow-xl hover:border-primary/20',
      clickable && 'cursor-pointer active:scale-98',
      className
    )}
    whileHover={hover ? { y: -2, scale: 1.02 } : undefined}
    whileTap={clickable ? { scale: 0.98 } : undefined}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    {...(props as any)}
  >
    {children}
  </motion.div>
);

// Staggered list animation
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className,
  staggerDelay = 0.1
}) => (
  <div className={className}>
    {React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * staggerDelay }}
      >
        {child}
      </motion.div>
    ))}
  </div>
);

// Floating action button with ripple effect
interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  className,
  size = 'md',
  children,
  ...props
}) => {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  return (
    <motion.button
      className={cn(
        'fixed bottom-6 right-6 rounded-full bg-primary text-primary-foreground shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center z-50',
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

// Smooth page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Pulsing notification dot
export const PulsingDot: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={cn('rounded-full bg-red-500 w-3 h-3', className)}
    animate={{ scale: [1, 1.2, 1] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  />
);