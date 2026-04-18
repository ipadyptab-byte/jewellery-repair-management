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

    // Build OTP template payload - Using delivery_otp_dj_3 template with COPY_CODE button
    const payload = {
      phone: phone,
      media: {
        type: 'media_template',
        template_name: 'delivery_otp_dj_3',
        lang_code: 'en',
        body: [
          { text: customerName || 'Customer' },
          { text: otp || '0000' }
        ],
        button: [
          {
            type: 'OTP',
            otp_type: 'COPY_CODE',
            text: 'COPY CODE'
          }
        ]
      }
    }

    // Use the correct Route Mobile API URL
    const rmApiUrl = 'https://apis.rmlconnect.net/wba/v1/messages';
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 URL:', rmApiUrl);
    console.log('📱 Payload:', JSON.stringify(payload, null, 2));
    
    try {
      // Use same format as browser - works!
      const response = await fetch(rmApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📱 Route Mobile response:', response.status, responseText);

      // Check for success
      if (response.ok || response.status === 202) {
        let json;
        try { json = JSON.parse(responseText); } catch {}
        return NextResponse.json({ 
          success: true, 
          message: json?.message || 'OTP sent successfully!',
          request_id: json?.request_id,
          response: responseText
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Route Mobile API error',
          details: responseText,
          status: response.status
        }, { status: response.status });
      }
    } catch (error: any) {
      console.error('❌ Route Mobile API error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to send WhatsApp message'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ WhatsApp proxy error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message'
    }, { status: 500 })
  }
}