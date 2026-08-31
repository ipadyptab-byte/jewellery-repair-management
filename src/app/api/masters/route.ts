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
      // Map DB column names to frontend expected names
      mob: row.mobile,
      cat: row.category,
      spec: row.speciality,
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
      phone_number, 
      mobile,
      specialty, 
      speciality,
      address, 
      karat, 
      is_active: isActive
    } = body;

    // Default to active if not provided
    const status = isActive !== false ? 'active' : 'inactive';

    // Map frontend field names to database column names
    const dbMobile = mobile || phone_number || '';
    const dbSpecialty = speciality || specialty || '';

    const pool = sql()
    const result = await pool.query(
      `INSERT INTO masters (name, category, type, speciality, mobile, address, karat, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, category, type, dbSpecialty, dbMobile, address, karat, status]
    );

    const row = result.rows[0];
    return NextResponse.json({ 
      ...row, 
      mob: row.mobile,
      cat: row.category,
      spec: row.speciality,
      is_active: row.status === 'active' 
    });
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
      phone_number,
      mobile,
      specialty, 
      speciality,
      address, 
      karat, 
      is_active: isActive
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Master ID is required' }, { status: 400 });
    }

    // Map frontend field names to database column names
    const dbMobile = mobile || phone_number || '';
    const dbSpecialty = speciality || specialty || '';

    // Map is_active boolean to status string
    const status = isActive !== undefined ? (isActive ? 'active' : 'inactive') : null;

    const pool = sql()
    const result = await pool.query(
      `UPDATE masters SET 
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        speciality = COALESCE($3, speciality),
        mobile = COALESCE($4, mobile),
        address = COALESCE($5, address),
        karat = COALESCE($6, karat),
        status = COALESCE($7, status),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *`,
      [name, category, dbSpecialty, dbMobile, address, karat, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Master not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({ 
      ...row, 
      mob: row.mobile,
      cat: row.category,
      spec: row.speciality,
      is_active: row.status === 'active' 
    });
  } catch (error) {
    console.error('Error updating master:', error);
    return NextResponse.json({ error: 'Failed to update master' }, { status: 500 });
  }
}
