'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import devtools only in development
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
  {
    ssr: false,
    loading: () => null,
  }
)

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: unknown) => {
              // Don't retry on 401, 403, 404
              const axiosError = error as { response?: { status?: number } }
              if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
