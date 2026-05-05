import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Debug endpoint to check records
export async function OPTIONS() {
  try {
    const pool = sql()
    const result = await pool.query(`SELECT doc_num, status, location, current_location FROM repair_records WHERE doc_num LIKE 'JR-KO%' ORDER BY created_at DESC`);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pool = sql()
    const result = await pool.query(`SELECT * FROM repair_records ORDER BY created_at DESC`);
    
    const recordsWithItems = await Promise.all(
      result.rows.map(async (record: any) => {
        try {
          const itemsResult = await pool.query(`SELECT * FROM repair_items WHERE record_id = $1`, [record.id]);
          return { ...record, repair_items: itemsResult.rows || [] };
        } catch { return { ...record, repair_items: [] }; }
      })
    );
    return NextResponse.json(recordsWithItems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

function addDays(date: string | Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doc_num, customer_name, phone_number, item_type, description, estimated_cost, status, master_id, notes, images, received_date, delivery_date, metal, weight, salesman, location, current_location, transfer_status, repair_items } = body;
    const pool = sql()
    const result = await pool.query(
      `INSERT INTO repair_records (doc_num, name, mobile, metal, jewellery, weight, amount, salesman, description, received_date, delivery_date, status, location, current_location, transfer_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [doc_num, customer_name || '', phone_number || '', metal || '', item_type || '', String(weight || ''), estimated_cost || 0, salesman || '', description || '', received_date || new Date().toISOString(), delivery_date || addDays(new Date().toISOString(), 7), status || 'received', location || 'satara', current_location || 'satara', transfer_status || null]
    );
    const record = result.rows[0];
    if (repair_items && Array.isArray(repair_items) && repair_items.length > 0) {
      for (const item of repair_items) {
        if (item.metal && item.jewellery && item.weight) {
          await pool.query(`INSERT INTO repair_items (record_id, metal, jewellery, weight, description) VALUES ($1, $2, $3, $4, $5)`, [record.id, item.metal, item.jewellery, item.weight, item.description || '']);
        }
      }
    }
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, doc_num, customer_name, phone_number, item_type, description, estimated_cost, status, master_id, notes, images, karagir, karagir_date, final_amount, completed_date, quality, received_date, delivery_date, metal, weight, salesman, location, current_location, transfer_status, received_invoice_expires_at, repair_items } = body;
    if (!id && !doc_num) return NextResponse.json({ error: 'Either id or doc_num is required' }, { status: 400 });
    const pool = sql();
    let result;
    if (id) {
      result = await pool.query(
        `UPDATE repair_records SET doc_num = COALESCE($1, doc_num), name = COALESCE($2, name), mobile = COALESCE($3, mobile), metal = COALESCE($4, metal), jewellery = COALESCE($5, jewellery), weight = COALESCE($6, weight), amount = COALESCE($7, amount), salesman = COALESCE($8, salesman), description = COALESCE($9, description), status = COALESCE($10, status), master_id = COALESCE($11, master_id), notes = COALESCE($12, notes), images = COALESCE($13, images), karagir = COALESCE($14, karagir), karagir_date = COALESCE($15, karagir_date), final_amount = COALESCE($16, final_amount), completed_date = COALESCE($17, completed_date), quality = COALESCE($18, quality), received_date = COALESCE($19, received_date), delivery_date = COALESCE($20, delivery_date), location = COALESCE($21, location), current_location = COALESCE($22, current_location), transfer_status = COALESCE($23, transfer_status), received_invoice_expires_at = COALESCE($24, received_invoice_expires_at) WHERE id = $25 RETURNING *`,
        [doc_num, customer_name, phone_number, metal, item_type, weight, estimated_cost, salesman, description, status, master_id, notes, images, karagir, karagir_date, final_amount, completed_date, quality, received_date, delivery_date, location, current_location, transfer_status, received_invoice_expires_at, id]
      );
    } else {
      result = await pool.query(
        `UPDATE repair_records SET name = COALESCE($1, name), mobile = COALESCE($2, mobile), metal = COALESCE($3, metal), jewellery = COALESCE($4, jewellery), weight = COALESCE($5, weight), amount = COALESCE($6, amount), salesman = COALESCE($7, salesman), description = COALESCE($8, description), status = COALESCE($9, status), karagir = COALESCE($10, karagir), karagir_date = COALESCE($11, karagir_date), final_amount = COALESCE($12, final_amount), completed_date = COALESCE($13, completed_date), quality = COALESCE($14, quality), delivery_date = COALESCE($15, delivery_date) WHERE doc_num = $16 RETURNING *`,
        [customer_name, phone_number, metal, item_type, weight, estimated_cost, salesman, description, status, karagir, karagir_date, final_amount, completed_date, quality, delivery_date, doc_num]
      );
    }
    const updatedRecord = result.rows[0];
    if (repair_items && Array.isArray(repair_items) && id) {
      await pool.query(`DELETE FROM repair_items WHERE record_id = $1`, [id]);
      for (const item of repair_items) {
        if (item.metal && item.jewellery && item.weight) {
          await pool.query(`INSERT INTO repair_items (record_id, metal, jewellery, weight, description) VALUES ($1, $2, $3, $4, $5)`, [id, item.metal, item.jewellery, item.weight, item.description || '']);
        }
      }
    }
    return NextResponse.json(updatedRecord);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { doc_num } = body;
    if (!doc_num) return NextResponse.json({ error: 'Document number is required' }, { status: 400 });
    const pool = sql()
    const result = await pool.query(`DELETE FROM repair_records WHERE doc_num = $1 RETURNING *`, [doc_num]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
