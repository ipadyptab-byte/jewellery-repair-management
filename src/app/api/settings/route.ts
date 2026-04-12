import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = sql();
    const result = await pool.query(
      `SELECT * FROM settings LIMIT 1`
    );

    if (result.rows.length === 0) {
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

    const row = result.rows[0];
    // Map database field names to frontend expected field names
    return NextResponse.json({
      id: row.id,
      businessName: row.business_name || '',
      whatsappApiKey: row.whatsapp_api_key || '',
      whatsappApiUrl: row.whatsapp_api_url || '',
      currency: row.currency || 'INR',
      taxRate: row.tax_rate || 0,
      logoUrl: row.logo_url || '',
      contactInfo: row.contact_info ? (typeof row.contact_info === 'string' ? JSON.parse(row.contact_info) : row.contact_info) : { phone: '', email: '', address: '' },
      notifications: row.notifications ? (typeof row.notifications === 'string' ? JSON.parse(row.notifications) : row.notifications) : { email: false, whatsapp: true, sms: false }
    });
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

    const pool = sql();
    const existing = await pool.query(`SELECT id FROM settings LIMIT 1`);

    let result;
    if (existing.rows.length > 0) {
      // Update existing record
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (businessName !== undefined) {
        updates.push(`business_name = $${paramIndex++}`);
        values.push(businessName);
      }
      if (whatsappApiKey !== undefined) {
        updates.push(`whatsapp_api_key = $${paramIndex++}`);
        values.push(whatsappApiKey);
      }
      if (whatsappApiUrl !== undefined) {
        updates.push(`whatsapp_api_url = $${paramIndex++}`);
        values.push(whatsappApiUrl);
      }
      if (currency !== undefined) {
        updates.push(`currency = $${paramIndex++}`);
        values.push(currency);
      }
      if (taxRate !== undefined) {
        updates.push(`tax_rate = $${paramIndex++}`);
        values.push(taxRate);
      }
      if (logoUrl !== undefined) {
        updates.push(`logo_url = $${paramIndex++}`);
        values.push(logoUrl);
      }
      if (contactInfo !== undefined) {
        updates.push(`contact_info = $${paramIndex++}`);
        values.push(JSON.stringify(contactInfo));
      }
      if (notifications !== undefined) {
        updates.push(`notifications = $${paramIndex++}`);
        values.push(JSON.stringify(notifications));
      }

      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(existing.rows[0].id);
        
        result = await pool.query(
          `UPDATE settings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          values
        );
      } else {
        result = await pool.query(`SELECT * FROM settings WHERE id = $1`, [existing.rows[0].id]);
      }
    } else {
      // Insert new record with default values for any missing fields
      result = await pool.query(
        `INSERT INTO settings (
          business_name, whatsapp_api_key, whatsapp_api_url,
          currency, tax_rate, logo_url, contact_info, notifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          businessName || 'Devi Jewellers', 
          whatsappApiKey || '', 
          whatsappApiUrl || '', 
          currency || 'INR', 
          taxRate || 0, 
          logoUrl || '', 
          contactInfo ? JSON.stringify(contactInfo) : '{}', 
          notifications ? JSON.stringify(notifications) : '{"email":false,"whatsapp":true,"sms":false}'
        ]
      );
    }

    const row = result.rows[0];
    // Return mapped field names
    return NextResponse.json({
      id: row.id,
      businessName: row.business_name || '',
      whatsappApiKey: row.whatsapp_api_key || '',
      whatsappApiUrl: row.whatsapp_api_url || '',
      currency: row.currency || 'INR',
      taxRate: row.tax_rate || 0,
      logoUrl: row.logo_url || '',
      contactInfo: row.contact_info ? (typeof row.contact_info === 'string' ? JSON.parse(row.contact_info) : row.contact_info) : { phone: '', email: '', address: '' },
      notifications: row.notifications ? (typeof row.notifications === 'string' ? JSON.parse(row.notifications) : row.notifications) : { email: false, whatsapp: true, sms: false }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}