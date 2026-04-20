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

    // Clean phone: digits only, add 91 for India
    let phone = mobile.replace(/\D/g, '');
    if (!phone.startsWith('91')) phone = '91' + phone;

    const API_URL = 'https://apis.rmlconnect.net/wba/v1/messages';

    const payload = {
      to: phone,
      type: 'template',
      template: {
        name: 'delivery_otp_dj_3',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp || '0000' }]
          },
          {
            type: 'button',
            sub_type: 'copy_code',
            index: 0,
            parameters: [{ type: 'text', text: otp || '0000' }]
          }
        ]
      }
    };

    console.log('📱 Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token   // ⚠️ No "Bearer " – as in your working second version
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
