import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    await sql.query(`SELECT 1`);

    const requiredTables = ['repair_records', 'masters', 'settings'];
    const existingTablesResult = await sql.query(
      `SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1)
      ORDER BY tablename`,
      [requiredTables]
    );

    const existingNames = existingTablesResult.rows.map((row: any) => row.tablename);
    const missingTables = requiredTables.filter((table) => !existingNames.includes(table));

    if (missingTables.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connected, but required tables are missing.',
          missingTables,
          existingTables: existingNames,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection healthy.',
      tables: existingNames,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connectivity failed.',
        error: message,
      },
      { status: 500 }
    );
  }
}
