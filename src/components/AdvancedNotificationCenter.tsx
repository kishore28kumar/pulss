/**
 * Advanced Notification Center Component
 * Displays notifications with real API integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRinging,
  X,
  Check,
  Trash,
  Settings,
  Filter,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Notification {
  notification_id: string;
  type_code: string;
  type_name: string;
  type_icon: string;
  category: string;
  title: string;
  content: string;
  action_url: string | null;
  action_label: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read_at: string | null;
}

interface NotificationCenterProps {
  apiUrl?: string;
  pollingInterval?: number; // in milliseconds, default 30000 (30 seconds)
  onNotificationClick?: (notification: Notification) => void;
  enableWebSocket?: boolean; // Enable real-time WebSocket updates
  webSocketUrl?: string;
}

export const AdvancedNotificationCenter: React.FC<NotificationCenterProps> = ({
  apiUrl = '/api/advanced-notifications',
  pollingInterval = 30000,
  onNotificationClick,
  enableWebSocket = true,
  webSocketUrl = 'ws://localhost:3000/ws/notifications',
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // WebSocket for real-time updates
  const { isConnected: isWebSocketConnected } = useNotificationWebSocket({
    url: webSocketUrl,
    enabled: enableWebSocket,
    onNotification: (notification) => {
      // Add new notification to the list
      setNotifications((prev) => [notification, ...prev]);
      // Update unread count
      setUnreadCount((prev) => prev + 1);
      // Show toast
      toast.success(notification.title, {
        description: notification.content,
      });
    },
    onUnreadCountUpdate: (count) => {
      setUnreadCount(count);
    },
    onConnect: () => {
      console.log('Real-time notifications connected');
    },
    onDisconnect: () => {
      console.log('Real-time notifications disconnected');
    },
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const statusParam = filter === 'unread' ? '?status=pending,sent,delivered' : '';
      const response = await fetch(`${apiUrl}${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [apiUrl, filter]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [apiUrl]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${apiUrl}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${apiUrl}/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${apiUrl}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.notification_id !== notificationId));
        const notification = notifications.find((n) => n.notification_id === notificationId);
        if (notification && notification.status !== 'read') {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (notification.status !== 'read') {
      markAsRead(notification.notification_id);
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    } else if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Polling for new notifications (as fallback when WebSocket is not connected)
  useEffect(() => {
    // Always fetch on mount
    fetchUnreadCount();
    
    // Only poll if WebSocket is not connected
    if (!isWebSocketConnected) {
      const interval = setInterval(fetchUnreadCount, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [fetchUnreadCount, pollingInterval, isWebSocketConnected]);

  // Fetch notifications when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
  }, [isOpen, fetchNotifications]);

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    // This is a placeholder - you can customize based on your notification types
    return '🔔';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          {unreadCount > 0 ? (
            <BellRinging className="h-5 w-5 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle>Notifications</DialogTitle>
              {enableWebSocket && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {isWebSocketConnected ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      Live
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-orange-500" />
                      Polling
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {filter === 'all' ? 'All' : 'Unread'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    All Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('unread')}>
                    Unread Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <DialogDescription>
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.notification_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        notification.status !== 'read'
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)} mt-2`} />
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-grow">
                                <h4 className="font-semibold text-sm leading-tight">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.content}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {notification.status !== 'read' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.notification_id);
                                    }}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.notification_id);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.type_name || notification.type_code}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              {notification.action_label && (
                                <span className="text-xs text-primary flex items-center gap-1">
                                  {notification.action_label}
                                  <ChevronRight className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedNotificationCenter;
