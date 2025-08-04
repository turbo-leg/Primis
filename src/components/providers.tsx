'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { I18nProvider } from './providers/i18n-provider'
import { ScheduleProvider } from '../contexts/ScheduleContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ScheduleProvider>
            {children}
          </ScheduleProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
