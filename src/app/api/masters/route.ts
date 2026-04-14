import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = sql()
    const result = await pool.query(
      `SELECT * FROM masters ORDER BY name ASC`
    );
    // Map is_active to status for frontend compatibility
    const rows = result.rows.map((row: any) => ({
      ...row,
      is_active: row.status === 'active',
      status: row.status || 'active'
    }));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching masters:', error);
    return NextResponse.json({ error: 'Failed to fetch masters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      category, 
      type, 
      phone_number: phoneNumber, 
      specialty, 
      address, 
      karat, 
      is_active: isActive,
      api_token,
      api_url,
      template_name
    } = body;

    // Default to active if not provided
    const status = isActive !== false ? 'active' : 'inactive';

    const pool = sql()
    const result = await pool.query(
      `INSERT INTO masters (name, category, type, specialty, phone_number, address, karat, status, api_token, api_url, template_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [name, category, type, specialty, phoneNumber, address, karat, status, api_token, api_url, template_name]
    );

    const row = result.rows[0];
    return NextResponse.json({ ...row, is_active: row.status === 'active' });
  } catch (error) {
    console.error('Error creating master:', error);
    return NextResponse.json({ error: 'Failed to create master' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      name, 
      category, 
      type, 
      phone_number: phoneNumber, 
      specialty, 
      address, 
      karat, 
      is_active: isActive,
      api_token,
      api_url,
      template_name
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Master ID is required' }, { status: 400 });
    }

    // Map is_active boolean to status string
    const status = isActive !== undefined ? (isActive ? 'active' : 'inactive') : null;

    const pool = sql()
    const result = await pool.query(
      `UPDATE masters SET 
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        specialty = COALESCE($3, specialty),
        phone_number = COALESCE($4, phone_number),
        address = COALESCE($5, address),
        karat = COALESCE($6, karat),
        status = COALESCE($7, status),
        api_token = COALESCE($8, api_token),
        api_url = COALESCE($9, api_url),
        template_name = COALESCE($10, template_name),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [name, category, specialty, phoneNumber, address, karat, status, api_token, api_url, template_name, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Master not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({ ...row, is_active: row.status === 'active' });
  } catch (error) {
    console.error('Error updating master:', error);
    return NextResponse.json({ error: 'Failed to update master' }, { status: 500 });
  }
}
