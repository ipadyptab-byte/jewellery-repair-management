import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const settings = await sql`
      SELECT * FROM settings
      LIMIT 1
    `;

    if (settings.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        id: 1,
        businessName: 'Devi Jewellers',
        whatsappApiKey: '',
        whatsappApiUrl: '',
        currency: 'INR',
        taxRate: 0,
        logoUrl: '',
        contactInfo: {
          phone: '',
          email: '',
          address: ''
        },
        notifications: {
          email: false,
          whatsapp: true,
          sms: false
        }
      };
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      whatsappApiKey,
      whatsappApiUrl,
      currency,
      taxRate,
      logoUrl,
      contactInfo,
      notifications
    } = body;

    // Check if settings already exist
    const existing = await sql`SELECT id FROM settings LIMIT 1`;

    let result;
    if (existing.length > 0) {
      // Update existing settings
      [result] = await sql`
        UPDATE settings SET
          business_name = ${businessName},
          whatsapp_api_key = ${whatsappApiKey},
          whatsapp_api_url = ${whatsappApiUrl},
          currency = ${currency},
          tax_rate = ${taxRate},
          logo_url = ${logoUrl},
          contact_info = ${JSON.stringify(contactInfo)},
          notifications = ${JSON.stringify(notifications)}
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    } else {
      // Insert new settings
      [result] = await sql`
        INSERT INTO settings (
          business_name, whatsapp_api_key, whatsapp_api_url,
          currency, tax_rate, logo_url, contact_info, notifications
        ) VALUES (
          ${businessName}, ${whatsappApiKey}, ${whatsappApiUrl},
          ${currency}, ${taxRate}, ${logoUrl},
          ${JSON.stringify(contactInfo)}, ${JSON.stringify(notifications)}
        )
        RETURNING *
      `;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}