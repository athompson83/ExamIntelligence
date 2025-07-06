import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, User, Send, MessageSquare, Lightbulb, HelpCircle, Navigation, Settings, BookOpen, BarChart3, Users, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for chatbot
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  metadata?: {
    intent?: string;
    confidence?: number;
    entities?: Record<string, any>;
    functionCalls?: FunctionCall[];
  };
}

interface ChatAction {
  id: string;
  type: "navigate" | "execute" | "display" | "download";
  label: string;
  description: string;
  payload: any;
}

interface FunctionCall {
  name: string;
  parameters: Record<string, any>;
  result?: any;
  status: "pending" | "completed" | "failed";
}

interface ChatSession {
  id: string;
  title: string;
  userId: string;
  messages: ChatMessage[];
  context: {
    userRole: string;
    currentPage?: string;
    recentActions?: string[];
    activeQuizzes?: any[];
    recentQuestions?: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: string;
  prompt: string;
  roles: string[];
}

export default function AIChatbotPage() {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => apiRequest("GET", "/api/auth/user"),
  });

  // Fetch chat sessions
  const { data: sessions } = useQuery({
    queryKey: ["/api/chat-sessions"],
    queryFn: () => apiRequest("GET", "/api/chat-sessions"),
  });

  // Fetch app context for chatbot
  const { data: appContext } = useQuery({
    queryKey: ["/api/chatbot/context"],
    queryFn: () => apiRequest("GET", "/api/chatbot/context"),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { sessionId: string; message: string; context?: any }) =>
      apiRequest("POST", "/api/chatbot/message", data),
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (response) => {
      setIsTyping(false);
      // Update current session with new messages
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          messages: [...currentSession.messages, response.userMessage, response.assistantMessage]
        });
      }
      setInputMessage("");
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (title: string) =>
      apiRequest("POST", "/api/chat-sessions", { title }),
    onSuccess: (session) => {
      setCurrentSession(session);
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
    },
  });

  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: (action: ChatAction) =>
      apiRequest("POST", "/api/chatbot/execute-action", action),
    onSuccess: (result) => {
      if (result.navigation) {
        // Navigate to the specified page
        window.location.href = result.navigation.url;
      }
      if (result.notification) {
        toast({
          title: result.notification.title,
          description: result.notification.message,
        });
      }
    },
  });

  const quickActions: QuickAction[] = [
    {
      id: "generate-study-guide",
      label: "Generate Study Guide",
      description: "Create a personalized study guide from your quizzes",
      icon: <BookOpen className="h-4 w-4" />,
      category: "Learning",
      prompt: "I need a study guide for the quizzes I have to take",
      roles: ["student"],
    },
    {
      id: "review-questions",
      label: "Review Questions",
      description: "Get AI recommendations on which questions need review",
      icon: <AlertCircle className="h-4 w-4" />,
      category: "Teaching",
      prompt: "Which questions should I review based on student performance and flags?",
      roles: ["teacher", "admin"],
    },
    {
      id: "performance-analytics",
      label: "Performance Analytics",
      description: "Get insights on student performance and progress",
      icon: <BarChart3 className="h-4 w-4" />,
      category: "Analytics",
      prompt: "Show me analytics on student performance and areas for improvement",
      roles: ["teacher", "admin"],
    },
    {
      id: "create-quiz",
      label: "Create Quiz",
      description: "Get help creating a new quiz or exam",
      icon: <MessageSquare className="h-4 w-4" />,
      category: "Creation",
      prompt: "Help me create a new quiz for my students",
      roles: ["teacher", "admin"],
    },
    {
      id: "navigation-help",
      label: "Navigation Help",
      description: "Get help finding features and navigating the app",
      icon: <Navigation className="h-4 w-4" />,
      category: "Support",
      prompt: "Help me navigate to the features I need",
      roles: ["all"],
    },
    {
      id: "student-progress",
      label: "Student Progress",
      description: "Check progress on assignments and quizzes",
      icon: <Users className="h-4 w-4" />,
      category: "Progress",
      prompt: "Show me my progress on assignments and upcoming deadlines",
      roles: ["student"],
    },
    {
      id: "system-help",
      label: "System Help",
      description: "Get help with platform features and troubleshooting",
      icon: <HelpCircle className="h-4 w-4" />,
      category: "Support",
      prompt: "I need help understanding how to use this platform",
      roles: ["all"],
    },
    {
      id: "feature-suggestions",
      label: "Feature Suggestions",
      description: "Get personalized feature recommendations",
      icon: <Lightbulb className="h-4 w-4" />,
      category: "Discovery",
      prompt: "What features would be most useful for my role and current needs?",
      roles: ["all"],
    },
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    let sessionId = currentSession?.id;
    
    if (!sessionId) {
      // Create new session
      const session = await createSessionMutation.mutateAsync("New Chat");
      sessionId = session.id;
    }

    sendMessageMutation.mutate({
      sessionId,
      message: inputMessage,
      context: {
        currentPage: window.location.pathname,
        userRole: user?.role,
        appContext: appContext,
      },
    });
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputMessage(action.prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleExecuteAction = (action: ChatAction) => {
    executeActionMutation.mutate(action);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const filteredQuickActions = quickActions.filter(action =>
    action.roles.includes("all") || action.roles.includes(user?.role || "student")
  );

  const groupedQuickActions = filteredQuickActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {} as Record<string, QuickAction[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            Get intelligent help navigating the platform and completing tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Compact View" : "Expanded View"}
          </Button>
          <Button
            onClick={() => createSessionMutation.mutate("New Chat")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${isExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {/* Quick Actions Panel */}
        {!isExpanded && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and helpful shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(groupedQuickActions).map(([category, actions]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2">{category}</h4>
                    <div className="space-y-2">
                      {actions.map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleQuickAction(action)}
                        >
                          {action.icon}
                          <span className="ml-2 text-left">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Interface */}
        <div className={`${isExpanded ? 'col-span-1' : 'lg:col-span-3'}`}>
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>
                      {currentSession?.title || "Start a conversation"}
                    </CardDescription>
                  </div>
                </div>
                {sessions && sessions.length > 0 && (
                  <Select
                    value={currentSession?.id || ""}
                    onValueChange={(sessionId) => {
                      const session = sessions.find((s: ChatSession) => s.id === sessionId);
                      setCurrentSession(session || null);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select conversation" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session: ChatSession) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                {!currentSession ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to Your AI Assistant</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      I'm here to help you navigate the platform, answer questions, and assist with tasks. 
                      Ask me anything or use the quick actions to get started.
                    </p>
                    
                    {/* Expanded Quick Actions */}
                    {isExpanded && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                        {filteredQuickActions.map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-center gap-2"
                            onClick={() => handleQuickAction(action)}
                          >
                            {action.icon}
                            <span className="text-sm font-medium">{action.label}</span>
                            <span className="text-xs text-muted-foreground text-center">
                              {action.description}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSession.messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback>
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-last' : ''}`}>
                          <div className={`rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {message.metadata?.confidence && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Confidence: {Math.round(message.metadata.confidence * 100)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          {message.actions && message.actions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.actions.map((action) => (
                                <Button
                                  key={action.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExecuteAction(action)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        {message.role === 'user' && (
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="flex-shrink-0">
                          <AvatarFallback>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about the platform..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The AI can help you navigate, create content, analyze data, and answer questions about the platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Highlight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Navigation className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Smart Navigation</h4>
              <p className="text-sm text-muted-foreground">
                I can guide you to any feature and help you complete complex tasks
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Data Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Get insights from your quiz data, student performance, and analytics
              </p>
            </div>
            <div className="text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Content Creation</h4>
              <p className="text-sm text-muted-foreground">
                Generate study materials, quizzes, and educational content automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}