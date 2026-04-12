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
    const { name, category, type, mobile, specialty, address, karat, status } = body;

    const pool = sql()
    const result = await pool.query(
      `INSERT INTO masters (name, category, type, mobile, speciality, address, karat, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, category, type, mobile, specialty, address, karat, status || 'active']
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
    const { id, name, category, type, mobile, specialty, address, karat, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Master ID is required' }, { status: 400 });
    }

    const pool = sql()
    const result = await pool.query(
      `UPDATE masters SET 
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        type = COALESCE($3, type),
        mobile = COALESCE($4, mobile),
        speciality = COALESCE($5, speciality),
        address = COALESCE($6, address),
        karat = COALESCE($7, karat),
        status = COALESCE($8, status),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [name, category, type, mobile, specialty, address, karat, status, id]
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
