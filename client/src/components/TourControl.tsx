import React from 'react';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, RotateCcw, HelpCircle } from 'lucide-react';

interface TourControlProps {
  variant?: 'default' | 'icon' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const TourControl: React.FC<TourControlProps> = ({ 
  variant = 'outline', 
  size = 'sm',
  className = ''
}) => {
  const { 
    isOnboardingActive, 
    startOnboarding, 
    restartTour, 
    isFirstVisit 
  } = useOnboardingTour();

  const handleClick = () => {
    if (isFirstVisit) {
      startOnboarding();
    } else {
      restartTour();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isOnboardingActive}
            className={className}
          >
            {isFirstVisit ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Tour
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Tour
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isFirstVisit 
              ? "Start the interactive tour to learn about the platform" 
              : "Restart the guided tour to review platform features"
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TourControl;