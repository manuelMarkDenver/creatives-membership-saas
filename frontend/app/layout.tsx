import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import React from 'react'
import './globals.css'
import ReactQueryProvider from '@/lib/providers/react-query'
import { TenantProvider } from '@/lib/providers/tenant-context'
import { ThemeProvider } from '@/lib/providers/theme-provider'
import 'react-toastify/dist/ReactToastify.css'
import { ClientToastContainer } from '@/components/ui/toast-container'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GymBossLab - Gym Management System',
  description: 'Complete management solution for gyms and fitness centers',
  icons: {
    icon: '/gymbosslab-logo.jpeg',
    shortcut: '/gymbosslab-logo.jpeg',
    apple: '/gymbosslab-logo.jpeg',
  },
}

function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Handle XrayWrapper and cross-origin errors
      if (event.error?.message?.includes('XrayWrapper') ||
          event.error?.message?.includes('cross-origin') ||
          event.error?.message?.includes('Not allowed to define cross-origin')) {
        console.warn('Detected cross-origin error, clearing corrupted storage')
        try {
          localStorage.clear()
          sessionStorage.clear()
          // Force page reload to clean state
          window.location.reload()
        } catch (clearError) {
          console.error('Failed to clear storage on error:', clearError)
        }
        event.preventDefault()
        return true
      }
      return false
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('XrayWrapper') ||
          event.reason?.message?.includes('cross-origin') ||
          event.reason?.message?.includes('Not allowed to define cross-origin')) {
        console.warn('Detected cross-origin promise rejection, clearing corrupted storage')
        try {
          localStorage.clear()
          sessionStorage.clear()
          window.location.reload()
        } catch (clearError) {
          console.error('Failed to clear storage on rejection:', clearError)
        }
        event.preventDefault()
        return true
      }
      return false
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <GlobalErrorHandler>
              <TenantProvider>
                {children}
                <ClientToastContainer />
              </TenantProvider>
            </GlobalErrorHandler>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
