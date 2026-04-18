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

    // Try multiple auth formats
    const authOptions = [
      { 'Authorization': token },  // Direct token
      { 'Authorization': 'Bearer ' + token },  // Bearer token
    ];
    
    // Use the correct Route Mobile API URL
    const rmApiUrl = 'https://apis.rmlconnect.net/wba/v1/messages';
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 URL:', rmApiUrl);
    console.log('📱 Payload:', JSON.stringify(payload, null, 2));
    
    let lastError = '';
    
    for (const headers of authOptions) {
      console.log('📱 Trying with headers:', { ...headers, 'Authorization': headers['Authorization']?.substring(0, 20) + '...' });
      
      try {
        const response = await fetch(rmApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers
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
        }
        
        lastError = responseText;
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        lastError = error.message;
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Route Mobile API error',
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