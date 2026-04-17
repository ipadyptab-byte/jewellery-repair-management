import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = sql();
    const result = await pool.query(
      `SELECT key, value FROM settings`
    );

    // Convert key-value pairs to structured object - use keys from schema
    const settings: any = {
      businessName: 'Devi Jewellers',
      shopOwner: '',
      shopPhone: '',
      shopGst: '',
      shopCity: '',
      shopAddress: '',
      whatsappApiKey: '',
      whatsappApiUrl: '',
      currency: 'INR',
      taxRate: 0,
      invoiceLinkBase: '',
      invoiceExpiry: 10,
      // WhatsApp Route Mobile credentials
      whatsappRmUser: '',
      whatsappRmPass: '',
      whatsappRmWaba: '',
      whatsappRmPhoneid: '',
      whatsappRmWaphone: '',
      whatsappRmToken: '',
      whatsappRmApiUrl: '',
      whatsappRmApiVersion: 'v17.0'
    };

    result.rows.forEach((row: any) => {
      switch (row.key) {
        case 'shop_name':
          settings.businessName = row.value || 'Devi Jewellers';
          break;
        case 'shop_owner':
          settings.shopOwner = row.value || '';
          break;
        case 'shop_phone':
          settings.shopPhone = row.value || '';
          break;
        case 'shop_gst':
          settings.shopGst = row.value || '';
          break;
        case 'shop_city':
          settings.shopCity = row.value || '';
          break;
        case 'shop_address':
          settings.shopAddress = row.value || '';
          break;
        case 'whatsapp_rm_token':
          settings.whatsappApiKey = row.value || '';
          settings.whatsappRmToken = row.value || '';
          break;
        case 'whatsapp_rm_api_url':
          settings.whatsappApiUrl = row.value || '';
          settings.whatsappRmApiUrl = row.value || '';
          break;
        case 'whatsapp_rm_user':
          settings.whatsappRmUser = row.value || '';
          break;
        case 'whatsapp_rm_pass':
          settings.whatsappRmPass = row.value || '';
          break;
        case 'whatsapp_rm_waba':
          settings.whatsappRmWaba = row.value || '';
          break;
        case 'whatsapp_rm_phoneid':
          settings.whatsappRmPhoneid = row.value || '';
          break;
        case 'whatsapp_rm_waphone':
          settings.whatsappRmWaphone = row.value || '';
          break;
        case 'whatsapp_rm_api_version':
          settings.whatsappRmApiVersion = row.value || 'v17.0';
          break;
        case 'invoice_link_base':
          settings.invoiceLinkBase = row.value || '';
          break;
        case 'invoice_expiry_days':
          settings.invoiceExpiry = parseInt(row.value) || 10;
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
      shopOwner: '',
      shopPhone: '',
      shopGst: '',
      shopCity: '',
      shopAddress: '',
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
      shopOwner,
      shopPhone,
      shopGst,
      shopCity,
      shopAddress,
      whatsappApiKey,
      whatsappApiUrl,
      currency,
      taxRate,
      invoiceLinkBase,
      invoiceExpiry,
      // WhatsApp Route Mobile credentials
      whatsappRmUser,
      whatsappRmPass,
      whatsappRmWaba,
      whatsappRmPhoneid,
      whatsappRmWaphone,
      whatsappRmToken,
      whatsappRmApiUrl,
      whatsappRmApiVersion
    } = body;

    const pool = sql();

    // Map to keys from schema.sql
    const settingsMap: Record<string, string> = {
      'shop_name': businessName || 'Devi Jewellers',
      'shop_owner': shopOwner || '',
      'shop_phone': shopPhone || '',
      'shop_gst': shopGst || '',
      'shop_city': shopCity || '',
      'shop_address': shopAddress || '',
      'whatsapp_rm_token': whatsappApiKey || whatsappRmToken || '',
      'whatsapp_rm_api_url': whatsappApiUrl || whatsappRmApiUrl || '',
      'whatsapp_rm_user': whatsappRmUser || '',
      'whatsapp_rm_pass': whatsappRmPass || '',
      'whatsapp_rm_waba': whatsappRmWaba || '',
      'whatsapp_rm_phoneid': whatsappRmPhoneid || '',
      'whatsapp_rm_waphone': whatsappRmWaphone || '',
      'whatsapp_rm_api_version': whatsappRmApiVersion || 'v17.0',
      'invoice_link_base': invoiceLinkBase || '',
      'invoice_expiry_days': invoiceExpiry ? String(invoiceExpiry) : '10',
      'currency': currency || 'INR',
      'tax_rate': String(taxRate || 0)
    };

    // Upsert each setting using keys from schema
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