'use client';

import { useState, useEffect, useRef } from 'react';
import { LogOut, User, Store, Menu, MessageCircle, Mail } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { authService } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import RoleBadge from '@/components/permissions/RoleBadge';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { getUserRole } from '@/lib/permissions';
import { useChat } from '@/contexts/ChatContext';
import { useBroadcasts } from '@/contexts/BroadcastContext';
import { useMail } from '@/contexts/MailContext';

interface HeaderProps {
  onMenuClick?: () => void;
}

function ChatNotificationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useChat();
  
  // Only show notification when NOT on chat page and there are unread messages
  const isOnChatPage = pathname === '/dashboard/chat';
  const showNotification = !isOnChatPage && unreadCount > 0;

  const handleClick = () => {
    router.push('/dashboard/chat');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      title="Chat"
    >
      <MessageCircle className="w-5 h-5" />
      {showNotification && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
}

function MailNotificationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useMail();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  // Only show for Super Admin and Admin, but wait for mount to prevent hydration error
  if (!mounted || !['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
    return null;
  }
  
  // Only show notification when NOT on mail page and there are unread messages
  const isOnMailPage = pathname === '/dashboard/mail';
  const showNotification = !isOnMailPage && unreadCount > 0;

  const handleClick = () => {
    router.push('/dashboard/mail');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      title="Mail"
    >
      <Mail className="w-5 h-5" />
      {showNotification && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only access localStorage on the client side
    setUser(authService.getStoredUser());
    setUserRole(getUserRole());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 relative z-[60] transition-colors">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={handleMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 active:text-gray-900 dark:active:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700 transition-colors rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center z-[70] relative bg-white dark:bg-gray-800"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none', zIndex: 70 }}
          aria-label="Toggle menu"
          type="button"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              <span className="hidden sm:inline">
                Welcome back{isLoaded && userRole === 'SUPER_ADMIN' ? ', Super Admin' : user?.firstName ? `, ${user.firstName}` : ''}
              </span>
              <span className="sm:hidden">Dashboard</span>
            </h2>
            <div className="hidden sm:block">
              <RoleBadge />
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 mt-1">
            {user?.tenant && (
              <>
                <Store className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.tenant.name}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Chat Notifications */}
        <ChatNotificationButton />

        {/* Mail Notifications */}
        <MailNotificationButton />

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{user?.email}</p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 transition-colors">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

