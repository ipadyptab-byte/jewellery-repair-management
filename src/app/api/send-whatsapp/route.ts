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
      OTP, 
      shopName,
      expiry,
      token,
      apiUrl,
      isOtp 
    } = body

    if (!mobile || !token || !apiUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing mobile, token, or apiUrl' },
        { status: 400 }
      )
    }

    // Clean mobile number
    let phone = mobile.replace(/^\+/, '');
    
    // For OTP messages - keep original format (no 91 prefix)
    // For other messages - add 91 if not present
    if (!isOtp) {
      if (!phone.startsWith('91') && phone.length === 10) {
        phone = '91' + phone;
      }
    }
    // For OTP: keep as-is (e.g., 9422039371)

    // Correct API URL - MUST be apis.rmlconnect.net (plural)
    const API_URL = 'https://apis.rmlconnect.net/wba/v1/messages';
    
    // Standard template payload - NO button field (causes mismatch)
    // Fix phone FIRST (very important)
let phoneClean = mobile.replace(/\D/g, '');

if (!phoneClean.startsWith('91')) {
  phoneClean = '91' + phoneClean;
}

const payload = {
      phone: phone,
      media: {
        type: 'media_template',
        template_name: 'delivery_otp_dj_3',
        lang_code: 'en',
        body: [
            
          { text: OTP || '0000' }
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
