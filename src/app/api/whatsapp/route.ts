import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('WhatsApp request received:', { ...body, apiKey: body.apiKey ? '[REDACTED]' : undefined });
    
    const { to, templateName, templateId, params, apiKey, apiUrl, wabaId } = body;

    if (!to || !templateName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is missing or not configured. Please add your API key in Settings → Credentials.' }, { status: 401 });
    }

    // Get the base URL from settings or use default (Route Mobile provided URL)
    let baseUrl = apiUrl || 'https://apis.rmlconnect.net/wba/v1/messages';
    baseUrl = baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}`;

    console.log('Sending to URL:', url);

    // Build authentication headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Build request body for Route Mobile API with template_id
    const requestBody: any = {
      to: to.startsWith('91') ? to : `91${to}`,
      type: 'template',
      messaging_product: 'whatsapp',
      template: {
        name: templateName,
        language: {
          code: 'en'
        }
      }
    };

    // Add template_id from Route Mobile if provided
    if (templateId) {
      requestBody.template = {
        ...requestBody.template,
        components: [{
          type: 'body',
          parameters: (params || []).map((param: string) => ({ type: 'text', text: param }))
        }]
      };
      // Add template_id as header component
      requestBody.template.components.unshift({
        type: 'header',
        parameters: [{ type: 'text', text: templateId }]
      });
    } else {
      // Original format without template ID
      requestBody.template.components = [{
        type: 'body',
        parameters: (params || []).map((param: string) => ({ type: 'text', text: param }))
      }];
    }

    console.log('WhatsApp API Request:', { url, headers: { ...headers, Authorization: '[REDACTED]' }, body: requestBody });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('WhatsApp API Response:', response.status, responseText);

    let json;

    try {
      json = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      return NextResponse.json({ error: `API returned invalid JSON: ${responseText}` }, { status: 502 });
    }

    if (!response.ok) {
      console.error('WhatsApp API error:', json);
      return NextResponse.json({ error: json.error?.message || json.error || 'WhatsApp API request failed', details: json }, { status: response.status });
    }

    return NextResponse.json({ success: true, data: json });
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    const message = error instanceof Error ? error.message : 'Failed to send WhatsApp message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}