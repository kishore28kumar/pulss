'use client';

import { useState, useEffect } from 'react';
import { getUserRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  className?: string;
}

export default function RoleBadge({ className }: RoleBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setRole(getUserRole());
  }, []);

  // During SSR and before mount, render nothing to prevent hydration mismatch
  if (!mounted || !role) return null;

  const roleConfig: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800' },
    ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-800' },
    STAFF: { label: 'Staff', color: 'bg-gray-100 text-gray-800' },
    CUSTOMER: { label: 'Customer', color: 'bg-green-100 text-green-800' },
  };

  const config = roleConfig[role] || { label: role, color: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}

