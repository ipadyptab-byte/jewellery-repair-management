import pg from 'pg'

let sql: pg.Pool | null = null

// Lazy initialization of database connection
function getSql() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL_repair
    console.log('DATABASE_URL_repair found:', !!databaseUrl);
    if (databaseUrl) {
      console.log('Database URL prefix:', databaseUrl.slice(0, 30) + '...');
    }
    if (!databaseUrl) {
      throw new Error('DATABASE_URL_repair environment variable is not set')
    }
    sql = new pg.Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    })
  }
  return sql
}

export { getSql as sql }

// Database schema types
export interface RepairRecord {
  id?: number
  doc_num: string
  customer_name: string
  phone_number: string
  item_type: string
  description: string
  estimated_cost: number
  status: string
  master_id: number | null
  notes: string
  images: string[]
  created_at?: string
  updated_at?: string
}

export interface Master {
  id?: number
  name: string
  specialty?: string
  phone_number?: string
  email?: string
  is_active: boolean
  type?: string
  karat?: string
  category?: string
  address?: string
}

export interface Settings {
  id?: number
  business_name: string
  whatsapp_api_key?: string
  whatsapp_api_url?: string
  currency: string
  tax_rate: number
  logo_url?: string
  contact_info: any
  notifications: any
  created_at?: string
  updated_at?: string
}
