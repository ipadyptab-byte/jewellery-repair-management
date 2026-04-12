import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = sql();
    const result = await pool.query(
      `SELECT key, value FROM settings`
    );

    // Convert key-value pairs to structured object
    const settings: any = {
      businessName: 'Devi Jewellers',
      whatsappApiKey: '',
      whatsappApiUrl: '',
      currency: 'INR',
      taxRate: 0,
      logoUrl: '',
      contactInfo: { phone: '', email: '', address: '' },
      notifications: { email: false, whatsapp: true, sms: false }
    };

    result.rows.forEach((row: any) => {
      switch (row.key) {
        case 'shop_name':
          settings.businessName = row.value || 'Devi Jewellers';
          break;
        case 'whatsapp_rm_api_key':
          settings.whatsappApiKey = row.value || '';
          break;
        case 'whatsapp_rm_api_url':
          settings.whatsappApiUrl = row.value || '';
          break;
        case 'invoice_link_base':
          settings.invoiceLinkBase = row.value || '';
          break;
        case 'currency':
          settings.currency = row.value || 'INR';
          break;
        case 'tax_rate':
          settings.taxRate = parseFloat(row.value) || 0;
          break;
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      businessName: 'Devi Jewellers',
      whatsappApiKey: '',
      whatsappApiUrl: '',
      currency: 'INR',
      taxRate: 0
    });
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
      notifications,
      invoiceLinkBase
    } = body;

    const pool = sql();

    // Map settings to key-value pairs and upsert
    const settingsMap: Record<string, string> = {
      'shop_name': businessName || 'Devi Jewellers',
      'whatsapp_rm_api_key': whatsappApiKey || '',
      'whatsapp_rm_api_url': whatsappApiUrl || '',
      'invoice_link_base': invoiceLinkBase || '',
      'currency': currency || 'INR',
      'tax_rate': String(taxRate || 0)
    };

    // Upsert each setting
    for (const [key, value] of Object.entries(settingsMap)) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}