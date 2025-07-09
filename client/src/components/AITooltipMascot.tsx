import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MessageCircle, Lightbulb, HelpCircle, Star, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TooltipData {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'help' | 'feature' | 'warning' | 'celebration';
  priority: 'low' | 'medium' | 'high';
  triggers: string[];
  conditions?: {
    role?: string[];
    page?: string[];
    firstTime?: boolean;
  };
}

interface AITooltipMascotProps {
  currentPage: string;
  className?: string;
}

const tooltipDatabase: TooltipData[] = [
  {
    id: 'dashboard-welcome',
    title: 'Welcome to ProficiencyAI! 🎉',
    content: 'I\'m your AI assistant! I can help you create quizzes, manage users, and navigate the platform. Click on me anytime for help!',
    type: 'celebration',
    priority: 'high',
    triggers: ['dashboard-load'],
    conditions: { firstTime: true }
  },
  {
    id: 'item-banks-tip',
    title: 'Pro Tip: Organize Your Questions',
    content: 'Item banks help you categorize questions by subject, difficulty, or topic. This makes creating quizzes much faster!',
    type: 'tip',
    priority: 'medium',
    triggers: ['item-banks-visit'],
    conditions: { page: ['/item-banks'] }
  },
  {
    id: 'quiz-builder-help',
    title: 'Quiz Builder Magic ✨',
    content: 'Use AI to generate questions automatically, or select from your item banks. You can mix and match for the perfect quiz!',
    type: 'feature',
    priority: 'high',
    triggers: ['quiz-builder-visit'],
    conditions: { page: ['/enhanced-quiz-builder'] }
  },
  {
    id: 'user-management-admin',
    title: 'User Management Hub',
    content: 'Here you can add users, assign roles, and generate registration links. Use CSV upload for bulk user creation!',
    type: 'help',
    priority: 'medium',
    triggers: ['user-management-visit'],
    conditions: { role: ['admin', 'super_admin', 'teacher'], page: ['/user-management'] }
  },
  {
    id: 'analytics-insights',
    title: 'Analytics Insights 📊',
    content: 'View detailed performance metrics, identify learning gaps, and track student progress over time.',
    type: 'feature',
    priority: 'medium',
    triggers: ['analytics-visit'],
    conditions: { page: ['/analytics', '/analytics-dashboard'] }
  },
  {
    id: 'live-proctoring',
    title: 'Live Proctoring Active',
    content: 'Monitor students in real-time during exams. Watch for violations and ensure exam integrity.',
    type: 'warning',
    priority: 'high',
    triggers: ['live-exam-start'],
    conditions: { page: ['/live-exams'] }
  },
  {
    id: 'ai-resources-power',
    title: 'AI-Powered Content Creation',
    content: 'Generate study guides, practice questions, and learning materials automatically using AI!',
    type: 'feature',
    priority: 'high',
    triggers: ['ai-resources-visit'],
    conditions: { page: ['/ai-resources'] }
  }
];

