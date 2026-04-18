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

    // Build OTP template payload - Use correct template name delivery_otp_dj_3
    // With language as object and footer
    const payload = {
      phone: phone,
      template_name: 'delivery_otp_dj_3',
      language: { code: 'en' },
      footer: 'Code Expiration Time:10mins',
      body: [
        customerName || 'Customer',
        otp || '0000'
      ]
    }

    // Use the API URL from settings (or default to correct one)
    const rmApiUrls = [
      apiUrl || 'https://apis.rmlconnect.net/wba/v1/messages',
      'https://apis.rmlconnect.net/wba/v1/messages',
      'https://api.rmlconnect.net/wba/v1/messages',
    ];
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 Using API URLs:', rmApiUrls);
    console.log('📱 Token (first 30 chars):', token?.substring(0, 30));
    console.log('📱 Payload:', JSON.stringify(payload, null, 2));
    
    let lastError = '';
    
    for (const rmApiUrl of rmApiUrls) {
      // Try direct token
      console.log('📱 Trying:', rmApiUrl, 'with Authorization: <token>');
      try {
        const response = await fetch(rmApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify(payload)
        });
        const responseText = await response.text();
        console.log('📱 Response:', response.status, responseText);
        if (response.ok || response.status === 202) {
          return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
        }
        lastError = responseText;
      } catch (e: any) { lastError = e.message; }
      
      // Try Bearer token
      console.log('📱 Trying:', rmApiUrl, 'with Authorization: Bearer <token>');
      try {
        const response = await fetch(rmApiUrl, {
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
          return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
        }
        lastError = responseText;
      } catch (e: any) { lastError = e.message; }
      
      // Try X-API-Key header
      console.log('📱 Trying:', rmApiUrl, 'with X-API-Key: <token>');
      try {
        const response = await fetch(rmApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': token
          },
          body: JSON.stringify(payload)
        });
        const responseText = await response.text();
        console.log('📱 Response:', response.status, responseText);
        if (response.ok || response.status === 202) {
          return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
        }
        lastError = responseText;
      } catch (e: any) { lastError = e.message; }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Route Mobile API error - Invalid token',
      details: lastError,
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