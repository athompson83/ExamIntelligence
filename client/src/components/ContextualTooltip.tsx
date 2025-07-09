import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Info, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface ContextualTooltipProps {
  id: string;
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'success' | 'tip';
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export default function ContextualTooltip({
  id,
  title,
  content,
  type = 'info',
  position = 'top',
  trigger = 'hover',
  delay = 500,
  children,
  className = ''
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tooltip was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(`tooltip-dismissed-${id}`);
    setIsDismissed(dismissed === 'true');
  }, [id]);

  const showTooltip = () => {
    if (isDismissed) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const dismissTooltip = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem(`tooltip-dismissed-${id}`, 'true');
  };

  const getIcon = () => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'tip': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 w-72 animate-in fade-in duration-200';
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full mb-2 left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} top-full mt-2 left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} right-full mr-2 top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} left-full ml-2 top-1/2 transform -translate-y-1/2`;
      default:
        return `${baseClasses} bottom-full mb-2 left-1/2 transform -translate-x-1/2`;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0';
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white`;
      case 'left':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white`;
      case 'right':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white`;
      default:
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white`;
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') showTooltip();
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') hideTooltip();
  };

  const handleClick = () => {
    if (trigger === 'click') {
      isVisible ? hideTooltip() : showTooltip();
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') showTooltip();
  };

  const handleBlur = () => {
    if (trigger === 'focus') hideTooltip();
  };

  if (isDismissed) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      
      {isVisible && (
        <div ref={tooltipRef} className={getTooltipClasses()}>
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getIcon()}
                  <h4 className="font-semibold text-sm">{title}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissTooltip}
                  className="h-5 w-5 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {content}
              </p>
              
              <div className="mt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissTooltip}
                  className="text-xs px-2 py-1 h-auto"
                >
                  Don't show again
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Tooltip Arrow */}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
}