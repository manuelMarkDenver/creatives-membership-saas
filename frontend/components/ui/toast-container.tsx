'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ToastContainer = dynamic(() => import('react-toastify').then(mod => ({ default: mod.ToastContainer })), {
  ssr: false,
  loading: () => null
})

export function ClientToastContainer() {
  return (
    <Suspense fallback={null}>
      <ToastContainer
        position="top-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Suspense>
  )
}