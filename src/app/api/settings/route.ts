import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('======= GET /api/settings called =======');
    const pool = sql();
    console.log('Pool created, querying settings...');
    const result = await pool.query(
      `SELECT key, value FROM settings`
    );
    console.log('Settings query result rows:', result.rows.length);
    console.log('Settings rows:', JSON.stringify(result.rows));

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
        case 'location':
          settings.location = row.value || 'satara';
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
      location,
      // WhatsApp Route Mobile credentials
      whatsappRmUser,
      whatsappRmPass,
      whatsappRmWaba,
      whatsappRmPhoneid,
      whatsappRmWaphone,
      whatsappRmToken,
      whatsappRmApiUrl,
      whatsappRmApiVersion,
      // Templates
      tpl1Name, tpl2Name, tpl3Name,
      tpl1Body, tpl2Body, tpl3Body,
      tpl1Lang, tpl2Lang, tpl3Lang,
      // Doc sequence
      docSeq
    } = body;

    const pool = sql();

    // Only save fields that are provided (not undefined)
    // This prevents overwriting existing values with empty strings
    const settingsMap: Record<string, string> = {};
    
    if (businessName !== undefined) settingsMap['shop_name'] = businessName || '';
    if (shopOwner !== undefined) settingsMap['shop_owner'] = shopOwner || '';
    if (shopPhone !== undefined) settingsMap['shop_phone'] = shopPhone || '';
    if (shopGst !== undefined) settingsMap['shop_gst'] = shopGst || '';
    if (shopCity !== undefined) settingsMap['shop_city'] = shopCity || '';
    if (shopAddress !== undefined) settingsMap['shop_address'] = shopAddress || '';
    if (whatsappApiKey !== undefined) settingsMap['whatsapp_rm_token'] = whatsappApiKey || '';
    if (whatsappRmToken !== undefined) settingsMap['whatsapp_rm_token'] = whatsappRmToken || '';
    if (whatsappApiUrl !== undefined) settingsMap['whatsapp_rm_api_url'] = whatsappApiUrl || '';
    if (whatsappRmApiUrl !== undefined) settingsMap['whatsapp_rm_api_url'] = whatsappRmApiUrl || '';
    if (whatsappRmUser !== undefined) settingsMap['whatsapp_rm_user'] = whatsappRmUser || '';
    if (whatsappRmPass !== undefined) settingsMap['whatsapp_rm_pass'] = whatsappRmPass || '';
    if (whatsappRmWaba !== undefined) settingsMap['whatsapp_rm_waba'] = whatsappRmWaba || '';
    if (whatsappRmPhoneid !== undefined) settingsMap['whatsapp_rm_phoneid'] = whatsappRmPhoneid || '';
    if (whatsappRmWaphone !== undefined) settingsMap['whatsapp_rm_waphone'] = whatsappRmWaphone || '';
    if (whatsappRmApiVersion !== undefined) settingsMap['whatsapp_rm_api_version'] = whatsappRmApiVersion || 'v17.0';
    if (invoiceLinkBase !== undefined) settingsMap['invoice_link_base'] = invoiceLinkBase || '';
    if (invoiceExpiry !== undefined) settingsMap['invoice_expiry_days'] = String(invoiceExpiry);
    if (location !== undefined) settingsMap['location'] = location || 'satara';
    if (currency !== undefined) settingsMap['currency'] = currency || 'INR';
    if (taxRate !== undefined) settingsMap['tax_rate'] = String(taxRate);
    // Templates
    if (tpl1Name !== undefined) settingsMap['tpl1_name'] = tpl1Name || '';
    if (tpl2Name !== undefined) settingsMap['tpl2_name'] = tpl2Name || '';
    if (tpl3Name !== undefined) settingsMap['tpl3_name'] = tpl3Name || '';
    if (tpl1Body !== undefined) settingsMap['tpl1_body'] = tpl1Body || '';
    if (tpl2Body !== undefined) settingsMap['tpl2_body'] = tpl2Body || '';
    if (tpl3Body !== undefined) settingsMap['tpl3_body'] = tpl3Body || '';
    if (tpl1Lang !== undefined) settingsMap['tpl1_lang'] = tpl1Lang || 'en';
    if (tpl2Lang !== undefined) settingsMap['tpl2_lang'] = tpl2Lang || 'en';
    if (tpl3Lang !== undefined) settingsMap['tpl3_lang'] = tpl3Lang || 'en';
    // Doc sequence
    if (docSeq !== undefined) settingsMap['doc_seq'] = String(docSeq);

    // Upsert only provided settings
    for (const [key, value] of Object.entries(settingsMap)) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }

    return NextResponse.json({ success: true, message: 'Settings saved', keys: Object.keys(settingsMap) });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}