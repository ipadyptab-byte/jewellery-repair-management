/**
 * Send WhatsApp message directly from browser
 * 
 * Due to Vercel network issues, call Route Mobile directly from client
 */

export async function sendWhatsAppMessage(config: {
  mobile: string
  templateName: string
  params?: string[]
  header?: object
  token: string
}) {
  const { mobile, templateName, params, header, token } = config

  const payload: any = {
    phone: mobile,
    media: {
      type: 'media_template',
      template_name: templateName,
      lang_code: 'en',
      body: params?.slice(0, 4).map(p => ({ text: p })) || []
    }
  }

  if (header) {
    payload.media.header = [header]
  }

  // Call Route Mobile directly from browser!
  const response = await fetch('https://apis.rmlconnect.net/wba/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  
  return {
    success: response.ok,
    data,
    status: response.status
  }
}

/**
 * Alternative: Use proxy endpoint to get config, then call directly
 */
export async function sendWhatsAppViaProxy(config: {
  mobile: string
  templateName: string
  params?: string[]
  header?: object
  token: string
}) {
  // First get proxy config
  const proxyRes = await fetch('/api/send-whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  
  const proxyData = await proxyRes.json()
  
  if (!proxyData.success || !proxyData.proxy) {
    return { success: false, error: proxyData.error }
  }

  // Then call Route Mobile directly
  const { url, headers, body } = proxyData.proxy
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  const data = await response.json()
  return { success: response.ok, data }
}