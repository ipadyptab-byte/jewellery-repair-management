import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const records = await sql`
      SELECT * FROM repair_records
      ORDER BY created_at DESC
    `;
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      phoneNumber,
      itemType,
      description,
      estimatedCost,
      status,
      masterId,
      notes,
      images
    } = body;

    const [record] = await sql`
      INSERT INTO repair_records (
        customer_name, phone_number, item_type, description,
        estimated_cost, status, master_id, notes, images
      ) VALUES (
        ${customerName}, ${phoneNumber}, ${itemType}, ${description},
        ${estimatedCost}, ${status}, ${masterId}, ${notes}, ${JSON.stringify(images || [])}
      )
      RETURNING *
    `;

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      customerName,
      phoneNumber,
      itemType,
      description,
      estimatedCost,
      status,
      masterId,
      notes,
      images,
      karagir,
      karagirDate,
      finalAmount,
      completedDate,
      quality,
      receivedDate,
      deliveryDate,
      metal,
      weight,
      salesman
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const [record] = await sql`
      UPDATE repair_records SET
        customer_name = ${customerName},
        phone_number = ${phoneNumber},
        item_type = ${itemType},
        description = ${description},
        estimated_cost = ${estimatedCost},
        status = ${status},
        master_id = ${masterId},
        notes = ${notes},
        images = ${JSON.stringify(images || [])},
        karagir = ${karagir},
        karagir_date = ${karagirDate},
        final_amount = ${finalAmount},
        completed_date = ${completedDate},
        quality = ${quality},
        received_date = ${receivedDate},
        delivery_date = ${deliveryDate},
        metal = ${metal},
        weight = ${weight},
        salesman = ${salesman},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}