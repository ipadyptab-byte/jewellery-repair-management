import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tpl1Name, tpl2Name, tpl1Body, tpl2Body, tpl1Lang, tpl2Lang } = body

    const pool = sql()
    
    const value = JSON.stringify({ tpl1Name, tpl2Name, tpl1Body, tpl2Body, tpl1Lang, tpl2Lang })
    
    await pool.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('whatsapp_templates', $1, NOW()) 
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [value]
    )

    return NextResponse.json({ success: true, message: 'Templates saved successfully' })
  } catch (error) {
    console.error('Error saving templates:', error)
    return NextResponse.json({ error: 'Failed to save templates' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const pool = sql()
    const result = await pool.query(
      `SELECT value FROM settings WHERE key = 'whatsapp_templates'`
    )

    if (result.rows.length === 0) {
      return NextResponse.json({})
    }

    const value = result.rows[0].value
    return NextResponse.json(typeof value === 'string' ? JSON.parse(value) : value)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({})
  }
}