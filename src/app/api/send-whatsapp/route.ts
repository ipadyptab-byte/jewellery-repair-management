import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp API Proxy. Use POST.',
    version: '3.0.0'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, otp, token } = body;

    if (!mobile || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing mobile or token' },
        { status: 400 }
      );
    }

    // Clean phone: remove non-digits, add 91 for India
    let phone = mobile.replace(/\D/g, '');
    if (!phone.startsWith('91')) phone = '91' + phone;

    const API_URL = 'https://apis.rmlconnect.net/wba/v1/messages';

   const payload = {
  to: phone, // e.g., "919422039371"
  type: 'template', // Or 'template', but try 'hsm' as seen in other APIs
  content: { // Some APIs nest the template under 'content'
    template: {
      namespace: 'your_namespace_here', // Check dashboard for this
      element_name: 'delivery_otp_dj_3',
      language: { policy: 'deterministic', code: 'en' },
      localizable_params: [{ default: otp }], // For body placeholder
      button: { // For the copy code button
        type: 'COPY_CODE',
        params: [otp]
      }
    }
  }
};
    console.log('📱 Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token   // ⚠️ No "Bearer " – use token directly as in your working version
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📱 Status:', response.status);
    console.log('📱 Response:', responseText);

    if (response.ok || response.status === 202) {
      return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
    } else {
      return NextResponse.json(
        { success: false, error: responseText || 'Route Mobile API error' },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
