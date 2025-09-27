import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";
import { queryClient } from "@/lib/queryClient";

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      
      // Authenticate the WebSocket connection
      sendMessage({
        type: 'authenticate',
        data: {
          userId: user.id,
          role: user.role,
        },
      });
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        // Handle specific message types and invalidate/update queries for real-time updates
        switch (message.type) {
          case 'proctoring_alert':
            // Invalidate proctoring alerts query to show new data immediately
            queryClient.invalidateQueries({ queryKey: ['/api/proctoring/alerts'] });
            console.log('Proctoring alert received, cache invalidated');
            break;
            
          case 'analytics_update':
            // Update analytics data directly without refetching
            queryClient.setQueryData(['/api/analytics/system'], message.data);
            console.log('Analytics update received, cache updated');
            break;
            
          case 'quiz_update':
            // Invalidate quiz-related queries
            queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
            queryClient.invalidateQueries({ queryKey: ['/api/quizzes/active'] });
            console.log('Quiz update received, caches invalidated');
            break;
            
          case 'exam_progress':
            // Update live exam monitoring data
            queryClient.invalidateQueries({ queryKey: ['/api/proctoring/session'] });
            console.log('Exam progress update received');
            break;
            
          case 'notification':
            // Invalidate notifications query
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            console.log('New notification received');
            break;
            
          case 'dashboard_stats_update':
            // Update dashboard stats
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
            console.log('Dashboard stats update received');
            break;
            
          default:
            console.log('WebSocket message:', message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log('WebSocket closed:', event.code, event.reason);
      
      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000); // Max 30 seconds
      
      if (user && reconnectAttempt < 5) { // Max 5 reconnect attempts
        console.log(`Attempting WebSocket reconnect in ${delay}ms (attempt ${reconnectAttempt + 1})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
        }, delay);
      } else if (reconnectAttempt >= 5) {
        console.error('Max WebSocket reconnection attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    // Send periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping', data: {} });
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [user]);

  // Request analytics update on demand
  const requestAnalyticsUpdate = useCallback(() => {
    sendMessage({
      type: 'request_analytics',
      data: {},
    });
  }, [sendMessage]);

  // Request alerts update on demand
  const requestAlertsUpdate = useCallback(() => {
    sendMessage({
      type: 'request_alerts',
      data: {},
    });
  }, [sendMessage]);

  // Subscribe to specific channels for targeted updates
  const subscribe = useCallback((channels: string[]) => {
    sendMessage({
      type: 'subscribe',
      data: { channels },
    });
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, []);

  // Reset reconnection attempts on successful connection
  useEffect(() => {
    if (isConnected) {
      setReconnectAttempt(0);
    }
  }, [isConnected]);

  return {
    isConnected,
    sendMessage,
    lastMessage,
    requestAnalyticsUpdate,
    requestAlertsUpdate,
    subscribe,
    reconnectAttempts: reconnectAttempt,
  };
}
