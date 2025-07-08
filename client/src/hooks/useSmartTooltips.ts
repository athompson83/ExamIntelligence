import { useEffect, useState, useCallback } from 'react';
import { useTooltip } from '@/components/TooltipProvider';

interface SmartTooltipConfig {
  pageContext: string;
  userBehavior?: {
    timeOnPage?: number;
    clickCount?: number;
    scrollDepth?: number;
    hasInteracted?: boolean;
  };
  triggers?: {
    onIdle?: boolean;
    onFirstVisit?: boolean;
    onError?: boolean;
    onHover?: string; // selector
    onFocus?: string; // selector
  };
}

export const useSmartTooltips = (config: SmartTooltipConfig) => {
  const { showTooltip } = useTooltip();
  const [behaviorData, setBehaviorData] = useState({
    timeOnPage: 0,
    clickCount: 0,
    scrollDepth: 0,
    hasInteracted: false,
    isIdle: false,
    idleTime: 0
  });
  const [isTooltipSystemMuted, setIsTooltipSystemMuted] = useState(false);

  // Check if tooltip system is muted
  useEffect(() => {
    const isMuted = localStorage.getItem('tooltipSystemMuted') === 'true';
    setIsTooltipSystemMuted(isMuted);
    
    // Listen for mute state changes
    const handleMuteChange = () => {
      const newMutedState = localStorage.getItem('tooltipSystemMuted') === 'true';
      setIsTooltipSystemMuted(newMutedState);
    };
    
    window.addEventListener('storage', handleMuteChange);
    return () => window.removeEventListener('storage', handleMuteChange);
  }, []);

  // Track user behavior
  useEffect(() => {
    let timeInterval: NodeJS.Timeout;
    let idleTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    // Time tracking
    timeInterval = setInterval(() => {
      setBehaviorData(prev => ({
        ...prev,
        timeOnPage: prev.timeOnPage + 1
      }));
    }, 1000);

    // Activity tracking
    const resetIdleTimer = () => {
      lastActivity = Date.now();
      setBehaviorData(prev => ({ ...prev, isIdle: false, idleTime: 0 }));
      
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setBehaviorData(prev => ({ ...prev, isIdle: true }));
      }, 30000); // 30 seconds of inactivity
    };

    // Click tracking
    const handleClick = () => {
      setBehaviorData(prev => ({
        ...prev,
        clickCount: prev.clickCount + 1,
        hasInteracted: true
      }));
      resetIdleTimer();
    };

    // Scroll tracking
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollDepth = Math.round((scrolled / scrollHeight) * 100);
      
      setBehaviorData(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollDepth),
        hasInteracted: true
      }));
      resetIdleTimer();
    };

    // Keyboard tracking
    const handleKeyboard = () => {
      setBehaviorData(prev => ({ ...prev, hasInteracted: true }));
      resetIdleTimer();
    };

    // Mouse movement tracking
    const handleMouseMove = () => {
      resetIdleTimer();
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('mousemove', handleMouseMove);

    // Initialize idle timer
    resetIdleTimer();

    return () => {
      clearInterval(timeInterval);
      clearTimeout(idleTimer);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Smart tooltip triggers based on behavior (only if not muted)
  useEffect(() => {
    if (isTooltipSystemMuted) return;
    
    const checkTriggers = () => {
      // First visit tooltip
      if (config.triggers?.onFirstVisit) {
        const hasVisited = localStorage.getItem(`visited_${config.pageContext}`);
        if (!hasVisited) {
          setTimeout(() => {
            showTooltip({
              id: `first_visit_${config.pageContext}`,
              title: `Welcome to ${config.pageContext.replace('-', ' ')}!`,
              content: `This is your first time here. Let me show you around and help you get started with the key features.`,
              category: 'info',
              priority: 'high',
              showOnce: true
            });
          }, 2000);
          localStorage.setItem(`visited_${config.pageContext}`, 'true');
        }
      }

      // Idle behavior tooltip
      if (config.triggers?.onIdle && behaviorData.isIdle && behaviorData.timeOnPage > 30) {
        showTooltip({
          id: `idle_help_${config.pageContext}`,
          title: 'Need some help?',
          content: `I notice you've been here for a while. Would you like me to show you some tips or help you find what you're looking for?`,
          category: 'tip',
          priority: 'medium'
        });
      }

      // Low interaction tooltip
      if (behaviorData.timeOnPage > 60 && behaviorData.clickCount < 3 && !behaviorData.hasInteracted) {
        showTooltip({
          id: `low_interaction_${config.pageContext}`,
          title: 'Getting started tips',
          content: `Here are some quick actions you can take to get started with this page. Try clicking on any of the main buttons or menu items.`,
          category: 'tutorial',
          priority: 'medium'
        });
      }

      // Deep scroll without interaction
      if (behaviorData.scrollDepth > 70 && behaviorData.clickCount === 0) {
        showTooltip({
          id: `scroll_help_${config.pageContext}`,
          title: 'Found what you need?',
          content: `I see you're browsing through the content. If you need help with any specific feature, just ask me or click on the elements you're interested in.`,
          category: 'tip',
          priority: 'low'
        });
      }
    };

    checkTriggers();
  }, [behaviorData, config, showTooltip, isTooltipSystemMuted]);

  // Manual trigger functions (respect mute state)
  const triggerContextualTooltip = useCallback((element: HTMLElement) => {
    if (isTooltipSystemMuted) return;
    
    const elementType = element.tagName.toLowerCase();
    const elementText = element.textContent || element.getAttribute('aria-label') || '';
    
    let tooltipContent = '';
    let tooltipTitle = '';

    switch (elementType) {
      case 'button':
        tooltipTitle = 'Button Help';
        tooltipContent = `This button "${elementText}" performs a specific action. Click it to ${elementText.toLowerCase()}.`;
        break;
      case 'input':
        tooltipTitle = 'Input Field';
        tooltipContent = `This field is for entering data. Make sure to fill it out according to the requirements.`;
        break;
      case 'select':
        tooltipTitle = 'Dropdown Menu';
        tooltipContent = `Click to see available options and select the one that fits your needs.`;
        break;
      default:
        tooltipTitle = 'Interactive Element';
        tooltipContent = `This element "${elementText}" is interactive. Try clicking or hovering over it.`;
    }

    showTooltip({
      id: `contextual_${Date.now()}`,
      title: tooltipTitle,
      content: tooltipContent,
      category: 'info',
      priority: 'medium'
    });
  }, [showTooltip, isTooltipSystemMuted]);

  const triggerFeatureTooltip = useCallback((featureName: string, description: string) => {
    if (isTooltipSystemMuted) return;
    
    showTooltip({
      id: `feature_${featureName}`,
      title: `${featureName} Feature`,
      content: description,
      category: 'feature',
      priority: 'medium'
    });
  }, [showTooltip, isTooltipSystemMuted]);

  const triggerErrorTooltip = useCallback((errorMessage: string, solution?: string) => {
    if (isTooltipSystemMuted) return;
    
    showTooltip({
      id: `error_${Date.now()}`,
      title: 'Something went wrong',
      content: `${errorMessage}${solution ? `\n\nSuggested solution: ${solution}` : '\n\nTry refreshing the page or contact support if the issue persists.'}`,
      category: 'warning',
      priority: 'high'
    });
  }, [showTooltip, isTooltipSystemMuted]);

  return {
    behaviorData,
    triggerContextualTooltip,
    triggerFeatureTooltip,
    triggerErrorTooltip,
    isTooltipSystemMuted
  };
};

// Hook for page-specific tooltip management
export const usePageTooltips = (pageName: string) => {
  const smartTooltips = useSmartTooltips({
    pageContext: pageName,
    triggers: {
      onFirstVisit: true,
      onIdle: true
    }
  });

  // Page-specific tooltip configurations
  const pageConfigs: Record<string, any> = {
    dashboard: {
      welcomeDelay: 3000,
      featureTips: [
        { element: '.stats-card', tip: 'Click any statistics card for detailed insights' },
        { element: '.create-quiz-btn', tip: 'Start creating your first quiz here' },
        { element: '.recent-activity', tip: 'Monitor student progress in real-time' }
      ]
    },
    'item-banks': {
      welcomeDelay: 2000,
      featureTips: [
        { element: '.create-bank-btn', tip: 'Organize questions by creating topic-specific banks' },
        { element: '.ai-generate-btn', tip: 'Use AI to generate high-quality questions automatically' },
        { element: '.import-btn', tip: 'Import questions from existing files or other sources' }
      ]
    },
    'quiz-builder': {
      welcomeDelay: 2500,
      featureTips: [
        { element: '.question-pool', tip: 'Select questions from your item banks or create new ones' },
        { element: '.quiz-settings', tip: 'Configure time limits, attempts, and availability' },
        { element: '.preview-btn', tip: 'Test your quiz before publishing to students' }
      ]
    },
    analytics: {
      welcomeDelay: 3500,
      featureTips: [
        { element: '.performance-chart', tip: 'Track student performance trends over time' },
        { element: '.ml-insights', tip: 'Get AI-powered recommendations for improvement' },
        { element: '.export-btn', tip: 'Export data for detailed analysis or reporting' }
      ]
    }
  };

  const config = pageConfigs[pageName] || {};

  // Set up page-specific tooltips
  useEffect(() => {
    if (config.featureTips) {
      const timeout = setTimeout(() => {
        config.featureTips.forEach((tip: any, index: number) => {
          const element = document.querySelector(tip.element);
          if (element) {
            setTimeout(() => {
              smartTooltips.triggerFeatureTooltip(
                `${pageName} tip ${index + 1}`,
                tip.tip
              );
            }, index * 5000); // Stagger tips by 5 seconds
          }
        });
      }, config.welcomeDelay || 2000);

      return () => clearTimeout(timeout);
    }
  }, [pageName, config, smartTooltips]);

  return smartTooltips;
};

export default useSmartTooltips;