import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ReactQueryProvider from '@/lib/providers/react-query'
import { TenantProvider } from '@/lib/providers/tenant-context'
import { ThemeProvider } from '@/lib/providers/theme-provider'
import 'react-toastify/dist/ReactToastify.css'
import { ClientToastContainer } from '@/components/ui/toast-container'
import { GlobalErrorHandler } from '@/components/global-error-handler'

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
