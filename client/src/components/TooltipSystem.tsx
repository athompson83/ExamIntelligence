import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Lightbulb, Info, Zap, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TooltipData {
  id: string;
  title: string;
  content: string;
  category: 'tip' | 'info' | 'feature' | 'warning' | 'tutorial';
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  priority: 'low' | 'medium' | 'high';
  showOnce?: boolean;
  delay?: number;
}

interface AIResponse {
  message: string;
  suggestions: string[];
  context: string;
}

// AI Mascot Avatar Component
const AIMascot: React.FC<{ isActive: boolean; mood?: 'happy' | 'thinking' | 'excited' }> = ({ 
  isActive, 
  mood = 'happy' 
}) => {
  const colors = {
    happy: 'from-blue-400 to-blue-600',
    thinking: 'from-purple-400 to-purple-600',
    excited: 'from-green-400 to-green-600'
  };

  return (
    <div className="relative">
      <motion.div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[mood]} flex items-center justify-center shadow-lg`}
        animate={{ 
          scale: isActive ? [1, 1.1, 1] : 1,
          rotate: isActive ? [0, 5, -5, 0] : 0
        }}
        transition={{ 
          duration: 2, 
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        <Zap className="w-6 h-6 text-white" />
      </motion.div>
      
      {/* Thinking dots animation */}
      {mood === 'thinking' && (
        <motion.div
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-gray-400 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  delay: i * 0.2 
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Contextual Tooltip Component
const ContextualTooltip: React.FC<{
  data: TooltipData;
  onClose: () => void;
  onInteract: (action: string) => void;
}> = ({ data, onClose, onInteract }) => {
  const [aiResponse, setAIResponse] = useState<AIResponse | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tip': return <Lightbulb className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'feature': return <Zap className="w-4 h-4" />;
      case 'tutorial': return <BookOpen className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tip': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'feature': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-red-100 text-red-800 border-red-200';
      case 'tutorial': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAIHelp = async () => {
    setIsThinking(true);
    onInteract('ai_help_requested');
    
    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate contextual AI response
    const responses: AIResponse[] = [
      {
        message: "I can help you with that! This feature is designed to make your workflow more efficient.",
        suggestions: [
          "Try using keyboard shortcuts for faster navigation",
          "Check out the advanced settings for more options",
          "Consider bookmarking this page for quick access"
        ],
        context: "productivity"
      },
      {
        message: "Great question! Let me break this down for you step by step.",
        suggestions: [
          "Start with the basics and gradually explore advanced features",
          "Use the search function to find specific tools quickly",
          "Join our community for tips and best practices"
        ],
        context: "learning"
      },
      {
        message: "This is a powerful feature that can save you lots of time!",
        suggestions: [
          "Customize the settings to match your workflow",
          "Enable notifications for important updates",
          "Explore the integration options available"
        ],
        context: "optimization"
      }
    ];
    
    setAIResponse(responses[Math.floor(Math.random() * responses.length)]);
    setIsThinking(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed z-50 max-w-sm"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <Card className="shadow-xl border-2 border-blue-200 bg-white">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <AIMascot isActive={isThinking} mood={isThinking ? 'thinking' : 'happy'} />
              <div>
                <h3 className="font-semibold text-gray-900">{data.title}</h3>
                <Badge variant="outline" className={`text-xs ${getCategoryColor(data.category)}`}>
                  {getCategoryIcon(data.category)}
                  <span className="ml-1 capitalize">{data.category}</span>
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-gray-700 leading-relaxed">{data.content}</p>

            {/* AI Response */}
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200"
              >
                <div className="flex items-start space-x-2">
                  <AIMascot isActive={false} mood="excited" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">{aiResponse.message}</p>
                    <div className="space-y-1">
                      {aiResponse.suggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-2 text-xs text-gray-600"
                        >
                          <Target className="w-3 h-3 text-blue-500" />
                          <span>{suggestion}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleAIHelp}
                disabled={isThinking}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isThinking ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2"
                    >
                      <Zap className="w-4 h-4" />
                    </motion.div>
                    Thinking...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ask AI
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onInteract('dismissed')}
                className="flex-1"
              >
                Got it!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Tooltip System Component
export const TooltipSystem: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null);
  const [tooltipQueue, setTooltipQueue] = useState<TooltipData[]>([]);
  const [dismissedTooltips, setDismissedTooltips] = useState<Set<string>>(new Set());
  const [isTooltipSystemMuted, setIsTooltipSystemMuted] = useState(false);

  // Check if tooltip system is muted on mount and cleanup old dismissed tooltips
  useEffect(() => {
    const isMuted = localStorage.getItem('tooltipSystemMuted') === 'true';
    setIsTooltipSystemMuted(isMuted);
    
    // Clean up old dismissed tooltips from previous sessions (older than 24 hours)
    const currentTime = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dismissed_')) {
        const sessionValue = localStorage.getItem(key);
        if (sessionValue && sessionValue.startsWith('session_')) {
          const sessionTime = parseInt(sessionValue.replace('session_', ''));
          // Remove if older than 24 hours (next login session)
          if (currentTime - sessionTime > 24 * 60 * 60 * 1000) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  // Save mute state to localStorage
  const toggleTooltipMute = useCallback(() => {
    const newMutedState = !isTooltipSystemMuted;
    setIsTooltipSystemMuted(newMutedState);
    localStorage.setItem('tooltipSystemMuted', newMutedState.toString());
    
    // Clear active tooltip when muting
    if (newMutedState) {
      setActiveTooltip(null);
      setTooltipQueue([]);
    }
  }, [isTooltipSystemMuted]);

  // Sample tooltip data
  const tooltipData: TooltipData[] = [
    {
      id: 'welcome',
      title: 'Welcome to ProficiencyAI! 👋',
      content: 'I\'m here to help you navigate the platform. I can provide tips, answer questions, and guide you through features as you explore.',
      category: 'info',
      priority: 'high',
      showOnce: true,
      delay: 2000
    },
    {
      id: 'quiz-builder-tip',
      title: 'Quiz Builder Pro Tip',
      content: 'Did you know you can save time by using AI to generate similar questions? Just click the "Generate Similar" button next to any question!',
      category: 'tip',
      priority: 'medium',
      targetElement: '.quiz-builder',
      delay: 5000
    },
    {
      id: 'analytics-feature',
      title: 'New Analytics Dashboard',
      content: 'Check out the new ML-powered analytics that can predict student performance and identify learning gaps!',
      category: 'feature',
      priority: 'high',
      targetElement: '.analytics-tab'
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      content: 'Speed up your workflow with keyboard shortcuts! Press Ctrl+K to open the command palette, or Ctrl+/ to see all shortcuts.',
      category: 'tutorial',
      priority: 'low',
      delay: 10000
    }
  ];

  useEffect(() => {
    // Initialize tooltip queue with non-dismissed tooltips only if not muted
    if (!isTooltipSystemMuted) {
      const availableTooltips = tooltipData.filter(tooltip => {
        // Check if dismissed in current session
        const dismissedKey = `dismissed_${tooltip.id}`;
        const isDismissedThisSession = localStorage.getItem(dismissedKey) !== null;
        
        return !dismissedTooltips.has(tooltip.id) && !isDismissedThisSession;
      });
      setTooltipQueue(availableTooltips);
    } else {
      setTooltipQueue([]);
    }
  }, [dismissedTooltips, isTooltipSystemMuted]);

  useEffect(() => {
    if (tooltipQueue.length > 0 && !activeTooltip && !isTooltipSystemMuted) {
      const nextTooltip = tooltipQueue.find(t => 
        t.priority === 'high' || 
        (!tooltipQueue.some(tt => tt.priority === 'high'))
      ) || tooltipQueue[0];

      if (nextTooltip.delay) {
        setTimeout(() => {
          setActiveTooltip(nextTooltip);
        }, nextTooltip.delay);
      } else {
        setActiveTooltip(nextTooltip);
      }
    }
  }, [tooltipQueue, activeTooltip, isTooltipSystemMuted]);

  const handleTooltipClose = () => {
    setActiveTooltip(null);
    if (activeTooltip) {
      setTooltipQueue(prev => prev.filter(t => t.id !== activeTooltip.id));
      if (activeTooltip.showOnce) {
        setDismissedTooltips(prev => new Set([...prev, activeTooltip.id]));
      }
    }
  };

  const handleTooltipInteract = (action: string) => {
    console.log('Tooltip interaction:', action, activeTooltip?.id);
    
    if (action === 'dismissed') {
      // Mark this specific tooltip as dismissed until next login
      if (activeTooltip?.id) {
        const currentSession = `session_${Date.now()}`;
        const dismissedKey = `dismissed_${activeTooltip.id}`;
        localStorage.setItem(dismissedKey, currentSession);
      }
      handleTooltipClose();
    }
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tooltip_interaction', {
        action,
        tooltip_id: activeTooltip?.id,
        category: activeTooltip?.category
      });
    }
  };

  return (
    <>
      {/* Mute/Unmute Toggle Button */}
      <motion.button
        onClick={toggleTooltipMute}
        className={`fixed bottom-4 right-4 z-40 p-3 rounded-full shadow-lg border-2 transition-all duration-200 ${
          isTooltipSystemMuted 
            ? 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200' 
            : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isTooltipSystemMuted ? 'Enable AI Assistant' : 'Disable AI Assistant'}
      >
        {isTooltipSystemMuted ? (
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <X className="w-2 h-2 text-white" />
            </div>
          </div>
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
      </motion.button>

      {/* Tooltip System */}
      <AnimatePresence>
        {activeTooltip && !isTooltipSystemMuted && (
          <ContextualTooltip
            data={activeTooltip}
            onClose={handleTooltipClose}
            onInteract={handleTooltipInteract}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Hook for triggering tooltips from other components
export const useTooltipTrigger = () => {
  const triggerTooltip = (tooltipData: Partial<TooltipData>) => {
    // Dispatch custom event to trigger tooltip
    const event = new CustomEvent('triggerTooltip', {
      detail: {
        id: tooltipData.id || `tooltip_${Date.now()}`,
        title: tooltipData.title || 'Information',
        content: tooltipData.content || '',
        category: tooltipData.category || 'info',
        priority: tooltipData.priority || 'medium',
        ...tooltipData
      }
    });
    window.dispatchEvent(event);
  };

  return { triggerTooltip };
};

export default TooltipSystem;