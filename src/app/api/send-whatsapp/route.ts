export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

/**
 * WhatsApp API Proxy
 * 
 * Due to Vercel serverless network issues reaching Route Mobile,
 * this endpoint returns the configuration for client-side calls.
 * 
 * Client should call Route Mobile directly from browser:
 * POST https://apis.rmlconnect.net/wba/v1/messages
 * Headers: Authorization: <token>
 * Body: { phone, media: { type, template_name, lang_code, body } }
 */

export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp API. Use POST.',
    proxy: true,
    clientSide: true,
    version: '2.0.0'
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { mobile, templateName, params, header, token } = body

  if (!mobile || !templateName || !token) {
    return NextResponse.json(
      { success: false, error: 'Missing mobile, templateName, or token' },
      { status: 400 }
    )
  }

  // Build payload
  const payload: any = {
    phone: mobile,
    media: {
      type: 'media_template',
      template_name: templateName,
      lang_code: 'en',
      body: params?.slice(0, 4).map((p: string) => ({ text: p })) || []
    }
  }

  // Add header if provided
  if (header) {
    payload.media.header = [header]
  }

  // Return proxy info for client to call directly
  return NextResponse.json({
    success: true,
    proxy: {
      url: 'https://apis.rmlconnect.net/wba/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: payload
    }
  })
}