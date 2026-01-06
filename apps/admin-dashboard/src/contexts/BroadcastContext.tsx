'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

interface BroadcastContextType {
  broadcasts: Broadcast[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (broadcastId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshBroadcasts: () => Promise<void>;
}

const BroadcastContext = createContext<BroadcastContextType | undefined>(undefined);

export function BroadcastProvider({ children }: { children: React.ReactNode }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const isLoadingRef = useRef(false);
  const loadedUserIdRef = useRef<string | null>(null);

  // Memoize user to prevent unnecessary re-renders
  const user = React.useMemo(() => authService.getStoredUser(), []);

  // Get WebSocket URL
  const getWebSocketUrl = () => {
    if (typeof window === 'undefined') return '';
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    let wsUrl = apiUrl.replace(/\/api$/, '').replace(/^http/, 'ws');
    
    if (apiUrl.startsWith('https')) {
      wsUrl = apiUrl.replace(/\/api$/, '').replace(/^https/, 'wss');
    }
    
    return wsUrl;
  };

  // Load broadcasts
  const loadBroadcasts = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      const [broadcastsRes, countRes] = await Promise.all([
        api.get('/broadcasts'),
        api.get('/broadcasts/unread-count'),
      ]);

      const fetchedBroadcasts = broadcastsRes.data.data || [];
      let count = countRes.data.data?.unreadCount || 0;

      // Filter out own broadcasts from unread count for Super Admin
      if (user?.role === 'SUPER_ADMIN') {
        const ownBroadcastsUnread = fetchedBroadcasts.filter(
          (b: Broadcast) => !b.isRead && b.sender.id === user.id
        ).length;
        count = Math.max(0, count - ownBroadcastsUnread);
      }

      setBroadcasts(fetchedBroadcasts);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load broadcasts:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Mark broadcast as read
  const markAsRead = useCallback(async (broadcastId: string) => {
    try {
      await api.post(`/broadcasts/${broadcastId}/read`);
      
      // Update local state
      setBroadcasts((prev) =>
        prev.map((b) =>
          b.id === broadcastId ? { ...b, isRead: true, readAt: new Date().toISOString() } : b
        )
      );
      
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark broadcast as read:', error);
    }
  }, []);

  // Mark all broadcasts as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/broadcasts/mark-all-read');
      
      // Update local state
      setBroadcasts((prev) =>
        prev.map((b) => ({ ...b, isRead: true, readAt: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all broadcasts as read:', error);
    }
  }, []);

  // Load broadcasts on mount
  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role || '')) {
      setIsLoading(false);
      loadedUserIdRef.current = null;
      return;
    }

    const userId = user.id;
    
    // Only load if we haven't loaded yet for this user
    if (loadedUserIdRef.current !== userId) {
      loadedUserIdRef.current = userId;
      loadBroadcasts();
    }
  }, [user?.id, loadBroadcasts]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user.role || '')) {
      return;
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Connect to socket
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to broadcast WebSocket');
    });

    socket.on('broadcast:new', (newBroadcast: Broadcast) => {
      console.log('[BroadcastContext] New broadcast received:', newBroadcast);
      
      // Don't add to list or increment unread count if Super Admin sent it themselves
      const isOwnBroadcast = user?.id === newBroadcast.sender.id;
      
      if (isOwnBroadcast) {
        // Still add to list but mark as read immediately
        setBroadcasts((prev) => {
          // Check if broadcast already exists
          if (prev.some((b) => b.id === newBroadcast.id)) {
            return prev;
          }
          return [{ ...newBroadcast, isRead: true, readAt: new Date().toISOString() }, ...prev];
        });
        // Don't increment unread count for own broadcasts
      } else {
        // Add to broadcasts list
        setBroadcasts((prev) => {
          // Check if broadcast already exists
          if (prev.some((b) => b.id === newBroadcast.id)) {
            return prev;
          }
          return [newBroadcast, ...prev];
        });
        
        // Increment unread count only if not own broadcast
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from broadcast WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('Broadcast WebSocket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  return (
    <BroadcastContext.Provider
      value={{
        broadcasts,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshBroadcasts: loadBroadcasts,
      }}
    >
      {children}
    </BroadcastContext.Provider>
  );
}

export function useBroadcasts() {
  const context = useContext(BroadcastContext);
  if (context === undefined) {
    throw new Error('useBroadcasts must be used within a BroadcastProvider');
  }
  return context;
}

