'use client'
import dynamic from 'next/dynamic'

const AppComponent = dynamic(() => import('./App'), { ssr: false })

export default function Page() {
  return <AppComponent />
}

