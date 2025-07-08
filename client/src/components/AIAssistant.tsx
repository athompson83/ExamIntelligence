import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Book, HelpCircle, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTooltip } from './TooltipProvider';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentContext, setCurrentContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showTooltip } = useTooltip();

  // Detect current page context
  useEffect(() => {
    const path = window.location.pathname;
    const contextMap: Record<string, string> = {
      '/dashboard': 'Dashboard Overview',
      '/testbanks': 'Item Banks Management',
      '/quiz-builder': 'Quiz Creation',
      '/analytics': 'Analytics & Insights',
      '/settings': 'System Settings',
      '/proctoring': 'Live Proctoring',
      '/reference-banks': 'Reference Materials'
    };
    setCurrentContext(contextMap[path] || 'ProficiencyAI Platform');
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: `Hi! I'm your AI assistant for ${currentContext}. I can help you with questions, provide tips, and guide you through features. What would you like to know?`,
        type: 'assistant',
        timestamp: new Date(),
        suggestions: [
          'How do I create a new quiz?',
          'Show me analytics features',
          'What are the best practices for question creation?',
          'How does the proctoring system work?'
        ]
      }]);
    }
  }, [currentContext, messages.length]);

  const quickActions: QuickAction[] = [
    {
      id: 'create_quiz',
      label: 'Create Quiz',
      icon: <Book className="w-4 h-4" />,
      description: 'Guide me through creating a new quiz',
      action: () => handleQuickAction('I want to create a new quiz. Can you guide me through the process?')
    },
    {
      id: 'explain_analytics',
      label: 'Analytics Help',
      icon: <Sparkles className="w-4 h-4" />,
      description: 'Explain the analytics dashboard',
      action: () => handleQuickAction('Can you explain how to use the analytics dashboard?')
    },
    {
      id: 'best_practices',
      label: 'Best Practices',
      icon: <HelpCircle className="w-4 h-4" />,
      description: 'Show me best practices for this feature',
      action: () => handleQuickAction('What are the best practices for this feature?')
    },
    {
      id: 'troubleshooting',
      label: 'Troubleshooting',
      icon: <Zap className="w-4 h-4" />,
      description: 'Help with common issues',
      action: () => handleQuickAction('I need help troubleshooting an issue')
    }
  ];

  const handleQuickAction = (message: string) => {
    setInputMessage(message);
    handleSendMessage(message);
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: messageToSend,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageToSend);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userMessage: string): ChatMessage => {
    const message = userMessage.toLowerCase();
    
    // Context-aware responses based on current page and user message
    const responses = {
      quiz: {
        content: "I'll help you create a quiz! Here's the step-by-step process:\n\n1. Go to the Quiz Builder from your dashboard\n2. Add a title and description\n3. Select questions from your item banks or create new ones\n4. Configure settings like time limits and attempts\n5. Set availability dates and publish\n\nWould you like me to show you any specific step in detail?",
        suggestions: [
          "Show me question types available",
          "How do I set time limits?",
          "What are the best quiz settings?",
          "How do I add questions from item banks?"
        ]
      },
      analytics: {
        content: "The analytics dashboard provides powerful insights:\n\n📊 **Performance Trends**: Track student progress over time\n🎯 **Question Analysis**: See which questions are most/least effective\n🔍 **ML Insights**: AI-powered predictions and recommendations\n📈 **Engagement Metrics**: Monitor student interaction patterns\n\nEach section offers detailed breakdowns and export options. What specific analytics would you like to explore?",
        suggestions: [
          "Show me student performance trends",
          "How do I interpret question difficulty?",
          "What are ML insights?",
          "How do I export analytics data?"
        ]
      },
      help: {
        content: "I'm here to help! Here are some ways I can assist you:\n\n🎯 **Feature Guidance**: Step-by-step instructions for any feature\n💡 **Best Practices**: Tips for effective quiz creation and management\n🔧 **Troubleshooting**: Solve common issues quickly\n📚 **Learning Resources**: Educational content and tutorials\n\nWhat specific area would you like help with?",
        suggestions: [
          "Best practices for question writing",
          "How to improve student engagement",
          "Troubleshoot common issues",
          "Platform navigation tips"
        ]
      },
      default: {
        content: "Great question! Based on your current context, here's what I can help you with:\n\n✨ I can provide detailed guidance on any feature you're using\n🎯 Share best practices and tips for better results\n📊 Explain analytics and insights\n🔧 Help troubleshoot any issues\n\nFeel free to ask me anything specific, or use the quick actions below!",
        suggestions: [
          "What can you help me with?",
          "Show me tips for this page",
          "How do I get started?",
          "What are the main features?"
        ]
      }
    };

    let responseKey = 'default';
    if (message.includes('quiz') || message.includes('create') || message.includes('build')) {
      responseKey = 'quiz';
    } else if (message.includes('analytics') || message.includes('data') || message.includes('insights')) {
      responseKey = 'analytics';
    } else if (message.includes('help') || message.includes('how') || message.includes('guide')) {
      responseKey = 'help';
    }

    const response = responses[responseKey as keyof typeof responses];

    return {
      id: `ai_${Date.now()}`,
      content: response.content,
      type: 'assistant',
      timestamp: new Date(),
      suggestions: response.suggestions
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const MascotAvatar = () => (
    <motion.div
      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
      animate={{ 
        scale: isTyping ? [1, 1.1, 1] : 1,
        rotate: isTyping ? [0, 5, -5, 0] : 0
      }}
      transition={{ 
        duration: 2, 
        repeat: isTyping ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <Sparkles className="w-5 h-5 text-white" />
    </motion.div>
  );

  return (
    <>
      

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <Card className="shadow-2xl border-2 border-blue-200 bg-white overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MascotAvatar />
                    <div>
                      <h3 className="font-semibold">AI Assistant</h3>
                      <p className="text-xs text-blue-100">{currentContext}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                    >
                      {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="p-0">
                      {/* Messages */}
                      <div className="h-96 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.type === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.suggestions && (
                                <div className="mt-3 space-y-1">
                                  {message.suggestions.map((suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="w-full justify-start text-xs h-8 bg-white/20 hover:bg-white/30"
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing indicator */}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 p-3 rounded-lg">
                              <div className="flex space-x-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-gray-400 rounded-full"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ 
                                      duration: 1, 
                                      repeat: Infinity,
                                      delay: i * 0.2 
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Quick Actions */}
                      <div className="p-3 border-t bg-gray-50">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {quickActions.map((action) => (
                            <Button
                              key={action.id}
                              variant="outline"
                              size="sm"
                              onClick={action.action}
                              className="flex items-center justify-start space-x-2 h-8 text-xs"
                            >
                              {action.icon}
                              <span>{action.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Input */}
                      <div className="p-3 border-t bg-white">
                        <div className="flex space-x-2">
                          <Input
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isTyping}
                          />
                          <Button
                            onClick={() => handleSendMessage()}
                            disabled={!inputMessage.trim() || isTyping}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;