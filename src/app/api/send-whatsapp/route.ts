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
      token,
      apiUrl
    } = body

    // 🔧 Allow custom API URL or use default
    const API_URL = apiUrl || 'https://api.routemobile.com/whatsapp/v1'

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
    let rmResponse
    try {
      rmResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
    } catch (fetchError: any) {
      console.error('❌ Fetch error:', fetchError.message)
      return NextResponse.json(
        { success: false, error: 'fetch failed: ' + fetchError.message },
        { status: 500 }
      )
    }

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
      // Return data in response but always use 200 status to avoid routing confusion
      const errorMsg = data?.error?.message || data?.message || data?.description || 'WhatsApp API failed'
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          rmStatus: rmResponse.status,
          full: data
        },
        { status: 200 }  // Use 200 to avoid Next.js routing issues
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
