/**
 * WebSocket Hook for Real-time Notifications
 * Optional enhancement - falls back to polling if WebSocket is unavailable
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface NotificationMessage {
  type: 'notification' | 'unread_count' | 'connected' | 'pong';
  data?: any;
  count?: number;
  message?: string;
}

interface UseNotificationWebSocketOptions {
  url?: string;
  enabled?: boolean;
  onNotification?: (notification: any) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
}

export const useNotificationWebSocket = ({
  url = 'ws://localhost:3000/ws/notifications',
  enabled = true,
  onNotification,
  onUnreadCountUpdate,
  onConnect,
  onDisconnect,
  reconnectInterval = 5000,
}: UseNotificationWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldConnectRef = useRef(enabled);

  // Update shouldConnect when enabled changes
  useEffect(() => {
    shouldConnectRef.current = enabled;
  }, [enabled]);

  const connect = useCallback(() => {
    if (!shouldConnectRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token available');
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Create WebSocket connection
      const wsUrl = `${url}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'notification':
              console.log('Received notification via WebSocket:', message.data);
              onNotification?.(message.data);
              break;

            case 'unread_count':
              console.log('Unread count update:', message.count);
              if (message.count !== undefined) {
                onUnreadCountUpdate?.(message.count);
              }
              break;

            case 'connected':
              console.log('WebSocket handshake complete:', message.message);
              break;

            case 'pong':
              // Heartbeat response
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        onDisconnect?.();

        // Attempt to reconnect if should still be connected
        if (shouldConnectRef.current && event.code !== 1000) {
          console.log(`Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [url, onNotification, onUnreadCountUpdate, onConnect, onDisconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Disconnected by user');
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }, []);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      send({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, send]);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send,
  };
};

export default useNotificationWebSocket;
