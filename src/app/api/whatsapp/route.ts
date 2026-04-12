import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, templateName, params, apiKey, apiUrl, username, password } = body;

    if (!to || !templateName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the base URL from settings or use default
    let baseUrl = apiUrl || 'https://api.routemobile.com/whatsapp/v1';
    baseUrl = baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/messages`;

    // Build authentication headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (username && password) {
      headers['Authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    } else {
      return NextResponse.json({ error: 'API key or username/password required' }, { status: 400 });
    }

    // Build request body for Route Mobile API
    const requestBody = {
      to: to.startsWith('91') ? to : `91${to}`,
      type: 'template',
      messaging_product: 'whatsapp',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: [{
          type: 'body',
          parameters: (params || []).map((param: string) => ({ type: 'text', text: param }))
        }]
      }
    };

    console.log('WhatsApp API Request:', { url, headers: { ...headers, Authorization: '[REDACTED]' }, body: requestBody });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
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