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

    // Use the correct API URL - MUST be apis.rmlconnect.net (plural)
    const API_URL = 'https://apis.rmlconnect.net/wba/v1/messages';
    
    // Build OTP template payload
    // Format: media_template (as user confirmed works in browser)
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
          { type: 'OTP', parameter: otp || '0000' }
        ]
      }
    };
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 URL:', API_URL);
    console.log('📱 TOKEN TYPE:', token?.substring(0, 30));
    console.log('📱 HEADER USED: Authorization: Bearer <token>');
    console.log('📱 Payload:', JSON.stringify(payload));

    // Try with Bearer token (JWT)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📱 Response:', response.status, responseText);

      if (response.ok || response.status === 202) {
        let json;
        try { json = JSON.parse(responseText); } catch {}
        return NextResponse.json({ 
          success: true, 
          message: json?.message || 'OTP sent successfully!',
          response: responseText
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Route Mobile API error',
        details: responseText,
        status: response.status
      }, { status: response.status });
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send OTP',
        details: error.message
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