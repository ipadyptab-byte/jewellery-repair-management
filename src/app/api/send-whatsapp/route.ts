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
        template_name: 'delivery_otp',
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
          { type: 'OTP', otp_type: 'COPY_CODE', text: 'COPY CODE' }
        ]
      }
    }

    // Try multiple API URLs in case the main one is deprecated
    const apiUrls = [
      apiUrl,
      'https://api.rmlconnect.net/wba/v1/messages',
      'https://apis.rmlconnect.net/wba/v1/messages',
      'https://wapi.rmlconnect.net/messages'
    ];
    
    let responseText = '';
    let responseStatus = 0;
    let lastError = '';
    
    for (const url of apiUrls) {
      if (!url) continue;
      
      console.log('📱 Trying API URL:', url);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify(payload)
        });

        responseText = await response.text();
        responseStatus = response.status;
        
        console.log('📱 Response from', url, ':', responseStatus, responseText.substring(0, 200));
        
        if (response.ok) {
          return NextResponse.json({ 
            success: true, 
            message: 'OTP sent successfully',
            response: responseText
          });
        }
        
        lastError = responseText;
      } catch (e: any) {
        lastError = e.message;
        console.log('📱 Failed:', url, e.message);
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Route Mobile API error - tried multiple endpoints',
      details: lastError,
      tried: apiUrls
    }, { status: 404 });
  } catch (error: any) {
    console.error('❌ WhatsApp proxy error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message'
    }, { status: 500 })
  }
}