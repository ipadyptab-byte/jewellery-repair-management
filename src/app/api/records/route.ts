import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const pool = sql()
    const result = await pool.query(
      `SELECT * FROM repair_records ORDER BY created_at DESC`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching records:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch records';
    return NextResponse.json({ error: message }, { status: 500 });
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

    const pool = sql()
    
    // Map frontend field names to database column names
    // customer_name → name, phone_number → mobile, item_type → jewellery, estimated_cost → amount
    const result = await pool.query(
      `INSERT INTO repair_records (
        doc_num, name, mobile, metal, jewellery, weight, amount, salesman, description,
        received_date, delivery_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        doc_num || 'JR' || Math.floor(Math.random() * 10000), 
        customer_name || 'Customer', 
        phone_number || '0000000000', 
        metal || 'Gold', 
        item_type || 'Ring', 
        weight || '0', 
        Number(estimated_cost) || 100, 
        salesman || 'Admin', 
        description || 'Repair', 
        received_date || new Date().toISOString(), 
        delivery_date || new Date(Date.now() + 7*24*60*60*1000).toISOString(), 
        status || 'received'
      ]
    );

    const record = result.rows[0];
    console.log('Record created successfully:', record);
    return NextResponse.json(record);
  } catch (error: unknown) {
    console.error('=== Error creating record ===');
    console.error('Error details:', error);
    
    let detailedMessage = 'Failed to create record';
    
    if (error instanceof Error) {
      if (error.message.includes('DATABASE_URL')) {
        detailedMessage = 'Database connection not configured';
      } else if (error.message.includes('null value')) {
        detailedMessage = 'A required field is missing: ' + error.message;
      } else {
        detailedMessage = 'Error: ' + error.message;
      }
    }
    
    return NextResponse.json({ error: detailedMessage, details: String(error) }, { status: 500 });
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

    const pool = sql()
    const result = await pool.query(
      `UPDATE repair_records SET
        doc_num = $1,
        name = $2,
        mobile = $3,
        metal = $4,
        jewellery = $5,
        weight = $6,
        amount = $7,
        salesman = $8,
        description = $9,
        received_date = $10,
        delivery_date = $11,
        status = $12,
        karagir = $13,
        karagir_date = $14,
        final_amount = $15,
        completed_date = $16,
        quality = $17,
        updated_at = NOW()
      WHERE id = $18
      RETURNING *`,
      [doc_num, customer_name, phone_number, metal, item_type, weight, estimated_cost, salesman, description, received_date, delivery_date, status, karagir, karagir_date, final_amount, completed_date, quality, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating record:', error);
    const message = error instanceof Error ? error.message : 'Failed to update record';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { doc_num } = body;

    if (!doc_num) {
      return NextResponse.json({ error: 'Document number is required' }, { status: 400 });
    }

    const pool = sql()
    const result = await pool.query(
      `DELETE FROM repair_records WHERE doc_num = $1 RETURNING *`,
      [doc_num]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
