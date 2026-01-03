'use client';

import { usePathname } from 'next/navigation';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FrozenStoreMessage from '@/components/store/FrozenStoreMessage';

function StoreLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.endsWith('/login');
  const { tenant, isLoading } = useTenant();

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
      <main className="flex-1">{children}</main>
      <Footer />
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

