'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const [mounted, setMounted] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check permissions only after mount (client-side)
    let access = false;

  if (permission) {
      access = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
      access = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
  } else {
    // No permission check specified, allow access
      access = true;
    }
    
    setHasAccess(access);
  }, [permission, permissions, requireAll]);

  // During SSR and before mount, render nothing (or fallback) to prevent hydration mismatch
  // This ensures server and client render the same thing initially
  if (!mounted) {
    return <>{fallback}</>;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

