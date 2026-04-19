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

    // Correct API URL - MUST be apis.rmlconnect.net (plural)
    const API_URL = 'https://apis.rmlconnect.net/wba/v1/messages';
    
    // Correct payload for WhatsApp Authentication Template (OTP with COPY_CODE)
    // NO body variables - OTP goes ONLY in button parameter
    const payload = {
      phone: phone,
      media: {
        type: 'media_template',
        template_name: 'delivery_otp_dj_3',
        lang_code: 'en',
        // NO body array - causes parameter mismatch error
        button: [
          { type: 'OTP', parameter: otp || '0000' }
        ]
      }
    };
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 URL:', API_URL);
    console.log('📱 TOKEN (first 30):', token?.substring(0, 30));
    console.log('📱 Payload:', JSON.stringify(payload));

    // Try WITHOUT Bearer first (most likely correct for JWT)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token  // Not "Bearer " - JWT goes directly
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📱 Response (no Bearer):', response.status, responseText?.substring(0, 200));

      if (response.ok || response.status === 202) {
        return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
      }
    } catch (e: any) { console.log('📱 Error (no Bearer):', e.message); }
    
    // Try WITH Bearer prefix (alternative for some APIs)
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
      console.log('📱 Response (Bearer):', response.status, responseText?.substring(0, 200));

      if (response.ok || response.status === 202) {
        return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
      }
    } catch (e: any) { console.log('📱 Error (Bearer):', e.message); }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Route Mobile API error - Invalid token or template mismatch',
      status: 400
    }, { status: 400 });
  } catch (error: any) {
    console.error('❌ WhatsApp proxy error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message'
    }, { status: 500 })
  }
}