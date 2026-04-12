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
    const { name, specialty, phoneNumber, email, isActive } = body;

    const pool = sql()
    const result = await pool.query(
      `INSERT INTO masters (name, specialty, phone_number, email, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [name, specialty, phoneNumber, email, isActive]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating master:', error);
    return NextResponse.json({ error: 'Failed to create master' }, { status: 500 });
  }
}
