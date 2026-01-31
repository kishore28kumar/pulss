'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  link?: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await api.get('/broadcasts/storefront');
      return response.data.data as Broadcast[];
    },
    enabled: isAuthenticated,
    // Poll every minute for new notifications
    refetchInterval: 60000, 
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/broadcasts/storefront/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/broadcasts/storefront/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Broadcast) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center text-gray-700 hover:text-blue-600 transition group p-1"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            
            <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                   <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                     {unreadCount} new
                   </span>
                )}
                <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:underline"
                >
                    Mark all as read
                </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {notification.imageUrl && (
                        <div className="flex-shrink-0">
                          <img 
                            src={notification.imageUrl} 
                            alt="" 
                            className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          
                          {notification.link && (
                            <a 
                              href={notification.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation(); // Don't trigger parent click twice
                                handleNotificationClick(notification);
                              }}
                            >
                              <span>Open Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {!notification.isRead && (
                         <div className="flex-shrink-0 self-center">
                           <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                         </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
