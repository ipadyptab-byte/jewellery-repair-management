import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const records = await sql()
      `SELECT * FROM repair_records
       ORDER BY created_at DESC`;
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/records called');
    const body = await request.json();
    console.log('Request body:', body);
    const {
      doc_num,
      customer_name,
      phone_number,
      item_type,
      description,
      estimated_cost,
      status,
      master_id,
      notes,
      images,
      received_date,
      delivery_date,
      metal,
      weight,
      salesman
    } = body;

    console.log('Inserting record with values:', {
      doc_num, customer_name, phone_number, metal, item_type, weight, estimated_cost, salesman, description, received_date, delivery_date, status
    });

    const [record] = await sql()
      `INSERT INTO repair_records (
        doc_num, name, mobile, metal, jewellery, weight, amount, salesman, description,
        received_date, delivery_date, status, notes, images
      ) VALUES (
        ${doc_num}, ${customer_name}, ${phone_number}, ${metal}, ${item_type}, ${weight},
        ${estimated_cost}, ${salesman}, ${description}, ${received_date}, ${delivery_date},
        ${status}, ${notes}, ${JSON.stringify(images || [])}
      )
      RETURNING *`;

    console.log('Record created successfully:', record);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      doc_num,
      customer_name,
      phone_number,
      item_type,
      description,
      estimated_cost,
      status,
      master_id,
      notes,
      images,
      karagir,
      karagir_date,
      final_amount,
      completed_date,
      quality,
      received_date,
      delivery_date,
      metal,
      weight,
      salesman
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const [record] = await sql()
      `UPDATE repair_records SET
        doc_num = ${doc_num},
        name = ${customer_name},
        mobile = ${phone_number},
        metal = ${metal},
        jewellery = ${item_type},
        weight = ${weight},
        amount = ${estimated_cost},
        salesman = ${salesman},
        description = ${description},
        received_date = ${received_date},
        delivery_date = ${delivery_date},
        status = ${status},
        karagir = ${karagir},
        karagir_date = ${karagir_date},
        final_amount = ${final_amount},
        completed_date = ${completed_date},
        quality = ${quality},
        notes = ${notes},
        images = ${JSON.stringify(images || [])},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *`;

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}