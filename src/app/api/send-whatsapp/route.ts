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

    // Clean mobile number - ensure it has country code
    let phone = mobile.replace(/^\+/, '');
    if (!phone.startsWith('91') && phone.length === 10) {
      phone = '91' + phone; // Add India country code if not present
    }

    // Build OTP template payload with COPY_CODE button for OTP
    // Using media_template format with template name
    const payload = {
      phone: phone,
      media: {
        type: 'media_template',
        template_name: 'delivery_otp', // Your approved template
        lang_code: 'en',
        body: [
          { text: customerName || 'Customer' },
          { text: otp || '0000' },
          { text: '10 mins' }
        ],
        header: [
          { text: shopName || 'Devi Jewellers' }
        ],
        button: [
          { type: 'OTP',otp_type:'COPY_CODE',text:'COPY CODE' }
        ]
      }
    }

    console.log('📱 Sending OTP via server proxy to:', apiUrl)
    console.log('📱 Payload:', JSON.stringify(payload, null, 2))

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