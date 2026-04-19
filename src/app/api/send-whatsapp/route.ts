export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { mobile, otp, token } = await req.json()

    if (!mobile || !otp || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing mobile, otp or token' },
        { status: 400 }
      )
    }

    // ✅ Clean & format phone (MANDATORY)
    let phone = mobile.replace(/\D/g, '')
    if (!phone.startsWith('91')) {
      phone = '91' + phone
    }

    // ✅ CORRECT payload for AUTHENTICATION (OTP template)
    const payload = {
  phone: phone,
  media: {
    type: 'media_template',
    template_name: 'delivery_otp_dj_3',
    lang_code: 'en',
    button: {
      type: 'OTP',
      parameter: otp || '0000'
    }
  }
};
    console.log('📱 FINAL PAYLOAD:', JSON.stringify(payload, null, 2))

    const response = await fetch(
      'https://apis.rmlconnect.net/wba/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token   // ✅ NO "Bearer "
        },
        body: JSON.stringify(payload)
      }
    )

    const result = await response.text()

    console.log('📱 API RESPONSE:', response.status, result)

    if (response.ok || response.status === 202) {
      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json(
      { success: false, error: result },
      { status: 400 }
    )

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
