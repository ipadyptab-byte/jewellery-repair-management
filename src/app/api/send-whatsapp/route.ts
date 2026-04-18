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

    // Build OTP template payload - try multiple formats
    // Format 1: Simple template with body array
    const payload1 = {
      phone: phone,
      template_name: 'delivery_otp_dj_3',
      language: { code: 'en' },
      footer: 'Code Expiration Time:10mins',
      body: [
        customerName || 'Customer',
        otp || '0000'
      ]
    };
    
    // Format 2: media_template format (as user said works in browser)
    const payload2 = {
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
    
    // Format 3: With namespace (if required)
    const payload3 = {
      phone: phone,
      template_name: 'delivery_otp_dj_3',
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName || 'Customer' },
            { type: 'text', text: otp || '0000' }
          ]
        }
      ]
    };

    // Use the API URL from settings (user-provided) OR fallback to known working URLs
    // Priority: user settings → correct apis URL → fallbacks
    let apiUrlsToTry: string[] = [];
    if (apiUrl && apiUrl.includes('rmlconnect')) {
      apiUrlsToTry = [apiUrl]; // Use user's URL first
    }
    apiUrlsToTry = [
      ...apiUrlsToTry,
      'https://apis.rmlconnect.net/wba/v1/messages',
      'https://api.rmlconnect.net/wba/v1/messages',
      'https://waba.rapigoconnect.com/v1/messages',
      'https://api.rapigoconnect.com/v1/messages',
    ];
    
    // Remove duplicates
    const rmApiUrls = [...new Set(apiUrlsToTry)];
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 Using API URLs:', rmApiUrls);
    console.log('📱 Token (first 30 chars):', token?.substring(0, 30));
    console.log('📱 Payload formats:', { payload1, payload2, payload3 });
    
    let lastError = '';
    
    // Try all combinations: URL + Auth + Payload Format
    for (const rmApiUrl of rmApiUrls) {
      for (const currentPayload of [payload1, payload2, payload3]) {
        // Try direct token
        console.log('📱 Trying:', rmApiUrl, 'payload:', JSON.stringify(currentPayload)?.substring(0, 50));
        try {
          const response = await fetch(rmApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify(currentPayload)
          });
          const responseText = await response.text();
          console.log('📱 Response:', response.status, responseText.substring(0, 200));
          if (response.ok || response.status === 202) {
            return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
          }
          lastError = responseText;
        } catch (e: any) { lastError = e.message; }
        
        // Try Bearer token
        try {
          const response = await fetch(rmApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(currentPayload)
          });
          const responseText = await response.text();
          console.log('📱 Bearer Response:', response.status, responseText.substring(0, 200));
          if (response.ok || response.status === 202) {
            return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
          }
          lastError = responseText;
        } catch (e: any) { lastError = e.message; }
        
        // Try X-API-Key header
        try {
          const response = await fetch(rmApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': token
            },
            body: JSON.stringify(currentPayload)
          });
          const responseText = await response.text();
          console.log('📱 X-API-Key Response:', response.status, responseText.substring(0, 200));
          if (response.ok || response.status === 202) {
            return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
          }
          lastError = responseText;
        } catch (e: any) { lastError = e.message; }
      }
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