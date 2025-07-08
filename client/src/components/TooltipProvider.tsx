import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TooltipSystem } from './TooltipSystem';

interface TooltipContextType {
  showTooltip: (data: TooltipData) => void;
  hideTooltip: () => void;
  isTooltipVisible: boolean;
  currentTooltip: TooltipData | null;
}

interface TooltipData {
  id: string;
  title: string;
  content: string;
  category: 'tip' | 'info' | 'feature' | 'warning' | 'tutorial';
  priority: 'low' | 'medium' | 'high';
  targetElement?: string;
  showOnce?: boolean;
  delay?: number;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

interface TooltipProviderProps {
  children: ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [currentTooltip, setCurrentTooltip] = useState<TooltipData | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipQueue, setTooltipQueue] = useState<TooltipData[]>([]);

  // Built-in contextual tooltips for different pages
  const contextualTooltips: Record<string, TooltipData[]> = {
    '/dashboard': [
      {
        id: 'dashboard_welcome',
        title: 'Welcome to your Dashboard!',
        content: 'This is your command center. Here you can see active exams, recent activity, and quick access to all major features.',
        category: 'info',
        priority: 'high',
        showOnce: true,
        delay: 1000
      },
      {
        id: 'dashboard_stats',
        title: 'Live Statistics',
        content: 'These cards show real-time data about your tests, students, and system performance. Click any card for detailed insights.',
        category: 'tip',
        priority: 'medium',
        delay: 5000
      }
    ],
    '/testbanks': [
      {
        id: 'testbanks_intro',
        title: 'Organize Your Questions',
        content: 'Item banks help you organize questions by topic, difficulty, or subject. You can create multiple banks for different courses.',
        category: 'tutorial',
        priority: 'high',
        delay: 1500
      },
      {
        id: 'testbanks_ai',
        title: 'AI-Powered Question Generation',
        content: 'Use our AI to generate high-quality questions automatically. Just specify your topic and difficulty level!',
        category: 'feature',
        priority: 'medium',
        delay: 8000
      }
    ],
    '/quiz-builder': [
      {
        id: 'quiz_builder_intro',
        title: 'Build Professional Quizzes',
        content: 'Create comprehensive quizzes with multiple question types, time limits, and advanced settings. Perfect for both practice and assessment.',
        category: 'tutorial',
        priority: 'high',
        delay: 2000
      },
      {
        id: 'quiz_builder_settings',
        title: 'Advanced Quiz Settings',
        content: 'Don\'t forget to configure attempt limits, time restrictions, and availability windows in the settings tab.',
        category: 'tip',
        priority: 'medium',
        delay: 15000
      }
    ],
    '/analytics': [
      {
        id: 'analytics_ml',
        title: 'ML-Powered Insights',
        content: 'Our machine learning algorithms analyze student performance patterns to provide actionable insights and predictions.',
        category: 'feature',
        priority: 'high',
        delay: 2000
      },
      {
        id: 'analytics_export',
        title: 'Export Your Data',
        content: 'All analytics can be exported to CSV, PDF, or Excel formats for further analysis or reporting.',
        category: 'tip',
        priority: 'low',
        delay: 10000
      }
    ],
    '/settings': [
      {
        id: 'settings_mobile',
        title: 'Mobile App Testing',
        content: 'Try out our mobile app! You can test it directly through the Mobile App tab or use the QR code for native testing.',
        category: 'feature',
        priority: 'medium',
        delay: 3000
      }
    ]
  };

  // Initialize tooltips based on current page
  useEffect(() => {
    const currentPath = window.location.pathname;
    const pageTooltips = contextualTooltips[currentPath];
    
    if (pageTooltips && pageTooltips.length > 0) {
      // Check if user has seen these tooltips before
      const seenTooltips = JSON.parse(localStorage.getItem('seenTooltips') || '[]');
      const newTooltips = pageTooltips.filter(tooltip => 
        !tooltip.showOnce || !seenTooltips.includes(tooltip.id)
      );
      
      setTooltipQueue(newTooltips);
    }
  }, []);

  // Process tooltip queue
  useEffect(() => {
    if (tooltipQueue.length > 0 && !currentTooltip) {
      const nextTooltip = tooltipQueue.find(t => t.priority === 'high') || tooltipQueue[0];
      
      if (nextTooltip.delay) {
        setTimeout(() => {
          showTooltip(nextTooltip);
        }, nextTooltip.delay);
      } else {
        showTooltip(nextTooltip);
      }
    }
  }, [tooltipQueue, currentTooltip]);

  // Listen for custom tooltip events
  useEffect(() => {
    const handleTooltipEvent = (event: CustomEvent) => {
      showTooltip(event.detail);
    };

    window.addEventListener('triggerTooltip', handleTooltipEvent as EventListener);
    return () => {
      window.removeEventListener('triggerTooltip', handleTooltipEvent as EventListener);
    };
  }, []);

  const showTooltip = (data: TooltipData) => {
    setCurrentTooltip(data);
    setIsTooltipVisible(true);
  };

  const hideTooltip = () => {
    if (currentTooltip) {
      // Mark as seen if showOnce is true
      if (currentTooltip.showOnce) {
        const seenTooltips = JSON.parse(localStorage.getItem('seenTooltips') || '[]');
        seenTooltips.push(currentTooltip.id);
        localStorage.setItem('seenTooltips', JSON.stringify(seenTooltips));
      }
      
      // Remove from queue
      setTooltipQueue(prev => prev.filter(t => t.id !== currentTooltip.id));
    }
    
    setCurrentTooltip(null);
    setIsTooltipVisible(false);
  };

  const value: TooltipContextType = {
    showTooltip,
    hideTooltip,
    isTooltipVisible,
    currentTooltip
  };

  return (
    <TooltipContext.Provider value={value}>
      {children}
      <TooltipSystem />
    </TooltipContext.Provider>
  );
};

export default TooltipProvider;