export default function AITooltipMascot({ currentPage, className = '' }: AITooltipMascotProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTooltip, setCurrentTooltip] = useState<TooltipData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [dismissedTooltips, setDismissedTooltips] = useState<string[]>([]);
  const [mascotMood, setMascotMood] = useState<'happy' | 'helpful' | 'excited' | 'thinking'>('happy');
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load dismissed tooltips from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed-tooltips');
    if (dismissed) {
      setDismissedTooltips(JSON.parse(dismissed));
    }
    
    const welcomeShown = localStorage.getItem('ai-mascot-welcome-shown');
    setHasShownWelcome(!!welcomeShown);
  }, []);

  // Context-aware tooltip triggering
  useEffect(() => {
    if (!user) return;

    const checkTooltips = () => {
      const relevantTooltips = tooltipDatabase.filter(tooltip => {
        // Skip if already dismissed
        if (dismissedTooltips.includes(tooltip.id)) return false;

        // Check conditions
        if (tooltip.conditions) {
          if (tooltip.conditions.role && !tooltip.conditions.role.includes(user.role)) return false;
          if (tooltip.conditions.page && !tooltip.conditions.page.some(page => currentPage.includes(page))) return false;
          if (tooltip.conditions.firstTime && hasShownWelcome) return false;
        }

        return true;
      });

      // Sort by priority and show highest priority tooltip
      const sortedTooltips = relevantTooltips.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      if (sortedTooltips.length > 0) {
        const tooltipToShow = sortedTooltips[0];
        setCurrentTooltip(tooltipToShow);
        setIsVisible(true);
        
        // Set mascot mood based on tooltip type
        const moodMap = {
          celebration: 'excited',
          feature: 'helpful',
          tip: 'thinking',
          help: 'helpful',
          warning: 'helpful'
        };
        setMascotMood(moodMap[tooltipToShow.type] as any);

        // Auto-hide after 8 seconds for tips, keep visible for help/warnings
        if (tooltipToShow.type === 'tip' || tooltipToShow.type === 'celebration') {
          timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 8000);
        }
      }
    };

    // Delay to avoid immediate popup
    const timer = setTimeout(checkTooltips, 2000);
    return () => {
      clearTimeout(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentPage, user, dismissedTooltips, hasShownWelcome]);

  const dismissTooltip = (tooltipId: string) => {
    const newDismissed = [...dismissedTooltips, tooltipId];
    setDismissedTooltips(newDismissed);
    localStorage.setItem('dismissed-tooltips', JSON.stringify(newDismissed));
    setIsVisible(false);
    
    if (tooltipId === 'dashboard-welcome') {
      localStorage.setItem('ai-mascot-welcome-shown', 'true');
      setHasShownWelcome(true);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setMascotMood('helpful');
  };

  const getMascotIcon = () => {
    switch (mascotMood) {
      case 'excited': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'helpful': return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case 'thinking': return <Lightbulb className="h-4 w-4 text-orange-500" />;
      default: return <MessageCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getTooltipColor = () => {
    if (!currentTooltip) return 'bg-blue-500';
    
    const colorMap = {
      celebration: 'bg-gradient-to-r from-purple-500 to-pink-500',
      feature: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      tip: 'bg-gradient-to-r from-green-500 to-teal-500',
      help: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      warning: 'bg-gradient-to-r from-orange-500 to-red-500'
    };
    
    return colorMap[currentTooltip.type];
  };

  if (!user) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* AI Mascot Button */}
      <div className="relative">
        <Button
          onClick={toggleExpanded}
          className={`
            rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 
            ${getTooltipColor()} hover:scale-105 border-2 border-white
            ${isExpanded ? 'ring-4 ring-blue-200' : ''}
          `}
          data-tour="ai-assistant"
        >
          <div className="flex items-center justify-center">
            {getMascotIcon()}
          </div>
        </Button>
        
        {/* Notification Badge */}
        {isVisible && currentTooltip && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Tooltip Content */}
      {isVisible && currentTooltip && (
        <div className="absolute bottom-16 right-0 w-80 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-xl border-2 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getMascotIcon()}
                  <h3 className="font-semibold text-sm">{currentTooltip.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissTooltip(currentTooltip.id)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {currentTooltip.content}
              </p>
              
              <div className="mt-3 flex justify-between items-center">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${currentTooltip.type === 'tip' ? 'bg-green-100 text-green-800' : ''}
                  ${currentTooltip.type === 'help' ? 'bg-blue-100 text-blue-800' : ''}
                  ${currentTooltip.type === 'feature' ? 'bg-purple-100 text-purple-800' : ''}
                  ${currentTooltip.type === 'warning' ? 'bg-orange-100 text-orange-800' : ''}
                  ${currentTooltip.type === 'celebration' ? 'bg-pink-100 text-pink-800' : ''}
                `}>
                  {currentTooltip.type}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissTooltip(currentTooltip.id)}
                  className="text-xs"
                >
                  Got it!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expanded Help Menu */}
      {isExpanded && !isVisible && (
        <div className="absolute bottom-16 right-0 w-80 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-xl border-2 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                Hi! I'm your AI assistant. I can help you with:
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Lightbulb className="h-3 w-3 text-orange-500" />
                  <span>Creating and managing quizzes</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <HelpCircle className="h-3 w-3 text-blue-500" />
                  <span>Understanding platform features</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>Best practices and tips</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="w-full text-xs"
                >
                  Hide Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}