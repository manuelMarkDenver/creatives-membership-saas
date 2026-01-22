'use client'

import React from 'react'

interface GlobalErrorHandlerProps {
  children: React.ReactNode
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
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