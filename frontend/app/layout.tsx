import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ReactQueryProvider from '@/lib/providers/react-query'
import { TenantProvider } from '@/lib/providers/tenant-context'
import { ThemeProvider } from '@/lib/providers/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Creative SaaS - Multi-Tenant Management',
  description: 'Manage your business tenants, branches, and users',
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
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <TenantProvider>
              {children}
            </TenantProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
