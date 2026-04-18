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
    // Using Meta WhatsApp Cloud API format
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'delivery_otp',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName || 'Customer' },
              { type: 'text', text: otp || '0000' },
              { type: 'text', text: '10 mins' }
            ]
          },
          {
            type: 'button',
            sub_type: 'otp',
            parameters: [
              { type: 'text', text: otp || '0000' }
            ]
          }
        ]
      }
    }

    // Try with Meta Cloud API format (uses token differently)
    const apiUrls = [
      'https://graph.facebook.com/v17.0/918055123971/messages', // Using Phone Number ID
      'https://graph.facebook.com/v18.0/918055123971/messages',
    ];
    
    // Also try the Route Mobile API with basic auth
    const rmUrls = [
      apiUrl,
      'https://api.rmlconnect.net/wba/v1/messages',
      'https://apis.rmlconnect.net/wba/v1/messages',
    ];

    // Try Meta Cloud API first (most common for WhatsApp Business)
    console.log('📱 Trying Meta Cloud API...');
    
    try {
      const metaResponse = await fetch('https://graph.facebook.com/v17.0/918055123971/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });

      const metaText = await metaResponse.text();
      console.log('📱 Meta API response:', metaResponse.status, metaText.substring(0, 200));

      if (metaResponse.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'OTP sent successfully via Meta API',
          response: metaText
        });
      }
    } catch (e: any) {
      console.log('📱 Meta API failed:', e.message);
    }

    // Try Route Mobile with basic auth (username:password)
    console.log('📱 Trying Route Mobile with basic auth...');
    
    const authHeader = Buffer.from('DEVIJEWEL:Welcome@1').toString('base64');
    
    for (const url of rmUrls) {
      if (!url) continue;
      
      console.log('📱 Trying URL:', url);
      
      try {
        // Try with basic auth header
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authHeader,
            'x-api-key': token
          },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('📱 Response:', response.status, responseText.substring(0, 200));

        if (response.ok) {
          return NextResponse.json({ 
            success: true, 
            message: 'OTP sent successfully',
            response: responseText
          });
        }
      } catch (e: any) {
        console.log('📱 Failed:', url, e.message);
      }
    }

    // Try with simple text message as fallback
    console.log('📱 Trying simple text message...');
    
    const textPayload = {
      phone: phone,
      type: 'text',
      message: 'Your OTP for jewellery delivery is: ' + (otp || '0000') + '. Valid for 10 minutes.'
    };

    for (const url of rmUrls) {
      if (!url) continue;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + authHeader
          },
          body: JSON.stringify(textPayload)
        });

        const responseText = await response.text();
        
        if (response.ok) {
          return NextResponse.json({ 
            success: true, 
            message: 'OTP sent as text message',
            response: responseText
          });
        }
      } catch (e: any) {
        console.log('📱 Text message failed:', e.message);
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'All WhatsApp API attempts failed',
      tried: ['Meta Cloud API', 'Route Mobile Basic Auth', 'Route Mobile Text']
    }, { status: 500 });
  } catch (error: any) {
    console.error('❌ WhatsApp proxy error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message'
    }, { status: 500 })
  }
}