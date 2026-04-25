'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Load App dynamically only for Vercel domain
const AppComponent = dynamic(() => import('./App'), { ssr: false })

export default function Page() {
  const [isCustomDomain, setIsCustomDomain] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hostname = window.location.hostname
    const isCustom = hostname.includes('devi-jewellers') && !hostname.includes('vercel')
    setIsCustomDomain(isCustom)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        background: '#f5f5f5'
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  // For custom domain: show restricted message
  if (isCustomDomain) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        background: '#f5f5f5',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '500px'
        }}>
          <h1 style={{ color: '#c62828', marginBottom: '20px' }}>Devi Jewellers</h1>
          <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
            This portal is for viewing repair invoices only.
          </p>
          <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginTop: '15px' }}>
            Please use the invoice link sent via WhatsApp to view your invoice.
          </p>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '30px' }}>
            For repair inquiries, please contact Devi Jewellers directly.
          </p>
        </div>
      </div>
    )
  }

  // For Vercel domain: show the full application
  return <AppComponent />
}
