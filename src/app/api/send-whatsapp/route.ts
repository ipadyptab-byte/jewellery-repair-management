export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/**
 * Send WhatsApp Template Message via Route Mobile
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp API endpoint. Use POST to send messages.',
    version: '1.0.0'
  })
}

// Helper to get WhatsApp API credentials from database
async function getWhatsAppCredentials() {
  try {
    const pool = sql()
    const result = await pool.query(
      `SELECT api_token, api_url, template_name FROM masters WHERE type = 'whatsapp_api' AND status = 'active' LIMIT 1`
    )
    if (result.rows.length > 0) {
      return result.rows[0]
    }
  } catch (err) {
    console.error('Error fetching WhatsApp credentials:', err)
  }
  return null
}

// Helper to login and get JWT token
async function loginAndGetToken(username: string, password: string, apiUrl: string) {
  try {
    const loginUrl = apiUrl.replace('/wba/v1/messages', '/auth/v1/login/')
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (response.ok) {
      const data = await response.json()
      return data.JWTAUTH
    }
  } catch (err) {
    console.error('Login error:', err)
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      mobile,
      templateName,
      params,
      token: providedToken,
      apiUrl,
      username,
      password
    } = body

    // Get credentials from database if not provided
    const dbCreds = await getWhatsAppCredentials()
    const API_URL = apiUrl || dbCreds?.api_url || 'https://apis.rmlconnect.net/wba/v1/messages'
    
    // Get fresh token via login if credentials provided
    let token = ''
    console.log('📥 Request body:', { mobile, templateName, hasUsername: !!username, hasPassword: !!password })
    
    if (username && password) {
      const authUrl = 'https://apis.rmlconnect.net/auth/v1/login/'
      console.log('🔐 Attempting login to:', authUrl)
      try {
        const loginResp = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        console.log('📥 Login response status:', loginResp.status)
        if (loginResp.ok) {
          const data = await loginResp.json()
          token = data.JWTAUTH || ''
          console.log('🔐 Got token:', !!token, 'prefix:', token.substring(0, 20))
        }
      } catch (err) {
        console.error('❌ Login error:', err)
      }
    } else {
      token = providedToken || dbCreds?.api_token || ''
      console.log('📥 Using stored/provided token:', !!token)
    }

    // 🔒 Basic validation
    console.log('📥 Received body:', { mobile, templateName, params, hasToken: !!token, fromDb: !!dbCreds?.api_token })
    
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

    // Build payload per Route Mobile documentation format
    const payload = {
      phone: toNumber,
      media: {
        type: 'media_template',
        template_name: templateName,
        lang_code: 'en',
        body: params.map(p => ({ text: p }))
      }
    }

    console.log('➡️ Sending WhatsApp:', {
      to: toNumber,
      templateName,
      params,
      apiUrl: API_URL
    })

    // 🚀 Call Route Mobile API with Bearer token
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
      console.error('❌ Fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'fetch failed', details: fetchError.message || String(fetchError), stack: fetchError.stack },
        { status: 500 }
      )
    }

    const rmText = await rmResponse.text()
    
    console.log('⬅️ Route Mobile Response:', { 
      status: rmResponse.status, 
      text: rmText.substring(0, 500) 
    })

    // Check if response is HTML error page (Route Mobile returns 404 HTML)
    let data
    const isHtmlError = rmText.includes('<html>') || rmText.includes('<title>')
    if (isHtmlError) {
      data = { error: 'Route Mobile API error - check token/API URL', htmlMessage: rmText.substring(0, 150) }
    } else {
      try {
        data = JSON.parse(rmText)
      } catch {
        data = { raw: rmText, parseError: true }
      }
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
