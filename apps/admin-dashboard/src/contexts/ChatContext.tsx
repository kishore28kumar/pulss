'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '@/lib/auth';
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

interface Conversation {
  customerId: string;
  tenantId?: string; // Add tenantId for Super Admin support
  tenantSlug?: string | null; // Add tenantSlug for Super Admin to join rooms
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
  unreadCount: number;
  lastMessage: Message | null;
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  unreadCount: number;
  selectConversation: (customerId: string) => void;
  sendMessage: (text: string, customerId: string) => void;
  markAsRead: (customerId: string) => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const loadConversationsRef = useRef<() => Promise<void>>();
  const selectConversationRef = useRef<((customerId: string) => Promise<void>) | null>(null);
  const isLoadingRef = useRef(false);
  const failedAttemptsRef = useRef(0);
  const isBlockedRef = useRef(false);
  const markAsReadRef = useRef<Set<string>>(new Set());
  const hasAutoSelectedRef = useRef(false);
  
  // Get user (will be stable unless user actually changes)
  const user = authService.getStoredUser();

  // Get WebSocket URL from API URL
  const getWebSocketUrl = () => {
    if (typeof window === 'undefined') return '';
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove /api suffix and convert http to ws
    let wsUrl = apiUrl.replace(/\/api$/, '').replace(/^http/, 'ws');
    
    // If it's https, convert to wss
    if (apiUrl.startsWith('https')) {
      wsUrl = apiUrl.replace(/\/api$/, '').replace(/^https/, 'wss');
    }
    
    console.log('[ChatContext] WebSocket URL:', wsUrl, 'from API URL:', apiUrl);
    return wsUrl;
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    // Prevent concurrent calls
    if (isLoadingRef.current || isBlockedRef.current) {
      console.log('[ChatContext] Skipping loadConversations - already loading or blocked');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token || !user) {
      console.log('[ChatContext] Skipping loadConversations - no token or user');
      setIsLoading(false);
      isLoadingRef.current = false;
      return;
    }

    // Block if we've had too many failures
    if (failedAttemptsRef.current >= 3) {
      console.error('[ChatContext] Too many failed attempts, blocking further requests');
      isBlockedRef.current = true;
      setIsLoading(false);
      // Disconnect socket
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await api.get('/chat/conversations');
      const conversationsData = response.data.data || [];
      setConversations(conversationsData);

      // Calculate total unread count
      const totalUnread = conversationsData.reduce(
        (sum: number, conv: Conversation) => sum + conv.unreadCount,
        0
      );
      setUnreadCount(totalUnread);
      
      // Auto-select first conversation if none is selected and conversations exist
      // Reset the flag when conversations are reloaded
      hasAutoSelectedRef.current = false;
      
      if (conversationsData.length > 0 && !currentConversation && selectConversationRef.current) {
        const firstConversation = conversationsData[0];
        console.log('[ChatContext] Auto-selecting first conversation:', firstConversation.customerId);
        hasAutoSelectedRef.current = true;
        // Use setTimeout to avoid calling selectConversation during render
        setTimeout(() => {
          if (selectConversationRef.current) {
            selectConversationRef.current(firstConversation.customerId);
          }
        }, 200);
      }
      
      // Reset failure counter on success
      failedAttemptsRef.current = 0;
      isBlockedRef.current = false;
      setIsLoading(false);
      isLoadingRef.current = false;
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      
      // If 401, increment failure counter
      if (error.response?.status === 401) {
        failedAttemptsRef.current += 1;
        console.warn(`Authentication error (attempt ${failedAttemptsRef.current}/3)`);
        
        // If refresh already happened and still failed, block further attempts immediately
        if (error.config?._retry) {
          console.error('Token refresh failed, blocking further requests');
          isBlockedRef.current = true;
          loadedUserIdRef.current = null;
          failedAttemptsRef.current = 999; // Set to high number to prevent any retries
          // Disconnect socket immediately
          if (socketRef.current?.connected) {
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          // Redirect to login immediately
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
      
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [user]);

  // Keep ref updated with latest loadConversations function
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (customerId: string) => {
    try {
      console.log('[ChatContext] Loading messages for customerId:', customerId);
      // Find the conversation to get tenant info for Super Admin
      const conversation = conversations.find((c) => c.customerId === customerId);
      
      // For Super Admin, include tenantId in query to filter by specific tenant
      let url = `/chat/history?customerId=${customerId}&limit=50`;
      if (user?.role === 'SUPER_ADMIN' && conversation?.tenantSlug) {
        url += `&tenantId=${conversation.tenantSlug}`;
      }
      
      const response = await api.get(url);
      const { messages: fetchedMessages } = response.data.data || {};
      
      if (!fetchedMessages || fetchedMessages.length === 0) {
        console.log('[ChatContext] No messages found for customerId:', customerId);
        setMessages([]);
        return;
      }
      
      // Reverse to show oldest first (messages come newest first from API)
      const reversedMessages = [...fetchedMessages].reverse();
      console.log('[ChatContext] Loaded', reversedMessages.length, 'messages');
      setMessages(reversedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  }, [conversations, user]);

  // Load conversations on mount and when user changes
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      loadedUserIdRef.current = null;
      failedAttemptsRef.current = 0;
      isBlockedRef.current = false;
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      loadedUserIdRef.current = null;
      failedAttemptsRef.current = 0;
      isBlockedRef.current = false;
      return;
    }

    // Don't load if blocked - completely stop trying
    if (isBlockedRef.current) {
      console.warn('Chat is blocked due to authentication failures');
      setIsLoading(false);
      return;
    }

    const userId = user.id;
    
    // Only load if we haven't loaded yet for this user
    if (loadedUserIdRef.current !== userId) {
      console.log('[ChatContext] User changed or initial load, loading conversations for userId:', userId);
      loadedUserIdRef.current = userId;
      failedAttemptsRef.current = 0; // Reset failures for new user
      isBlockedRef.current = false;
      
      // Load conversations immediately (no delay needed)
      // The API interceptor will handle token refresh if needed
      if (!isBlockedRef.current) {
        console.log('[ChatContext] Calling loadConversations immediately');
        loadConversations();
      } else {
        console.warn('[ChatContext] Blocked, skipping loadConversations');
      }
    } else {
      console.log('[ChatContext] User unchanged, skipping loadConversations. Current userId:', userId, 'Loaded userId:', loadedUserIdRef.current);
    }
  }, [user?.id, loadConversations]); // Include loadConversations but it's stable due to useCallback

  // Connect to WebSocket (separate effect to avoid reconnection loops)
  useEffect(() => {
    if (!user || isBlockedRef.current) {
      // Disconnect socket if blocked
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Don't reconnect if already connected and user hasn't changed
    if (socketRef.current?.connected) {
      return;
    }

    // Disconnect existing socket if it exists but isn't connected
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.error('[ChatContext] WebSocket URL is empty');
      return;
    }

    console.log('[ChatContext] Connecting to WebSocket:', wsUrl);

    // Connect to WebSocket
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: !isBlockedRef.current, // Disable reconnection if blocked
      reconnectionDelay: 2000,
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Admin connected to chat server');
      setIsConnected(true);

      // Join tenant room(s)
      if (user.role === 'SUPER_ADMIN') {
        // Super Admin will join tenant rooms dynamically when selecting conversations
        // For now, we'll join rooms as conversations are loaded
      } else if (user.tenant?.slug) {
        // Regular Admin/Staff join their own tenant
        socket.emit('join-tenant', user.tenant.slug);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Admin disconnected from chat server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[ChatContext] Connection error:', error.message || error);
      setIsConnected(false);
      
      // If authentication failed, don't retry
      if (error.message?.includes('Authentication') || error.message?.includes('token')) {
        console.error('[ChatContext] Authentication failed, blocking reconnection');
        isBlockedRef.current = true;
        socket.disconnect();
      }
    });

    // Listen for new messages
    const handleMessage = (newMessage: Message) => {
      console.log('[ChatContext] Received message:', newMessage);
      
      // Get current conversation to check if message belongs to it
      setCurrentConversation((current) => {
        // Check if message is for the current conversation
        // For customer messages, check customerId
        // For admin/staff/super_admin messages, also check customerId (they're replying to a customer)
        const isForCurrentConversation = current && newMessage.customerId === current.customerId;
        
        if (isForCurrentConversation) {
          console.log('[ChatContext] Adding message to current conversation');
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) {
              console.log('[ChatContext] Message already exists, skipping');
              return prev;
            }
            // Add message to the end of the list
            return [...prev, newMessage];
          });
        } else {
          console.log('[ChatContext] Message not for current conversation', {
            currentCustomerId: current?.customerId,
            messageCustomerId: newMessage.customerId,
            senderType: newMessage.senderType,
          });
        }
        return current;
      });

      // Only reload conversations if message is from a customer (creates/updates conversation)
      // Admin messages don't need to trigger conversation list reload
      // Don't reload if we're blocked or already loading
      if (newMessage.senderType === 'customer' && !isBlockedRef.current && !isLoadingRef.current) {
        // Update conversations list (debounced to prevent excessive calls)
        // Clear any existing timeout
        if (reloadTimeoutRef.current) {
          clearTimeout(reloadTimeoutRef.current);
        }
        
        // Set a new timeout to reload conversations after 3 seconds (increased from 2)
        reloadTimeoutRef.current = setTimeout(() => {
          if (loadConversationsRef.current && !isBlockedRef.current && !isLoadingRef.current) {
            console.log('[ChatContext] Reloading conversations after customer message');
            loadConversationsRef.current();
          }
          reloadTimeoutRef.current = null;
        }, 3000);
      }
    };

