import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = sql()
    const result = await pool.query(
      `SELECT * FROM masters ORDER BY name ASC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching masters:', error);
    return NextResponse.json({ error: 'Failed to fetch masters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, type, phone_number: phoneNumber, specialty, address, karat, is_active: isActive } = body;

    const pool = sql()
    const result = await pool.query(
      `INSERT INTO masters (name, category, type, specialty, phone_number, address, karat, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, category, type, specialty, phoneNumber, address, karat, isActive]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating master:', error);
    return NextResponse.json({ error: 'Failed to create master' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, category, type, phone_number: phoneNumber, specialty, address, karat, is_active: isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Master ID is required' }, { status: 400 });
    }

    const pool = sql()
    const result = await pool.query(
      `UPDATE masters SET 
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        specialty = COALESCE($3, specialty),
        phone_number = COALESCE($4, phone_number),
        address = COALESCE($5, address),
        karat = COALESCE($6, karat),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *`,
      [name, category, specialty, phoneNumber, address, karat, isActive, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Master not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating master:', error);
    return NextResponse.json({ error: 'Failed to update master' }, { status: 500 });
  }
}
