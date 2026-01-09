'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserProvider } from '@/contexts/UserContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { BroadcastProvider } from '@/contexts/BroadcastContext';
import { MailProvider } from '@/contexts/MailContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <ChatProvider>
            <BroadcastProvider>
              <MailProvider>
                {children}
              </MailProvider>
            </BroadcastProvider>
          </ChatProvider>
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

