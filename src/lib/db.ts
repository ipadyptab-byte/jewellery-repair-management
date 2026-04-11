import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export { sql }

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