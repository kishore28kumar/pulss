'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

interface InternalMessage {
  id: string;
  subject: string;
  body: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  recipient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  lastMessage: InternalMessage;
  unreadCount: number;
}

interface MailContextType {
  conversations: Conversation[];
  currentMessages: InternalMessage[];
  currentPartner: Conversation['partner'] | null;
  unreadCount: number;
  isLoading: boolean;
  selectConversation: (partnerId: string) => Promise<void>;
  sendMessage: (recipientId: string, subject: string, body: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const MailContext = createContext<MailContextType | undefined>(undefined);

export function MailProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<InternalMessage[]>([]);
  const [currentPartner, setCurrentPartner] = useState<Conversation['partner'] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const isLoadingRef = useRef(false);
  const loadedUserIdRef = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

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

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      const [conversationsRes, countRes] = await Promise.all([
        api.get('/mail/conversations'),
        api.get('/mail/unread-count'),
      ]);

      const fetchedConversations = conversationsRes.data.data || [];
      const count = countRes.data.data?.unreadCount || 0;

      setConversations(fetchedConversations);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load mail conversations:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (partnerId: string) => {
    try {
      const response = await api.get(`/mail/messages/${partnerId}`);
      const messages = response.data.data || [];
      setCurrentMessages(messages);
      
      // Find partner info
      const conversation = conversations.find((c) => c.partnerId === partnerId);
      if (conversation) {
        setCurrentPartner(conversation.partner);
      }
      
      // Mark as read
      await api.post(`/mail/mark-read/${partnerId}`);
      
      // Update unread count
      const updatedConversations = conversations.map((c) =>
        c.partnerId === partnerId ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updatedConversations);
      
      const totalUnread = updatedConversations.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [conversations]);

  // Select conversation
  const selectConversation = useCallback(
    async (partnerId: string) => {
      await loadMessages(partnerId);
    },
    [loadMessages]
  );

  // Send message
  const sendMessage = useCallback(
    async (recipientId: string, subject: string, body: string) => {
      try {
        const response = await api.post('/mail/send', {
          recipientId,
          subject,
          body,
        });

        const newMessage = response.data.data;
        
        // Add to current messages if viewing this conversation
        if (currentPartner?.id === recipientId) {
          setCurrentMessages((prev) => [...prev, newMessage]);
        }
        
        // Refresh conversations
        await loadConversations();
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to send message');
      }
    },
    [currentPartner, loadConversations]
  );

  // Load conversations on mount
  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role || '')) {
      setIsLoading(false);
      return;
    }

    const userId = user.id;
    
    if (loadedUserIdRef.current !== userId) {
      loadedUserIdRef.current = userId;
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // loadConversations is stable

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role || '')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) return;

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      return;
    }

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
      console.log('✅ Connected to mail WebSocket');
    });

    socket.on('mail:new', (newMessage: InternalMessage) => {
      console.log('[MailContext] New message received:', newMessage);
      
      // Update conversations
      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.partnerId === newMessage.senderId
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: newMessage,
            unreadCount: updated[existingIndex].unreadCount + 1,
          };
          // Move to top
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          // New conversation - reload to get partner info
          loadConversations();
          return prev;
        }
      });
      
      // Add to current messages if viewing this conversation
      if (currentPartner?.id === newMessage.senderId) {
        setCurrentMessages((prev) => [...prev, newMessage]);
        // Mark as read
        api.post(`/mail/mark-read/${newMessage.senderId}`).catch(console.error);
      }
      
      // Update unread count
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification when not on mail page
      const isOnMailPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/mail';
      if (!isOnMailPage) {
        setTimeout(() => {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          if (currentPath === '/dashboard/mail') {
            return;
          }
          
          const senderName = newMessage.sender.firstName && newMessage.sender.lastName
            ? `${newMessage.sender.firstName} ${newMessage.sender.lastName}`
            : newMessage.sender.email;
          
          toast(`${senderName}`, {
            description: newMessage.subject,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                router.push('/dashboard/mail');
              },
            },
            style: {
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
            },
            className: 'mail-toast',
          });
        }, 100);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from mail WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('Mail WebSocket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, pathname, router, currentPartner]); // loadConversations is stable

  return (
    <MailContext.Provider
      value={{
        conversations,
        currentMessages,
        currentPartner,
        unreadCount,
        isLoading,
        selectConversation,
        sendMessage,
        refreshConversations: loadConversations,
      }}
    >
      {children}
    </MailContext.Provider>
  );
}

export function useMail() {
  const context = useContext(MailContext);
  if (context === undefined) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
}