    socket.on('message', handleMessage);

    return () => {
      // Clear timeout on cleanup
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
      
      // Only disconnect if this is the current socket
      if (socketRef.current === socket) {
        console.log('[ChatContext] Cleaning up WebSocket connection');
        socket.off('message', handleMessage);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user ID to avoid reconnection loops

  // Mark messages as read
  const markAsRead = useCallback(
    async (customerId: string) => {
      // Prevent duplicate calls
      if (markAsReadRef.current.has(customerId)) {
        return;
      }

      markAsReadRef.current.add(customerId);
      
      try {
        // Find the conversation to get tenant info for Super Admin
        const conversation = conversations.find((c) => c.customerId === customerId);
        
        // For Super Admin, include tenantId to mark messages for specific tenant
        const body: any = { customerId };
        if (user?.role === 'SUPER_ADMIN' && conversation?.tenantSlug) {
          body.tenantId = conversation.tenantSlug;
        }
        
        await api.post('/chat/mark-read', body);
        
        // Update unread count locally instead of reloading conversations
        setConversations((prev) =>
          prev.map((conv) =>
            conv.customerId === customerId ? { ...conv, unreadCount: 0 } : conv
          )
        );
        
        // Update total unread count
        setUnreadCount((prev) => {
          const conv = conversations.find((c) => c.customerId === customerId);
          return Math.max(0, prev - (conv?.unreadCount || 0));
        });
      } catch (error) {
        console.error('Failed to mark as read:', error);
      } finally {
        // Remove from set after a delay to allow re-marking if needed
        setTimeout(() => {
          markAsReadRef.current.delete(customerId);
        }, 1000);
      }
    },
    [conversations, user]
  );

  // Select conversation
  const selectConversation = useCallback(
    async (customerId: string) => {
      const conversation = conversations.find((c) => c.customerId === customerId);
      if (!conversation) {
        console.warn('[ChatContext] Conversation not found for customerId:', customerId);
        return;
      }

      console.log('[ChatContext] Selecting conversation:', customerId);
      setCurrentConversation(conversation);
      
      // For Super Admin, join the tenant room if not already joined
      if (user?.role === 'SUPER_ADMIN' && conversation.tenantSlug && socketRef.current?.connected) {
        console.log(`[ChatContext] Super Admin joining tenant room: ${conversation.tenantSlug}`);
        socketRef.current.emit('join-tenant', conversation.tenantSlug);
      }
      
      // Load messages for this conversation
      await loadMessages(customerId);
      
      // Mark as read after a small delay to prevent race conditions
      setTimeout(() => {
        markAsRead(customerId);
      }, 500);
    },
    [conversations, loadMessages, user, markAsRead]
  );

  // Keep ref updated with selectConversation function
  useEffect(() => {
    selectConversationRef.current = selectConversation;
  }, [selectConversation]);

  // Send message
  const sendMessage = useCallback(
    (text: string, customerId: string) => {
      if (!socketRef.current || !socketRef.current.connected) {
        console.error('Socket not connected');
        return;
      }

      // Find the conversation to get tenant info
      const conversation = conversations.find((c) => c.customerId === customerId);
      if (!conversation) {
        console.error('Conversation not found');
        return;
      }

      // Get tenant slug from conversation or user's tenant
      let tenantId: string | undefined;
      
      // For Super Admin, get tenantSlug from conversation
      // For Admin, use their own tenant slug
      if (user?.role === 'SUPER_ADMIN') {
        tenantId = conversation.tenantSlug || undefined;
        if (!tenantId) {
          console.error('TenantSlug not found in conversation for Super Admin');
          return;
        }
      } else {
        tenantId = user?.tenant?.slug;
      }

      if (!tenantId) {
        console.error('Tenant ID not found');
        return;
      }

      // For Super Admin, send tenantSlug; for others, send tenantId (which is actually slug)
      // Always include customerId so backend knows which conversation this message belongs to
      if (user?.role === 'SUPER_ADMIN') {
        socketRef.current.emit('message', {
          text,
          tenantSlug: tenantId, // Send as tenantSlug for Super Admin
          customerId, // Include customerId for admin messages
        });
      } else {
        socketRef.current.emit('message', {
          text,
          tenantId, // For Admin/Staff, this is actually the slug
          customerId, // Include customerId for admin messages
        });
      }
    },
    [user, conversations]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        isLoading,
        isConnected,
        unreadCount,
        selectConversation,
        sendMessage,
        markAsRead,
        refreshConversations: loadConversations,
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

