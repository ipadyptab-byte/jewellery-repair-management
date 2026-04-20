export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, otp, token } = body;  // also shopName, expiry if needed

    if (!mobile || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing mobile or token' },
        { status: 400 }
      );
    }

    // --- Clean phone: always add 91 for India ---
    let phone = mobile.replace(/\D/g, '');          // remove all non-digits
    if (!phone.startsWith('91')) {
      phone = '91' + phone;
    }
    // final phone example: "919422039371"

    const API_URL = 'https://apis.rmlconnect.net/wba/v1/messages';

    // Payload matching your approved template
    const payload = {
      to: phone,
      type: "template",
      template: {
        name: "delivery_otp_dj_3",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: otp || "0000" }]
          },
          {
            type: "button",
            sub_type: "copy_code",
            index: 0,
            parameters: [{ type: "text", text: otp || "0000" }]
          }
        ]
      }
    };

    console.log('📱 Sending to:', API_URL);
    console.log('📱 Phone:', phone);
    console.log('📱 Payload:', JSON.stringify(payload, null, 2));

    // Try with Bearer (most common for JWT)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token   // try with Bearer first
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📱 Response status:', response.status);
    console.log('📱 Full response:', responseText);   // log everything, not just 200 chars

    if (response.ok || response.status === 202) {
      return NextResponse.json({ success: true, message: 'OTP sent!', response: responseText });
    } else {
      // Return the actual error from Route Mobile
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
