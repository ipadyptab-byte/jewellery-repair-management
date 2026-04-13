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
      whatsappRmUser: '',
      whatsappRmPass: '',
      whatsappRmWaba: '',
      whatsappRmPhoneid: '',
      whatsappRmWaphone: '',
      whatsappRmApiVer: 'v17.0',
      invoiceLinkBase: '',
      invoiceExpiryDays: 10,
      template1Name: '',
      template2Name: '',
      triggerReceive: true,
      triggerReady: true,
      triggerKaragir: false,
      currency: 'INR',
      taxRate: 0
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
          break;
        case 'whatsapp_rm_api_url':
          settings.whatsappApiUrl = row.value || '';
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
          settings.whatsappRmApiVer = row.value || 'v17.0';
          break;
        case 'invoice_link_base':
          settings.invoiceLinkBase = row.value || '';
          break;
        case 'invoice_expiry_days':
          settings.invoiceExpiryDays = parseInt(row.value) || 10;
          break;
        case 'template_1_name':
          settings.template1Name = row.value || '';
          break;
        case 'template_2_name':
          settings.template2Name = row.value || '';
          break;
        case 'trigger_receive':
          settings.triggerReceive = row.value === 'true';
          break;
        case 'trigger_ready':
          settings.triggerReady = row.value === 'true';
          break;
        case 'trigger_karagir':
          settings.triggerKaragir = row.value === 'true';
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
      whatsappRmUser: '',
      whatsappRmPass: '',
      whatsappRmWaba: '',
      whatsappRmPhoneid: '',
      whatsappRmWaphone: '',
      whatsappRmApiVer: 'v17.0',
      invoiceLinkBase: '',
      invoiceExpiryDays: 10,
      template1Name: '',
      template2Name: '',
      triggerReceive: true,
      triggerReady: true,
      triggerKaragir: false,
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
      whatsappRmUser,
      whatsappRmPass,
      whatsappRmWaba,
      whatsappRmPhoneid,
      whatsappRmWaphone,
      whatsappRmApiVer,
      invoiceLinkBase,
      invoiceExpiryDays,
      template1Name,
      template2Name,
      triggerReceive,
      triggerReady,
      triggerKaragir,
      currency,
      taxRate
    } = body;

    console.log('=== API SAVING ===', body);

    const pool = sql();

    // Save ALL values - always include all fields
    const settingsMap: Record<string, string> = {
      'shop_name': businessName || '',
      'shop_owner': shopOwner || '',
      'shop_phone': shopPhone || '',
      'shop_gst': shopGst || '',
      'shop_city': shopCity || '',
      'shop_address': shopAddress || '',
      'whatsapp_rm_user': whatsappRmUser || '',
      'whatsapp_rm_pass': whatsappRmPass || '',
      'whatsapp_rm_waba': whatsappRmWaba || '',
      'whatsapp_rm_phoneid': whatsappRmPhoneid || '',
      'whatsapp_rm_waphone': whatsappRmWaphone || '',
      'whatsapp_rm_token': whatsappApiKey || '',
      'whatsapp_rm_api_url': whatsappApiUrl || 'https://api.routemobile.com/whatsapp/v1',
      'whatsapp_rm_api_version': whatsappRmApiVer || 'v17.0',
      'invoice_link_base': invoiceLinkBase || '',
      'invoice_expiry_days': String(invoiceExpiryDays || 10),
      'template_1_name': template1Name || '',
      'template_2_name': template2Name || '',
      'trigger_receive': String(triggerReceive !== undefined ? triggerReceive : true),
      'trigger_ready': String(triggerReady !== undefined ? triggerReady : true),
      'trigger_karagir': String(triggerKaragir !== undefined ? triggerKaragir : false),
      'currency': currency || 'INR',
      'tax_rate': String(taxRate !== undefined ? taxRate : 0)
    };

    console.log('=== SAVING TO DB ===', settingsMap);

    // Upsert each setting using keys from schema
    for (const [key, value] of Object.entries(settingsMap)) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }
    
    console.log('=== SAVED SUCCESS ===');
    return NextResponse.json({ success: true, message: 'Settings saved to database', savedCount: Object.keys(settingsMap).length });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}