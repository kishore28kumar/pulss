'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Settings,
  Store,
  UserCog,
  BarChart3,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission, getUserRole } from '@/lib/permissions';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { 
    name: 'Categories', 
    href: '/dashboard/categories', 
    icon: FolderTree,
    requireAdminOrStaff: true, // Only ADMIN and STAFF can see Categories
  },
  { 
    name: 'Orders', 
    href: '/dashboard/orders', 
    icon: ShoppingCart,
    requireAdminOrStaff: true, // Only ADMIN and STAFF can see Orders
  },
  { 
    name: 'Customers', 
    href: '/dashboard/customers', 
    icon: Users,
    requireAdminOrStaff: true, // Only ADMIN and STAFF can see Customers
  },
  { 
    name: 'Tenants', 
    href: '/dashboard/staff', 
    icon: UserCog,
    permission: Permission.STAFF_VIEW,
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    permission: Permission.ANALYTICS_VIEW,
  },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    // Only close if we're on mobile, pathname actually changed (not on initial mount), and onClose exists
    if (onClose && window.innerWidth < 1024 && prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      onClose();
    }
    // Update the previous pathname
    prevPathnameRef.current = pathname;
  }, [pathname, onClose]);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pulss</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // Skip items that require Admin or Staff if user is SUPER_ADMIN
          if (item.requireAdminOrStaff && (!mounted || userRole === 'SUPER_ADMIN')) {
            return null;
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const navItem = (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );

          // If item has permission requirement, wrap in PermissionGuard
          if (item.permission) {
            return (
              <PermissionGuard key={item.name} permission={item.permission}>
                {navItem}
              </PermissionGuard>
            );
          }

          return navItem;
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors">
          <p className="text-xs text-gray-500 dark:text-gray-400">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

