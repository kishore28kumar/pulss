'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderType: 'customer' | 'admin' | 'staff' | 'super_admin';
  customerId: string | null;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  sendMessage: (text: string) => void;
  loadMoreHistory: () => Promise<void>;
  hasMoreHistory: boolean;
  unreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, customer } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [unreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const oldestMessageIdRef = useRef<string | null>(null);

  // Get tenant slug from URL path (since TenantProvider is in layout)
  const getTenantSlugFromPath = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    return pathSegments[0] || null;
  }, []);

  // Get WebSocket URL from API URL
  const getWebSocketUrl = () => {
    if (typeof window === 'undefined') return '';
    
    // Get API URL from config
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove /api suffix and convert http to ws, https to wss
    const wsUrl = apiUrl.replace(/\/api$/, '').replace(/^http/, 'ws');
    return wsUrl;
  };

  // Load chat history
  const loadChatHistory = useCallback(async (beforeMessageId?: string) => {
    const tenantSlug = getTenantSlugFromPath();
    if (!isAuthenticated || !tenantSlug || !customer) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        ...(beforeMessageId && { before: beforeMessageId }),
      });

      const response = await api.get(`/chat/history?${params}`);
      const { messages: fetchedMessages, hasMore } = response.data.data || {};

      if (!fetchedMessages || fetchedMessages.length === 0) {
        setMessages([]);
        setHasMoreHistory(false);
        setIsLoading(false);
        return;
      }

      if (beforeMessageId) {
        // Prepend older messages
        setMessages((prev) => [...fetchedMessages, ...prev]);
      } else {
        // Initial load - reverse to show oldest first
        const reversed = [...fetchedMessages].reverse();
        setMessages(reversed);
        if (reversed.length > 0) {
          oldestMessageIdRef.current = reversed[0].id;
        }
      }

      setHasMoreHistory(hasMore || false);
    } catch (error: any) {
      console.error('Failed to load chat history:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, customer, getTenantSlugFromPath]);

  // Connect to WebSocket
  useEffect(() => {
    const tenantSlug = getTenantSlugFromPath();
    if (!isAuthenticated || !tenantSlug || !customer) return;

    const token = localStorage.getItem('customerToken');
    if (!token) return;

    // Load history first
    loadChatHistory();

    // Connect to WebSocket
    const socket = io(getWebSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setIsConnected(true);

      // Join tenant room
      socket.emit('join-tenant', tenantSlug);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Listen for new messages
    socket.on('message', (newMessage: Message) => {
      console.log('[ChatContext] Received new message:', newMessage);
      setMessages((prev) => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some((m) => m.id === newMessage.id);
        if (exists) {
          console.log('[ChatContext] Message already exists, skipping');
          return prev;
        }

        // Add new message to the end
        console.log('[ChatContext] Adding new message to list');
        return [...prev, newMessage];
      });
    });

    // Listen for typing indicators
    socket.on('typing', (data: { userId: string; isTyping: boolean }) => {
      // Handle typing indicator if needed
      console.log('Typing:', data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, customer, loadChatHistory, getTenantSlugFromPath]);

  // Send message
  const sendMessage = useCallback(
    (text: string) => {
      const tenantSlug = getTenantSlugFromPath();
      if (!socketRef.current || !socketRef.current.connected || !tenantSlug) {
        console.error('Socket not connected or tenant slug not found');
        return;
      }

      socketRef.current.emit('message', {
        text,
        tenantId: tenantSlug,
      });
    },
    [getTenantSlugFromPath]
  );

  // Load more history
  const loadMoreHistory = useCallback(async () => {
    if (!hasMoreHistory || isLoading || !oldestMessageIdRef.current) return;

    await loadChatHistory(oldestMessageIdRef.current);
  }, [hasMoreHistory, isLoading, loadChatHistory]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isConnected,
        sendMessage,
        loadMoreHistory,
        hasMoreHistory,
        unreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

