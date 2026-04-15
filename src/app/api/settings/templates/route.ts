import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tpl1Name, tpl2Name, tpl1Body, tpl2Body, tpl1Lang, tpl2Lang } = body

    const { error } = await supabase
      .from('settings')
      .upsert({ 
        key: 'whatsapp_templates',
        value: { tpl1Name, tpl2Name, tpl1Body, tpl2Body, tpl1Lang, tpl2Lang },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Templates saved successfully' })
  } catch (error) {
    console.error('Error saving templates:', error)
    return NextResponse.json({ error: 'Failed to save templates' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_templates')
      .single()

    if (error) {
      return NextResponse.json({})
    }

    return NextResponse.json(data?.value || {})
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({})
  }
}