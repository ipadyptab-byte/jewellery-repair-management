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

    // Build OTP template payload for Route Mobile with COPY_CODE OTP button
    // Template: delivery_otp (ID: 970657965616814)
    const payload = {
      phone: phone,
      template_id: '970657965616814',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: []
        },
        {
          type: 'footer',
          parameters: [
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

    // Use the correct Route Mobile API URL (apis.rmlconnect.net - plural)
    const rmApiUrl = 'https://apis.rmlconnect.net/wba/v1/messages';
    
    console.log('📱 Sending OTP via Route Mobile API...');
    console.log('📱 URL:', rmApiUrl);
    console.log('📱 Payload:', JSON.stringify(payload, null, 2));
    
    try {
      // Route Mobile uses API key in Authorization header
      const response = await fetch(rmApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token // The API key directly
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📱 Route Mobile response:', response.status, responseText);

      if (response.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'OTP sent successfully via WhatsApp!',
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