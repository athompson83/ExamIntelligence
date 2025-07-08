import React from 'react';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  className?: string;
}

const HelpButton: React.FC<HelpButtonProps> = ({ className = '' }) => {
  const { startOnboarding, isOnboardingActive } = useOnboardingTour();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={startOnboarding}
            disabled={isOnboardingActive}
            className={`rounded-full h-8 w-8 p-0 ${className}`}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Get help with a guided tour</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HelpButton;