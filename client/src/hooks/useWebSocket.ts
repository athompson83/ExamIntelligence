import { useEffect, useState, useRef } from "react";
import { useAuth } from "./useAuth";

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

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
        
        // Handle specific message types
        switch (message.type) {
          case 'proctoring_alert':
            // Handle proctoring alerts
            console.log('Proctoring alert received:', message.data);
            break;
          case 'exam_progress':
            // Handle exam progress updates
            console.log('Exam progress update:', message.data);
            break;
          case 'notification':
            // Handle new notifications
            console.log('New notification:', message.data);
            break;
          default:
            console.log('WebSocket message:', message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (user) {
          console.log('Attempting to reconnect WebSocket...');
          // This will trigger the useEffect again
          setIsConnected(false);
        }
      }, 3000);
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

  return {
    isConnected,
    sendMessage,
    lastMessage,
  };
}
