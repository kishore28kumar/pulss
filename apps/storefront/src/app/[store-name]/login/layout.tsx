'use client';

import { TenantProvider } from '@/contexts/TenantContext';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  );
}

