import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const masters = await sql()
      `SELECT * FROM masters
       ORDER BY name ASC`;
    return NextResponse.json(masters);
  } catch (error) {
    console.error('Error fetching masters:', error);
    return NextResponse.json({ error: 'Failed to fetch masters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, specialty, phoneNumber, email, isActive } = body;

    const [master] = await sql()
      `INSERT INTO masters (name, specialty, phone_number, email, is_active)
      VALUES (${name}, ${specialty}, ${phoneNumber}, ${email}, ${isActive})
      RETURNING *`;

    return NextResponse.json(master);
  } catch (error) {
    console.error('Error creating master:', error);
    return NextResponse.json({ error: 'Failed to create master' }, { status: 500 });
  }
}