'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Edit, Building2, Snowflake, Unlock, Download, Trash2, KeyRound } from 'lucide-react';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  tenants?: {
    id: string;
    name: string;
  };
}

interface StaffActionsPopoverProps {
  member: StaffMember;
  userRole: string | null;
  mounted: boolean;
  isOpen: boolean;
  onToggle: (memberId: string | null) => void;
  onEditStaff: () => void;
  onEditTenant: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onDownloadCustomers: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  isUnfreezePending?: boolean;
  isDeletePending?: boolean;
}

export default function StaffActionsPopover({
  member,
  userRole,
  mounted,
  isOpen,
  onToggle,
  onEditStaff,
  onEditTenant,
  onFreeze,
  onUnfreeze,
  onDownloadCustomers,
  onResetPassword,
  onDelete,
  isUnfreezePending = false,
  isDeletePending = false,
}: StaffActionsPopoverProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update position based on trigger button
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      setPosition({
        top: rect.bottom + scrollY + 4, // 4px gap
        // Align right edge of popover with right edge of button
        // Popover width is w-56 (14rem = 224px)
        left: rect.right + scrollX - 224 
      });
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both trigger and popover
      const target = event.target as Node;
      const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target);
      const isOutsidePopover = popoverRef.current && !popoverRef.current.contains(target);

      if (isOutsideTrigger && isOutsidePopover) {
        onToggle(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true); // Capture phase for nested scrolls
      window.addEventListener('resize', updatePosition);
      
      // Initial position update
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, onToggle]);

  const handleAction = (callback: () => void) => {
    callback();
    onToggle(null);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isOpen) {
      onToggle(member.id);
      // Position will be updated by useEffect when isOpen becomes true
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onToggle(null);
    }, 200); // 200ms delay
  };

  const isSuperAdmin = mounted && userRole === 'SUPER_ADMIN';
  const hasTenant = isSuperAdmin && member.tenants?.id;

  const popoverContent = (
    <div
      ref={popoverRef}
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[9999] w-56"
      style={{ 
        top: position?.top ?? 0, 
        left: position?.left ?? 0 
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Edit Tenant - SUPER_ADMIN only, or Edit Staff for non-SUPER_ADMIN */}
      {isSuperAdmin && hasTenant ? (
        <button
          onClick={() => handleAction(onEditTenant)}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Edit Tenant</span>
        </button>
      ) : (
        <PermissionGuard permission={Permission.STAFF_UPDATE}>
          <button
            onClick={() => handleAction(onEditStaff)}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Edit Staff</span>
          </button>
        </PermissionGuard>
      )}

      {/* Freeze/Unfreeze - SUPER_ADMIN only */}
      {isSuperAdmin && (
        <>
          {member.isActive ? (
            <button
              onClick={() => handleAction(onFreeze)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Snowflake className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Freeze Account</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction(onUnfreeze)}
              disabled={isUnfreezePending}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Unlock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>Unfreeze Account</span>
            </button>
          )}
        </>
      )}

      {/* Download Customers - SUPER_ADMIN only */}
      {hasTenant && (
        <button
          onClick={() => handleAction(onDownloadCustomers)}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Download Customers</span>
        </button>
      )}

      {/* Reset Password - SUPER_ADMIN only */}
      {isSuperAdmin && member.role === 'ADMIN' && (
        <button
          onClick={() => handleAction(onResetPassword)}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <KeyRound className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>Reset Password</span>
        </button>
      )}

      {/* Delete Staff */}
      <PermissionGuard permission={Permission.STAFF_DELETE}>
        <button
          onClick={() => handleAction(onDelete)}
          disabled={isDeletePending}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Staff</span>
        </button>
      </PermissionGuard>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => onToggle(isOpen ? null : member.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        title="More Actions"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        popoverContent,
        document.body
      )}
    </>
  );
}
