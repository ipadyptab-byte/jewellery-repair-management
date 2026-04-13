import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, templateName, templateId, params, apiKey, apiUrl } = body;

    // Get settings from database
    const pool = sql();
    const settingsResult = await pool.query(`SELECT key, value FROM settings`);
    const settings: any = {};
    settingsResult.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    // Use provided API key/url or get from settings
    const rmToken = apiKey || settings.whatsapp_api_key;
    const rmApiUrl = apiUrl || settings.whatsapp_api_url || 'https://api.rmlconnect.net';
    const rmUser = settings.whatsapp_rm_user || '';
    const rmPass = settings.whatsapp_rm_pass || '';
    const rmWaba = settings.whatsapp_rm_waba || '';
    const rmPhoneid = settings.whatsapp_rm_phoneid || '';
    const rmApiver = settings.whatsapp_rm_api_ver || 'v17.0';

    if (!rmToken) {
      return NextResponse.json({ error: 'WhatsApp API key not configured' }, { status: 400 });
    }

    // Build the WhatsApp API request
    const waApiEndpoint = `${rmApiUrl}/whatsapp/${rmApiver}/${rmPhoneid}/messages`;
    
    // Prepare template components
    const components: any = [];
    if (params && params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map((p: string, i: number) => ({
          type: 'text',
          parameter: p
        }))
      });
    }

    const waPayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: templateName || 'test_template',
        language: { code: 'en_US' },
        ...(components.length > 0 && { components })
      }
    };

    // Make the API call
    const response = await fetch(waApiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rmToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(waPayload)
    });

    const responseData = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, data: responseData });
    } else {
      return NextResponse.json({ 
        error: responseData.error?.message || 'WhatsApp API error',
        details: responseData
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'WhatsApp API endpoint' });
}