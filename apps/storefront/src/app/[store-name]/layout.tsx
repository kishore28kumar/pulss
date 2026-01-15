'use client';

import { usePathname } from 'next/navigation';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FrozenStoreMessage from '@/components/store/FrozenStoreMessage';
import FrozenAdminMessage from '@/components/store/FrozenAdminMessage';
import ScheduleDrugWarning from '@/components/store/ScheduleDrugWarning';
import ChatWidget from '@/components/chat/ChatWidget';

function StoreLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.endsWith('/login');
  const { tenant, isLoading } = useTenant();

  // Show frozen admin message if admin is frozen (except on login page)
  if (!isLoginPage && !isLoading && tenant?.adminFrozen) {
    return <FrozenAdminMessage storeName={tenant.name} />;
  }

  // Show frozen message if tenant is frozen (except on login page)
  if (!isLoginPage && !isLoading && tenant?.status === 'FROZEN') {
    return <FrozenStoreMessage storeName={tenant.name} />;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Show schedule drug warning banner if tenant is not eligible */}
      {!isLoading && tenant && tenant.scheduleDrugEligible === false && (
        <ScheduleDrugWarning variant="banner" />
      )}
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

