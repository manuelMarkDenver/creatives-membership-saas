'use client'

import dynamic from 'next/dynamic'

const ToastContainer = dynamic(() => import('react-toastify').then(mod => mod.ToastContainer), {
  ssr: false,
  loading: () => null
})

export function ClientToastContainer() {
  return (
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
  )
}