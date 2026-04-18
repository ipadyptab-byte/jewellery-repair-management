import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('======= GET /api/records called =======');
    const pool = sql()
    console.log('Pool created, querying...');
    const result = await pool.query(
      `SELECT * FROM repair_records ORDER BY created_at DESC`
    );
    console.log('Query result rows:', result.rows.length);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching records:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch records';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function
function addDays(date: string | Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    console.log('======= POST /api/records called =======');
    const body = await request.json();
    console.log('======= Request body:', JSON.stringify(body), '=======');
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

    // Map to schema column names with fallbacks
    const pool = sql()
    const result = await pool.query(
      `INSERT INTO repair_records (
        doc_num, name, mobile, metal, jewellery, weight, amount, salesman, description,
        received_date, delivery_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        doc_num,
        customer_name || '',  // name
        phone_number || '',   // mobile
        metal || '',
        item_type || '',      // jewellery
        String(weight || ''),
        estimated_cost || 0,  // amount
        salesman || '',
        description || '',
        received_date || new Date().toISOString(),
        delivery_date || addDays(new Date().toISOString(), 7),
        status || 'received'
      ]
    );

    const record = result.rows[0];
    console.log('Record created successfully:', record);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    const message = error instanceof Error ? error.message : 'Failed to create record';
    // Return actual error for debugging
    return NextResponse.json({ error: message, details: String(error) }, { status: 500 });
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

    // Allow update by either id or doc_num
    if (!id && !doc_num) {
      return NextResponse.json({ error: 'Either id or doc_num is required' }, { status: 400 });
    }

    const pool = sql();
    let result;

    if (id) {
      // Update by id
      result = await pool.query(
        `UPDATE repair_records SET
          doc_num = COALESCE($1, doc_num),
          name = COALESCE($2, name),
          mobile = COALESCE($3, mobile),
          metal = COALESCE($4, metal),
          jewellery = COALESCE($5, jewellery),
          weight = COALESCE($6, weight),
          amount = COALESCE($7, amount),
          salesman = COALESCE($8, salesman),
          description = COALESCE($9, description),
          received_date = COALESCE($10, received_date),
          delivery_date = COALESCE($11, delivery_date),
          status = COALESCE($12, status),
          karagir = COALESCE($13, karagir),
          karagir_date = COALESCE($14, karagir_date),
          final_amount = COALESCE($15, final_amount),
          completed_date = COALESCE($16, completed_date),
          quality = COALESCE($17, quality),
          updated_at = NOW()
        WHERE id = $18
        RETURNING *`,
        [doc_num, customer_name, phone_number, metal, item_type, weight, estimated_cost, salesman, description, received_date, delivery_date, status, karagir, karagir_date, final_amount, completed_date, quality, id]
      );
    } else {
      // Update by doc_num
      // Build dynamic update based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const fields = [
        ['doc_num', doc_num],
        ['name', customer_name],
        ['mobile', phone_number],
        ['metal', metal],
        ['jewellery', item_type],
        ['weight', weight],
        ['amount', estimated_cost],
        ['salesman', salesman],
        ['description', description],
        ['received_date', received_date],
        ['delivery_date', delivery_date],
        ['status', status],
        ['karagir', karagir],
        ['karagir_date', karagir_date],
        ['final_amount', final_amount],
        ['completed_date', completed_date],
        ['quality', quality]
      ];

      for (const [field, value] of fields) {
        if (value !== undefined && value !== null) {
          updates.push(`${field} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      updates.push('updated_at = NOW()');
      values.push(doc_num);

      const query = `UPDATE repair_records SET ${updates.join(', ')} WHERE doc_num = $${paramIndex} RETURNING *`;
      console.log('Update query:', query, 'values:', values);
      
      result = await pool.query(query, values);
    }

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
