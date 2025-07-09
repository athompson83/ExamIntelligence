import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAITooltip } from '@/contexts/AITooltipContext';

export function usePageTracking() {
  const [location] = useLocation();
  const { setCurrentPage, triggerTooltip } = useAITooltip();

  useEffect(() => {
    setCurrentPage(location);
    
    // Trigger page-specific tooltips
    const pageTooltipMap: Record<string, string> = {
      '/': 'dashboard-load',
      '/dashboard': 'dashboard-load',
      '/item-banks': 'item-banks-visit',
      '/enhanced-quiz-builder': 'quiz-builder-visit',
      '/user-management': 'user-management-visit',
      '/analytics': 'analytics-visit',
      '/analytics-dashboard': 'analytics-visit',
      '/live-exams': 'live-exam-start',
      '/ai-resources': 'ai-resources-visit'
    };

    const triggerId = pageTooltipMap[location];
    if (triggerId) {
      // Delay tooltip trigger to allow page to load
      setTimeout(() => {
        triggerTooltip({
          id: triggerId,
          page: location,
          delay: 1000
        });
      }, 500);
    }
  }, [location, setCurrentPage, triggerTooltip]);

  return { currentPage: location };
}