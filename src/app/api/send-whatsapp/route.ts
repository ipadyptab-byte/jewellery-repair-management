export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

/**
 * WhatsApp API Server-Side Proxy
 * 
 * Routes WhatsApp messages through Vercel server to avoid CORS issues.
 * This server makes the actual call to Route Mobile API.
 */

export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp API Proxy. Use POST.',
    version: '3.0.0'
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      mobile, 
      customerName, 
      otp, 
      shopName,
      expiry,
      token,
      apiUrl 
    } = body

    if (!mobile || !token || !apiUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing mobile, token, or apiUrl' },
        { status: 400 }
      )
    }

    // Clean mobile number
    const phone = mobile.replace(/^\+/, '')

    // Build OTP template payload (using Route Mobile template format)
    const payload = {
      phone: phone,
      template_id: '2739573333095990',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: shopName || 'Devi Jewellers' },
            { type: 'text', text: customerName || 'Customer' },
            { type: 'text', text: otp || '0000' },
            { type: 'text', text: expiry || '10 mins' }
          ]
        },
        {
          type: 'button',
          sub_type: 'COPY_CODE',
          parameters: []
        }
      ]
    }

    console.log('📱 Sending OTP via server proxy to:', apiUrl)

    // Make the actual call to Route Mobile from server
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    console.log('📱 Route Mobile response:', response.status, responseText)

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully',
        response: responseText
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Route Mobile API error',
        details: responseText,
        status: response.status
      }, { status: response.status })
    }
  } catch (error: any) {
    console.error('❌ WhatsApp proxy error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message'
    }, { status: 500 })
  }
}