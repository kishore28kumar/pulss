'use client';

import { usePathname } from 'next/navigation';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FrozenStoreMessage from '@/components/store/FrozenStoreMessage';
import FrozenAdminMessage from '@/components/store/FrozenAdminMessage';
import ChatWidget from '@/components/chat/ChatWidget';

function StoreLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.endsWith('/login');
  const isForgotPasswordPage = pathname?.endsWith('/forgot-password');
  const isResetPasswordPage = pathname?.endsWith('/reset-password');
  const isAuthPage = isLoginPage || isForgotPasswordPage || isResetPasswordPage;
  const { tenant, isLoading } = useTenant();

  // Show frozen admin message if admin is frozen (except on auth pages)
  if (!isAuthPage && !isLoading && tenant?.adminFrozen) {
    return <FrozenAdminMessage storeName={tenant.name} />;
  }

  // Show frozen message if tenant is frozen (except on auth pages)
  if (!isAuthPage && !isLoading && tenant?.status === 'FROZEN') {
    return <FrozenStoreMessage storeName={tenant.name} />;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      <StoreLayoutContent>{children}</StoreLayoutContent>
    </TenantProvider>
  );
}

