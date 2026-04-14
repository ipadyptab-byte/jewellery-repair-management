export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Send WhatsApp Template Message via Route Mobile
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp API endpoint. Use POST to send messages.',
    version: '1.0.0'
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      mobile,
      templateName,
      params,
      token
    } = body

    // 🔒 Basic validation
    console.log('📥 Received body:', { mobile, templateName, params, hasToken: !!token })
    
    if (!mobile) {
      return NextResponse.json(
        { error: 'Missing required field: mobile', received: { mobile } },
        { status: 400 }
      )
    }
    if (!templateName) {
      return NextResponse.json(
        { error: 'Missing required field: templateName', received: { templateName } },
        { status: 400 }
      )
    }
    if (!params || !Array.isArray(params)) {
      return NextResponse.json(
        { error: 'Missing required field: params (must be array)', received: { params, isArray: Array.isArray(params) } },
        { status: 400 }
      )
    }
    if (!token) {
      return NextResponse.json(
        { error: 'WhatsApp API token missing - check rmToken in Settings', received: { hasToken: !!token } },
        { status: 400 }
      )
    }

    // 📱 Format number
    let toNumber = mobile.toString().replace(/^\+/, '')
    if (!toNumber.startsWith('91')) {
      toNumber = `91${toNumber}`
    }

    // 🌐 Route Mobile API URL
    const API_URL = 'https://api.rmlconnect.net/wba/v1/messages'

    // 📦 Build request payload
    const payload = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: params.map((p: string) => ({
              type: 'text',
              text: p
            }))
          }
        ]
      }
    }

    console.log('➡️ Sending WhatsApp:', {
      to: toNumber,
      templateName,
      params
    })

    // 🚀 Call Route Mobile API
    const rmResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const rmText = await rmResponse.text()
    
    console.log('⬅️ Route Mobile Response:', { 
      status: rmResponse.status, 
      text: rmText.substring(0, 500) 
    })

    let data
    try {
      data = JSON.parse(rmText)
    } catch {
      data = { raw: rmText }
    }

    console.log('⬅️ Route Mobile Raw Response:', {
      status: rmResponse.status,
      data
    })

    // ❌ Handle API error
    if (!rmResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.message ||
            data?.message ||
            data?.description ||
            'WhatsApp API failed',
          full: data
        },
        { status: rmResponse.status }
      )
    }

    // ✅ Success
    return NextResponse.json({
      success: true,
      data
    })

  } catch (error: any) {
    console.error('❌ Server Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
