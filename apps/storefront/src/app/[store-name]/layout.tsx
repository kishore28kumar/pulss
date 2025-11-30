'use client';

import { usePathname } from 'next/navigation';
import { TenantProvider } from '@/contexts/TenantContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.endsWith('/login');

  return (
    <TenantProvider>
      {isLoginPage ? (
        children
      ) : (
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      )}
    </TenantProvider>
  );
}

