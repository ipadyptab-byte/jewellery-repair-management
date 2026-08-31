import pg from 'pg'

let pool: pg.Pool | null = null

// In-memory mock database store for seamless offline/preview execution
interface MockState {
  records: any[]
  items: any[]
  masters: any[]
  settings: Map<string, string>
}

const mockState: MockState = {
  records: [
    {
      id: 1,
      doc_num: 'JR1001',
      name: 'Ramesh Patil',
      mobile: '9876543210',
      metal: 'Gold 22K',
      jewellery: 'Gold Necklace',
      weight: '18.50g',
      amount: 1200,
      salesman: 'Suresh',
      description: 'Hook replacement and cleaning',
      received_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      delivery_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: 'karagir',
      karagir: 'Ganesh Soni',
      karagir_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      final_amount: 1200,
      completed_date: null,
      quality: '22K',
      received_invoice_expires_at: null,
      location: 'satara',
      current_location: 'satara',
      transfer_status: null,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 2,
      doc_num: 'JR1002',
      name: 'Sunita Deshmukh',
      mobile: '9822012345',
      metal: 'Gold 18K',
      jewellery: 'Gold Ring',
      weight: '4.20g',
      amount: 800,
      salesman: 'Pooja',
      description: 'Stone fixing (1 diamond)',
      received_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      delivery_date: new Date(Date.now() + 1 * 86400000).toISOString(),
      status: 'ready',
      karagir: 'Ganesh Soni',
      karagir_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      final_amount: 800,
      completed_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      quality: '18K',
      received_invoice_expires_at: null,
      location: 'satara',
      current_location: 'satara',
      transfer_status: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 3,
      doc_num: 'JR1003',
      name: 'Anil Kulkarni',
      mobile: '9422039371',
      metal: 'Silver 925',
      jewellery: 'Silver Anklet',
      weight: '45.00g',
      amount: 450,
      salesman: 'Amit',
      description: 'Polishing and lock repair',
      received_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      delivery_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: 'received',
      karagir: null,
      karagir_date: null,
      final_amount: null,
      completed_date: null,
      quality: '925',
      received_invoice_expires_at: null,
      location: 'satara',
      current_location: 'satara',
      transfer_status: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  items: [],
  masters: [
    { id: 1, type: 'salesman', name: 'Suresh', mobile: '9876500001', status: 'active', category: '', speciality: '', address: '', karat: '' },
    { id: 2, type: 'salesman', name: 'Pooja', mobile: '9876500002', status: 'active', category: '', speciality: '', address: '', karat: '' },
    { id: 3, type: 'salesman', name: 'Amit', mobile: '9876500003', status: 'active', category: '', speciality: '', address: '', karat: '' },
    { id: 4, type: 'jewellery', name: 'Gold Ring', category: 'Ring', status: 'active', mobile: '', speciality: '', address: '', karat: '' },
    { id: 5, type: 'jewellery', name: 'Gold Necklace', category: 'Necklace', status: 'active', mobile: '', speciality: '', address: '', karat: '' },
    { id: 6, type: 'jewellery', name: 'Gold Bracelet', category: 'Bracelet', status: 'active', mobile: '', speciality: '', address: '', karat: '' },
    { id: 7, type: 'jewellery', name: 'Silver Anklet', category: 'Anklet', status: 'active', mobile: '', speciality: '', address: '', karat: '' },
    { id: 8, type: 'jewellery', name: 'Silver Chain', category: 'Chain', status: 'active', mobile: '', speciality: '', address: '', karat: '' },
    { id: 9, type: 'jewellery', name: 'Mangalsutra', category: 'Necklace', status: 'active', mobile: '', speciality: '', address: '', karat: '' },
    { id: 10, type: 'metal', name: 'Gold 22K', karat: '22K', status: 'active', category: '', mobile: '', speciality: '', address: '' },
    { id: 11, type: 'metal', name: 'Gold 18K', karat: '18K', status: 'active', category: '', mobile: '', speciality: '', address: '' },
    { id: 12, type: 'metal', name: 'Silver 925', karat: '925', status: 'active', category: '', mobile: '', speciality: '', address: '' },
    { id: 13, type: 'karagir', name: 'Ganesh Soni', mobile: '9765400001', speciality: 'Gold repair', address: 'Budhwar Peth', status: 'active', category: '', karat: '' },
    { id: 14, type: 'karagir', name: 'Manoj Karekar', mobile: '9765400002', speciality: 'Silver polishing', address: 'Laxmi Road', status: 'active', category: '', karat: '' },
    { id: 15, type: 'whatsapp_api', name: 'Route Mobile', api_url: 'https://apis.rmlconnect.net/wba/v1/messages', status: 'active', mobile: '', category: '', speciality: '', address: '', karat: '' }
  ],
  settings: new Map([
    ['shop_name', 'Devi Jewellers'],
    ['shop_owner', 'Devi Jewellers'],
    ['shop_phone', '+91 98765 43210'],
    ['shop_gst', '27AAAAA0000A1Z5'],
    ['shop_city', 'Satara'],
    ['shop_address', 'Rajwada Chowk, Satara - 415002'],
    ['doc_sequence', '1005'],
    ['doc_seq', '1005'],
    ['koregaon_seq', '0'],
    ['whatsapp_rm_user', ''],
    ['whatsapp_rm_pass', ''],
    ['whatsapp_rm_waba', ''],
    ['whatsapp_rm_phoneid', ''],
    ['whatsapp_rm_waphone', ''],
    ['whatsapp_rm_token', ''],
    ['whatsapp_rm_api_url', 'https://apis.rmlconnect.net/wba/v1/messages'],
    ['whatsapp_rm_api_version', 'v17.0'],
    ['invoice_link_base', 'https://invoice.devijewellers.in'],
    ['invoice_expiry_days', '10'],
    ['template_1_name', 'jewellery_received_invoice'],
    ['template_2_name', 'jewellery_ready_invoice'],
    ['trigger_receive', 'true'],
    ['trigger_ready', 'true'],
    ['trigger_karagir', 'false'],
    ['location', 'satara'],
    ['locations_list', JSON.stringify([
      { id: 'satara', name: 'Satara (Main - Karagir Center)', prefix: 'JR', next_seq: 0 },
      { id: 'koregaon', name: 'Koregaon (Branch)', prefix: 'JR-KO', next_seq: 0 }
    ])],
    ['currency', 'INR'],
    ['tax_rate', '0'],
    ['tpl1_name', 'jewellery_received_invoice'],
    ['tpl2_name', 'jewellery_ready_invoice'],
    ['tpl3_name', 'delivery_otp_dj_3']
  ])
}

let nextRecordId = 4
let nextItemId = 1
let nextMasterId = 16

async function runMockQuery(queryText: string, params: any[] = []): Promise<{ rows: any[] }> {
  const normalized = queryText.trim()
  const lower = normalized.toLowerCase()

  if (lower.startsWith('select 1')) {
    return { rows: [{ '?column?': 1 }] }
  }

  if (lower.includes('pg_catalog.pg_tables')) {
    return {
      rows: [
        { tablename: 'repair_records' },
        { tablename: 'masters' },
        { tablename: 'settings' },
        { tablename: 'repair_items' }
      ]
    }
  }

  // Settings queries
  if (lower.includes('from settings')) {
    if (lower.includes('where key = $1')) {
      const key = params[0]
      const value = mockState.settings.get(key)
      return { rows: value !== undefined ? [{ key, value }] : [] }
    }
    const keyMatch = normalized.match(/where\s+key\s*=\s*'([^']+)'/i)
    if (keyMatch) {
      const key = keyMatch[1]
      const value = mockState.settings.get(key)
      return { rows: value !== undefined ? [{ key, value }] : [] }
    }
    const rows = Array.from(mockState.settings.entries()).map(([key, value]) => ({ key, value }))
    return { rows }
  }

  if (lower.startsWith('insert into settings')) {
    const key = params[0]
    const value = String(params[1] ?? '')
    mockState.settings.set(key, value)
    return { rows: [{ key, value }] }
  }

  // Repair items queries
  if (lower.includes('from repair_items')) {
    if (lower.includes('where record_id = $1')) {
      const recordId = params[0]
      const rows = mockState.items.filter(item => item.record_id === recordId)
      return { rows }
    }
    return { rows: [...mockState.items] }
  }

  if (lower.startsWith('insert into repair_items')) {
    const [record_id, metal, jewellery, weight, description] = params
    const item = {
      id: nextItemId++,
      record_id,
      metal,
      jewellery,
      weight,
      description: description || '',
      created_at: new Date().toISOString()
    }
    mockState.items.push(item)
    return { rows: [item] }
  }

  if (lower.startsWith('delete from repair_items')) {
    const recordId = params[0]
    mockState.items = mockState.items.filter(item => item.record_id !== recordId)
    return { rows: [] }
  }

  // Masters queries
  if (lower.includes('from masters')) {
    return { rows: [...mockState.masters].sort((a, b) => (a.name || '').localeCompare(b.name || '')) }
  }

  if (lower.startsWith('insert into masters')) {
    const [name, category, type, speciality, mobile, address, karat, status] = params
    const master = {
      id: nextMasterId++,
      name: name || '',
      category: category || '',
      type: type || '',
      speciality: speciality || '',
      mobile: mobile || '',
      address: address || '',
      karat: karat || '',
      status: status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockState.masters.push(master)
    return { rows: [master] }
  }

  if (lower.startsWith('update masters set')) {
    const id = params[params.length - 1]
    const idx = mockState.masters.findIndex(m => m.id === Number(id))
    if (idx >= 0) {
      const existing = mockState.masters[idx]
      const [name, category, speciality, mobile, address, karat, status] = params
      const updated = {
        ...existing,
        name: name !== undefined && name !== null ? name : existing.name,
        category: category !== undefined && category !== null ? category : existing.category,
        speciality: speciality !== undefined && speciality !== null ? speciality : existing.speciality,
        mobile: mobile !== undefined && mobile !== null ? mobile : existing.mobile,
        address: address !== undefined && address !== null ? address : existing.address,
        karat: karat !== undefined && karat !== null ? karat : existing.karat,
        status: status !== undefined && status !== null ? status : existing.status,
        updated_at: new Date().toISOString()
      }
      mockState.masters[idx] = updated
      return { rows: [updated] }
    }
    return { rows: [] }
  }

  // Repair records queries
  if (lower.includes('from repair_records')) {
    if (lower.includes('where doc_num = $1')) {
      const docNum = params[0]
      const found = mockState.records.filter(r => r.doc_num === docNum)
      return { rows: found }
    }
    return {
      rows: [...mockState.records].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    }
  }

  if (lower.startsWith('insert into repair_records')) {
    const [
      doc_num,
      name,
      mobile,
      metal,
      jewellery,
      weight,
      amount,
      salesman,
      description,
      received_date,
      delivery_date,
      status,
      location,
      current_location,
      transfer_status
    ] = params

    const newRecord = {
      id: nextRecordId++,
      doc_num,
      name: name || '',
      mobile: mobile || '',
      metal: metal || '',
      jewellery: jewellery || '',
      weight: String(weight || ''),
      amount: Number(amount) || 0,
      salesman: salesman || '',
      description: description || '',
      received_date: received_date || new Date().toISOString(),
      delivery_date: delivery_date || new Date().toISOString(),
      status: status || 'received',
      karagir: null,
      karagir_date: null,
      final_amount: null,
      completed_date: null,
      quality: '',
      received_invoice_expires_at: null,
      location: location || 'satara',
      current_location: current_location || 'satara',
      transfer_status: transfer_status || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockState.records.push(newRecord)
    return { rows: [newRecord] }
  }

  if (lower.startsWith('update repair_records set')) {
    if (lower.includes('where id = $')) {
      const id = params[params.length - 1]
      const idx = mockState.records.findIndex(r => r.id === Number(id))
      if (idx >= 0) {
        const [
          doc_num,
          customer_name,
          phone_number,
          metal,
          item_type,
          weight,
          estimated_cost,
          salesman,
          description,
          received_date,
          delivery_date,
          status,
          karagir,
          karagir_date,
          final_amount,
          completed_date,
          quality,
          location,
          current_location,
          transfer_status
        ] = params

        const prev = mockState.records[idx]
        const updated = {
          ...prev,
          doc_num: doc_num ?? prev.doc_num,
          name: customer_name ?? prev.name,
          mobile: phone_number ?? prev.mobile,
          metal: metal ?? prev.metal,
          jewellery: item_type ?? prev.jewellery,
          weight: weight ?? prev.weight,
          amount: estimated_cost ?? prev.amount,
          salesman: salesman ?? prev.salesman,
          description: description ?? prev.description,
          received_date: received_date ?? prev.received_date,
          delivery_date: delivery_date ?? prev.delivery_date,
          status: status ?? prev.status,
          karagir: karagir ?? prev.karagir,
          karagir_date: karagir_date ?? prev.karagir_date,
          final_amount: final_amount ?? prev.final_amount,
          completed_date: completed_date ?? prev.completed_date,
          quality: quality ?? prev.quality,
          location: location ?? prev.location,
          current_location: current_location ?? prev.current_location,
          transfer_status: transfer_status ?? prev.transfer_status,
          updated_at: new Date().toISOString()
        }
        mockState.records[idx] = updated
        return { rows: [updated] }
      }
      return { rows: [] }
    } else if (lower.includes('where doc_num = $')) {
      const docNum = params[params.length - 1]
      const idx = mockState.records.findIndex(r => r.doc_num === docNum)
      if (idx >= 0) {
        const prev = mockState.records[idx]
        const updated = { ...prev, updated_at: new Date().toISOString() }
        // Match fields dynamically from SET clauses
        const setClauses = normalized.substring(
          normalized.toLowerCase().indexOf('set') + 3,
          normalized.toLowerCase().indexOf('where')
        ).split(',')

        setClauses.forEach(clause => {
          const m = clause.trim().match(/([a-zA-Z0-9_]+)\s*=\s*\$(\d+)/)
          if (m) {
            const field = m[1]
            const pIdx = parseInt(m[2], 10) - 1
            if (pIdx >= 0 && pIdx < params.length) {
              ;(updated as any)[field] = params[pIdx]
            }
          }
        })
        mockState.records[idx] = updated
        return { rows: [updated] }
      }
      return { rows: [] }
    }
  }

  if (lower.startsWith('delete from repair_records')) {
    const docNum = params[0]
    const idx = mockState.records.findIndex(r => r.doc_num === docNum)
    if (idx >= 0) {
      const deleted = mockState.records.splice(idx, 1)
      return { rows: deleted }
    }
    return { rows: [] }
  }

  return { rows: [] }
}

// Database client abstraction with automatic in-memory fallback
function getSql() {
  const databaseUrl = process.env.DATABASE_URL_repair || process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (databaseUrl && !pool) {
    try {
      let connectionString = databaseUrl
      if (!databaseUrl.includes('uselibpqcompat')) {
        connectionString = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'uselibpqcompat=true'
      }
      pool = new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      })
    } catch (e) {
      console.warn('[DB] Failed to initialize pg.Pool, using in-memory store:', e)
    }
  }

  return {
    query: async (queryText: string, params: any[] = []) => {
      if (pool) {
        try {
          return await pool.query(queryText, params)
        } catch (err) {
          console.warn('[DB] Real database query failed, falling back to in-memory store:', err)
          return await runMockQuery(queryText, params)
        }
      }
      return await runMockQuery(queryText, params)
    }
  }
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
