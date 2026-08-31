```ts
import pg from 'pg'

// ── In-Memory Store & Mock Data (Fallback when PostgreSQL is not configured / reachable) ──
interface MemoryStore {
  repairRecords: any[];
  repairItems: any[];
  masters: any[];
  settings: Record<string, string>;
  nextRecordId: number;
  nextItemId: number;
  nextMasterId: number;
}

const memoryStore: MemoryStore = {
  repairRecords: [
    {
      id: 1,
      doc_num: 'JR1001',
      name: 'Ramesh Sharma',
      mobile: '9822012345',
      metal: 'Gold 22K',
      jewellery: 'Gold Ring',
      weight: '4.5g',
      amount: 1500,
      salesman: 'Suresh',
      description: 'Size resizing and stone fixing',
      received_date: new Date(Date.now() - 3 * 86400000).toISOString(),
      delivery_date: new Date(Date.now() + 4 * 86400000).toISOString(),
      status: 'with_karagir',
      karagir: 'Ganesh Soni',
      karagir_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      final_amount: null,
      completed_date: null,
      quality: '22K Hallmarked',
      received_invoice_expires_at: null,
      location: 'satara',
      current_location: 'satara',
      transfer_status: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 2,
      doc_num: 'JR1002',
      name: 'Anjali Deshmukh',
      mobile: '9422039371',
      metal: 'Gold 22K',
      jewellery: 'Gold Necklace',
      weight: '24.2g',
      amount: 3200,
      salesman: 'Pooja',
      description: 'Lock replacement and ultrasonic polishing',
      received_date: new Date(Date.now() - 5 * 86400000).toISOString(),
      delivery_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      status: 'ready',
      karagir: 'Ganesh Soni',
      karagir_date: new Date(Date.now() - 4 * 86400000).toISOString(),
      final_amount: 3200,
      completed_date: new Date(Date.now() - 1 * 86400000).toISOString(),
      quality: '22K 916',
      received_invoice_expires_at: null,
      location: 'satara',
      current_location: 'satara',
      transfer_status: null,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 3,
      doc_num: 'JR1003',
      name: 'Vikram Patil',
      mobile: '9850123456',
      metal: 'Silver 925',
      jewellery: 'Silver Anklet',
      weight: '45.0g',
      amount: 600,
      salesman: 'Amit',
      description: 'Joint soldering and rhodium polish',
      received_date: new Date().toISOString(),
      delivery_date: new Date(Date.now() + 6 * 86400000).toISOString(),
      status: 'received',
      karagir: null,
      karagir_date: null,
      final_amount: null,
      completed_date: null,
      quality: '925 Silver',
      received_invoice_expires_at: null,
      location: 'satara',
      current_location: 'satara',
      transfer_status: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  repairItems: [],
  masters: [
    { id: 1, type: 'salesman', name: 'Suresh', status: 'active', mobile: '9876500001', category: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 2, type: 'salesman', name: 'Pooja', status: 'active', mobile: '9876500002', category: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 3, type: 'salesman', name: 'Amit', status: 'active', mobile: '9876500003', category: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 4, type: 'jewellery', name: 'Gold Ring', category: 'Ring', status: 'active', mobile: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 5, type: 'jewellery', name: 'Gold Necklace', category: 'Necklace', status: 'active', mobile: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 6, type: 'jewellery', name: 'Gold Bracelet', category: 'Bracelet', status: 'active', mobile: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 7, type: 'jewellery', name: 'Silver Anklet', category: 'Anklet', status: 'active', mobile: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 8, type: 'jewellery', name: 'Silver Chain', category: 'Chain', status: 'active', mobile: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 9, type: 'jewellery', name: 'Mangalsutra', category: 'Necklace', status: 'active', mobile: null, metal_type: null, karat: null, speciality: null, address: null },
    { id: 10, type: 'metal', name: 'Gold 22K', metal_type: 'Gold', karat: '22K', status: 'active', mobile: null, category: null, speciality: null, address: null },
    { id: 11, type: 'metal', name: 'Gold 18K', metal_type: 'Gold', karat: '18K', status: 'active', mobile: null, category: null, speciality: null, address: null },
    { id: 12, type: 'metal', name: 'Silver 925', metal_type: 'Silver', karat: '925', status: 'active', mobile: null, category: null, speciality: null, address: null },
    { id: 13, type: 'karagir', name: 'Ganesh Soni', speciality: 'Gold repair', address: 'Budhwar Peth, Satara', mobile: '9765400001', status: 'active', category: null, metal_type: null, karat: null },
    { id: 14, type: 'karagir', name: 'Manoj Karekar', speciality: 'Silver polishing', address: 'Laxmi Road, Satara', mobile: '9765400002', status: 'active', category: null, metal_type: null, karat: null },
    { id: 15, type: 'whatsapp_api', name: 'Route Mobile', api_url: 'https://apis.rmlconnect.net/wba/v1/messages', api_token: '', template_name: '', status: 'active', mobile: null, category: null, metal_type: null, karat: null, speciality: null, address: null }
  ],
  settings: {
    shop_name: 'Devi Jewellers',
    shop_owner: 'Devi Jewellers Team',
    shop_phone: '+91 98765 43210',
    shop_gst: '27AAAAA0000A1Z5',
    shop_city: 'Satara',
    shop_address: 'Main Road, Powai Naka, Satara - 415001',
    doc_sequence: '1004',
    whatsapp_rm_api_url: 'https://apis.rmlconnect.net/wba/v1/messages',
    whatsapp_rm_api_version: 'v17.0',
    invoice_link_base: 'https://invoice.devijewellers.in',
    invoice_expiry_days: '10',
    template_1_name: 'jewellery_received_invoice',
    template_2_name: 'jewellery_ready_invoice',
    trigger_receive: 'true',
    trigger_ready: 'true',
    trigger_karagir: 'false',
    location: 'satara',
    locations: JSON.stringify([
      { id: 'satara', name: 'Satara (Main - Karagir Center)', prefix: 'JR', next_seq: 0 },
      { id: 'koregaon', name: 'Koregaon (Branch)', prefix: 'JR-KO', next_seq: 0 }
    ])
  },
  nextRecordId: 4,
  nextItemId: 1,
  nextMasterId: 16
}

function handleMockQuery(text: string, values: any[] = []): { rows: any[] } {
  const q = text.trim()
  const qUpper = q.toUpperCase()

  if (qUpper.startsWith('SELECT 1')) {
    return { rows: [{ '?column?': 1 }] }
  }

  if (qUpper.includes('PG_CATALOG.PG_TABLES')) {
    return {
      rows: [
        { tablename: 'masters' },
        { tablename: 'repair_items' },
        { tablename: 'repair_records' },
        { tablename: 'settings' }
      ]
    }
  }

  if (qUpper.includes('FROM SETTINGS')) {
    if (qUpper.startsWith('SELECT KEY, VALUE FROM SETTINGS')) {
      const rows = Object.entries(memoryStore.settings).map(([key, value]) => ({ key, value }))
      return { rows }
    }

    if (qUpper.includes('WHERE KEY =')) {
      let keyVal = values[0]

      if (!keyVal) {
        const match = q.match(/WHERE\s+key\s*=\s*'([^']+)'/i)
        if (match) keyVal = match[1]
      }

      if (keyVal && memoryStore.settings[keyVal] !== undefined) {
        return { rows: [{ key: keyVal, value: memoryStore.settings[keyVal] }] }
      }

      return { rows: [] }
    }
  }

  if (qUpper.startsWith('INSERT INTO SETTINGS')) {
    if (qUpper.includes('WHATSAPP_TEMPLATES')) {
      const val = values[0]
      memoryStore.settings['whatsapp_templates'] = val
      return { rows: [{ key: 'whatsapp_templates', value: val }] }
    }

    const key = values[0]
    const val = values[1]

    if (key !== undefined) {
      memoryStore.settings[key] = String(val ?? '')
      return { rows: [{ key, value: String(val ?? '') }] }
    }
  }

  if (qUpper.includes('FROM MASTERS')) {
    if (qUpper.startsWith('SELECT * FROM MASTERS')) {
      const sorted = [...memoryStore.masters].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      )

      return { rows: sorted }
    }
  }

  if (qUpper.startsWith('INSERT INTO MASTERS')) {
    const [name, category, type, speciality, mobile, address, karat, status] = values

    const newMaster = {
      id: memoryStore.nextMasterId++,
      name: name || '',
      category: category || null,
      type: type || 'salesman',
      speciality: speciality || null,
      mobile: mobile || null,
      address: address || null,
      karat: karat || null,
      status: status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    memoryStore.masters.push(newMaster)
    return { rows: [newMaster] }
  }

  if (qUpper.startsWith('UPDATE MASTERS')) {
    const id = values[values.length - 1]
    const master = memoryStore.masters.find(m => m.id === Number(id))

    if (master) {
      const [name, category, speciality, mobile, address, karat, status] = values

      if (name !== undefined && name !== null) master.name = name
      if (category !== undefined) master.category = category
      if (speciality !== undefined) master.speciality = speciality
      if (mobile !== undefined) master.mobile = mobile
      if (address !== undefined) master.address = address
      if (karat !== undefined) master.karat = karat
      if (status !== undefined && status !== null) master.status = status

      master.updated_at = new Date().toISOString()

      return { rows: [master] }
    }

    return { rows: [] }
  }

  if (qUpper.includes('FROM REPAIR_ITEMS')) {
    if (qUpper.startsWith('SELECT * FROM REPAIR_ITEMS WHERE RECORD_ID =')) {
      const recordId = Number(values[0])
      const items = memoryStore.repairItems.filter(i => i.record_id === recordId)
      return { rows: items }
    }

    if (qUpper.startsWith('DELETE FROM REPAIR_ITEMS WHERE RECORD_ID =')) {
      const recordId = Number(values[0])
      memoryStore.repairItems = memoryStore.repairItems.filter(
        i => i.record_id !== recordId
      )
      return { rows: [] }
    }
  }

  if (qUpper.startsWith('INSERT INTO REPAIR_ITEMS')) {
    const [record_id, metal, jewellery, weight, description] = values

    const item = {
      id: memoryStore.nextItemId++,
      record_id: Number(record_id),
      metal,
      jewellery,
      weight: String(weight),
      description: description || '',
      created_at: new Date().toISOString()
    }

    memoryStore.repairItems.push(item)
    return { rows: [item] }
  }

  if (qUpper.includes('FROM REPAIR_RECORDS')) {
    if (qUpper.startsWith('SELECT * FROM REPAIR_RECORDS WHERE DOC_NUM =')) {
      const docNum = String(values[0])
      const rec = memoryStore.repairRecords.find(r => r.doc_num === docNum)
      return { rows: rec ? [rec] : [] }
    }

    if (qUpper.startsWith('SELECT * FROM REPAIR_RECORDS')) {
      const sorted = [...memoryStore.repairRecords].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )

      return { rows: sorted }
    }

    if (qUpper.startsWith('DELETE FROM REPAIR_RECORDS WHERE DOC_NUM =')) {
      const docNum = String(values[0])
      const idx = memoryStore.repairRecords.findIndex(r => r.doc_num === docNum)

      if (idx !== -1) {
        const deleted = memoryStore.repairRecords.splice(idx, 1)[0]
        return { rows: [deleted] }
      }

      return { rows: [] }
    }
  }

  if (qUpper.startsWith('INSERT INTO REPAIR_RECORDS')) {
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
    ] = values

    const newRecord = {
      id: memoryStore.nextRecordId++,
      doc_num,
      name,
      mobile,
      metal,
      jewellery,
      weight: String(weight || ''),
      amount: Number(amount || 0),
      salesman: salesman || '',
      description: description || '',
      received_date: received_date || new Date().toISOString(),
      delivery_date:
        delivery_date ||
        new Date(Date.now() + 7 * 86400000).toISOString(),
      status: status || 'received',
      karagir: null,
      karagir_date: null,
      final_amount: null,
      completed_date: null,
      quality: null,
      received_invoice_expires_at: null,
      location: location || 'satara',
      current_location: current_location || 'satara',
      transfer_status: transfer_status || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    memoryStore.repairRecords.unshift(newRecord)
    return { rows: [newRecord] }
  }

  if (qUpper.startsWith('UPDATE REPAIR_RECORDS')) {
    if (qUpper.includes('WHERE ID =')) {
      const id = Number(values[20] ?? values[values.length - 1])
      const rec = memoryStore.repairRecords.find(r => r.id === id)

      if (rec) {
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
          karagir,
          karagir_date,
          final_amount,
          completed_date,
          quality,
          location,
          current_location,
          transfer_status
        ] = values

        if (doc_num) rec.doc_num = doc_num
        if (name) rec.name = name
        if (mobile) rec.mobile = mobile
        if (metal) rec.metal = metal
        if (jewellery) rec.jewellery = jewellery
        if (weight !== undefined) rec.weight = String(weight)
        if (amount !== undefined) rec.amount = Number(amount)
        if (salesman) rec.salesman = salesman
        if (description !== undefined) rec.description = description
        if (received_date) rec.received_date = received_date
        if (delivery_date) rec.delivery_date = delivery_date
        if (status) rec.status = status
        if (karagir !== undefined) rec.karagir = karagir
        if (karagir_date !== undefined) rec.karagir_date = karagir_date
        if (final_amount !== undefined) {
          rec.final_amount =
            final_amount !== null ? Number(final_amount) : null
        }
        if (completed_date !== undefined) rec.completed_date = completed_date
        if (quality !== undefined) rec.quality = quality
        if (location !== undefined) rec.location = location
        if (current_location !== undefined) {
          rec.current_location = current_location
        }
        if (transfer_status !== undefined) {
          rec.transfer_status = transfer_status
        }

        rec.updated_at = new Date().toISOString()

        return { rows: [rec] }
      }

      return { rows: [] }
    } else if (qUpper.includes('WHERE DOC_NUM =')) {
      const docNum = String(values[values.length - 1])
      const rec = memoryStore.repairRecords.find(r => r.doc_num === docNum)

      if (rec) {
        const setPart = q.substring(
          qUpper.indexOf('SET') + 3,
          qUpper.indexOf('WHERE')
        )

        const assignments = setPart.split(',').map(s => s.trim())

        assignments.forEach((assignment) => {
          const match = assignment.match(
            /([a-zA-Z0-9_]+)\s*=\s*\$(\d+)/
          )

          if (match) {
            const col = match[1].toLowerCase()
            const paramIdx = parseInt(match[2], 10) - 1
            const val = values[paramIdx]

            if (val !== undefined) {
              if (col === 'amount' || col === 'final_amount') {
                ;(rec as any)[col] =
                  val !== null ? Number(val) : null
              } else {
                ;(rec as any)[col] = val
              }
            }
          }
        })

        rec.updated_at = new Date().toISOString()

        return { rows: [rec] }
      }

      return { rows: [] }
    }
  }

  return { rows: [] }
}

// ── Resilient Database Pool / Fallback Wrapper ──
let pgPool: pg.Pool | null = null
let useMemoryFallback = false

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL_repair ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    undefined
  )
}

function createClientWrapper() {
  const dbUrl = getDatabaseUrl()

  if (dbUrl && !useMemoryFallback) {
    if (!pgPool) {
      let connectionString = dbUrl

      if (!connectionString.includes('uselibpqcompat')) {
        connectionString =
          connectionString +
          (connectionString.includes('?') ? '&' : '?') +
          'uselibpqcompat=true'
      }

      try {
        pgPool = new pg.Pool({
          connectionString,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 3000
        })
      } catch (err) {
        console.warn(
          '[DB] Failed to instantiate pg.Pool, using in-memory store:',
          err
        )
        useMemoryFallback = true
      }
    }
  }

  return {
    query: async (
      text: string,
      values: any[] = []
    ): Promise<{ rows: any[] }> => {
      if (pgPool && !useMemoryFallback) {
        try {
          return await pgPool.query(text, values)
        } catch (err: any) {
          console.warn(
            '[DB] Live PostgreSQL query failed, switching to in-memory store:',
            err?.message || err
          )

          useMemoryFallback = true
          return handleMockQuery(text, values)
        }
      }

      return handleMockQuery(text, values)
    },

    connect: async () => ({
      query: async (text: string, values: any[] = []) =>
        handleMockQuery(text, values),
      release: () => {}
    })
  }
}

export function sql() {
  return createClientWrapper()
}

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
```
