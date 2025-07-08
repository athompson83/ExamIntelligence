import React, { useRef, useEffect } from 'react';
import { useSmartTooltips } from '@/hooks/useSmartTooltips';

interface TooltipTriggerProps {
  children: React.ReactNode;
  tooltip?: {
    title: string;
    content: string;
    category?: 'tip' | 'info' | 'feature' | 'warning' | 'tutorial';
    trigger?: 'hover' | 'click' | 'focus';
    delay?: number;
  };
  className?: string;
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ 
  children, 
  tooltip, 
  className = '',
  ...props 
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { triggerFeatureTooltip } = useSmartTooltips({ pageContext: 'general' });

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !tooltip) return;

    const handleTrigger = () => {
      if (tooltip.delay) {
        setTimeout(() => {
          triggerFeatureTooltip(tooltip.title, tooltip.content);
        }, tooltip.delay);
      } else {
        triggerFeatureTooltip(tooltip.title, tooltip.content);
      }
    };

    const triggerType = tooltip.trigger || 'hover';
    
    switch (triggerType) {
      case 'hover':
        element.addEventListener('mouseenter', handleTrigger);
        break;
      case 'click':
        element.addEventListener('click', handleTrigger);
        break;
      case 'focus':
        element.addEventListener('focus', handleTrigger);
        break;
    }

    return () => {
      switch (triggerType) {
        case 'hover':
          element.removeEventListener('mouseenter', handleTrigger);
          break;
        case 'click':
          element.removeEventListener('click', handleTrigger);
          break;
        case 'focus':
          element.removeEventListener('focus', handleTrigger);
          break;
      }
    };
  }, [tooltip, triggerFeatureTooltip]);

  return (
    <div 
      ref={elementRef} 
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};

export default TooltipTrigger;