'use client'
import { useState, useEffect, useCallback } from 'react'

/* ─── Types ─── */
interface RepairRecord {
  id?: number;
  doc_num: string;
  customer_name: string;
  phone_number: string;
  item_type: string;
  description: string;
  estimated_cost: number;
  status: string;
  master_id: number | null;
  notes: string;
  images: string[];
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  karagir?: string | null;
  karagir_date?: string | null;
  final_amount?: number | null;
  completed_date?: string | null;
  quality?: string;
  received_date?: string;
  delivery_date?: string;
  metal?: string;
  jewellery?: string;
  weight?: string;
  amount?: number;
  salesman?: string;
  mobile?: string;
  name?: string;
  docNum?: string;
  desc?: string;
  karagirDate?: string | null;
  finalAmount?: number | null;
  completedDate?: string | null;
  receivedDate?: string;
  deliveryDate?: string;
}
interface Master {
  id: number;
  name: string;
  specialty?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  type?: string;
  karat?: string;
  category?: string;
  address?: string;
  spec?: string;
  addr?: string;
  mob?: string;
  cat?: string;
  status?: string;
}

/* ─── Data Conversion Helpers ─── */
const convertFromDB = (record: any): RepairRecord => ({
  ...record,
  // Map DB fields to frontend fields
  docNum: record.doc_num,
  name: record.name,
  mobile: record.mobile,
  jewellery: record.jewellery,
  desc: record.description,
  amount: record.amount,
  karagir: record.karagir,
  karagirDate: record.karagir_date,
  finalAmount: record.final_amount,
  completedDate: record.completed_date,
  receivedDate: record.received_date,
  deliveryDate: record.delivery_date,
  metal: record.metal,
  weight: record.weight,
  salesman: record.salesman,
  quality: record.quality,
  // Keep legacy fields for compatibility
  customer_name: record.name,
  phone_number: record.mobile,
  item_type: record.jewellery,
  description: record.description,
  estimated_cost: record.amount,
  master_id: record.master_id,
  notes: record.notes,
  images: record.images,
});

const convertToDB = (record: RepairRecord) => ({
  doc_num: record.docNum || record.doc_num,
  customer_name: record.name || record.customer_name,
  phone_number: record.mobile || record.phone_number,
  item_type: record.jewellery || record.item_type,
  description: record.desc || record.description || '',
  estimated_cost: record.amount || record.estimated_cost,
  status: record.status,
  master_id: record.master_id,
  notes: record.notes || '',
  images: record.images || [],
  karagir: record.karagir,
  karagir_date: record.karagirDate || record.karagir_date,
  final_amount: record.finalAmount || record.final_amount,
  completed_date: record.completedDate || record.completed_date,
  quality: record.quality,
  received_date: record.receivedDate || record.received_date,
  delivery_date: record.deliveryDate || record.delivery_date,
  metal: record.metal,
  weight: record.weight,
  salesman: record.salesman,
});

const convertMasterFromDB = (master: any): Master => ({
  ...master,
  // Add legacy fields
  mob: master.phone_number,
  cat: master.category,
  type: master.type,
  karat: master.karat,
  spec: master.specialty,
  addr: master.address,
  status: master.is_active ? 'active' : 'inactive',
});

const convertMasterToDB = (master: Master) => ({
  name: master.name,
  specialty: master.spec || master.specialty,
  phone_number: master.mob || master.phone_number,
  email: master.email,
  is_active: master.status === 'active' || master.is_active,
  type: master.type,
  karat: master.karat,
  category: master.cat || master.category,
  address: master.addr || master.address,
});

/* ─── Helpers ─── */
const fmtDate = (iso?: string | Date) => new Date(iso || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtFull = (iso: string | Date) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const addDays = (d: string | Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const randTok = (n: number) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')
const effStatus = (r: RepairRecord) => {
  if (r.status === 'ready') return 'ready'
  if ((r.status === 'received' || r.status === 'with_karagir') && r.deliveryDate && new Date(r.deliveryDate) < new Date()) return 'overdue'
  return r.status
}

const bdgCls: Record<string, string> = { received: 'badge-recv', with_karagir: 'badge-karagir', ready: 'badge-ready', overdue: 'badge-overdue' }
const bdgLbl: Record<string, string> = { received: 'Received', with_karagir: 'With Karagir', ready: 'Ready', overdue: 'Overdue' }
const sbCls: Record<string, string> = { received: 'sb-recv', with_karagir: 'sb-karagir', ready: 'sb-ready', overdue: 'sb-overdue' }
const sbLbl: Record<string, string> = { received: 'Received — awaiting karagir', with_karagir: 'With karagir — repair in progress', ready: 'Ready for delivery', overdue: 'Overdue — repair pending' }

/* ─── SVG Icons ─── */
const IcBack = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
const IcPdf = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
const IcDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const IcCopy = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
const IcClock = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const IcWA = ({ size = 14, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.486a.5.5 0 00.606.62l5.808-1.525A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.013-1.376l-.36-.214-3.724.977.994-3.622-.235-.373A9.818 9.818 0 1112 21.818z" />
  </svg>
)

/* ─── PDF Generation ─── */
declare global { interface Window { jspdf: { jsPDF: any } } }

function generateInvoiceLink(docNum: string, type: string, baseUrl: string, expDays: number) {
  const token = randTok(8)
  const expDate = fmtDate(addDays(new Date(), expDays).toISOString())
  const suffix = type === 'final' ? '-final' : ''
  // Use /r/ format for custom domain (devi-jewellers.com), /api/invoice/ for Vercel
  const isCustomDomain = baseUrl.includes('devi-jewellers')
  const url = isCustomDomain
    ? `${baseUrl.replace(/\/$/, '')}/r/INV-JR${docNum}${suffix}-${token}?exp=${expDate.replace(/ /g, '')}`
    : `${baseUrl.replace(/\/$/, '')}/api/invoice/INV-${docNum}${suffix}-${token}?exp=${expDate.replace(/ /g, '')}`
  return { url, expDate }
}

function buildAndDownloadPDF(rec: RepairRecord, type: 'received' | 'final', baseUrl: string, expDays: number, shopName: string = 'Devi Jewellers', shopAddress: string = '') {
  if (typeof window === 'undefined' || !window.jspdf) return null
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, pad = 15
  let y = pad

  doc.setFillColor(192, 0, 58); doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(shopName, pad, 11)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  if (shopAddress) {
    doc.text(shopAddress.substring(0, 50), pad, 17)
    doc.setFontSize(7); doc.text('Anmol Kshananache Soneri Sakshidar', pad, 22)
  } else {
    doc.text('Gold | Silver | Diamonds | Pearls', pad, 17)
    doc.setFontSize(7); doc.text('Anmol Kshananache Soneri Sakshidar', pad, 22)
  }

  doc.setFillColor(168, 0, 126); doc.rect(0, 28, W, 7, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text(type === 'final' ? 'FINAL REPAIR INVOICE' : 'REPAIR RECEIPT / ESTIMATE', W / 2, 33, { align: 'center' })
  y = 44

  doc.setTextColor(0, 0, 0); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text('Document No:', pad, y); doc.setFont('helvetica', 'normal'); doc.text(rec.docNum, pad + 32, y)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Date:', W - pad - 50, y); doc.setFont('helvetica', 'normal'); doc.text(fmtDate(rec.receivedDate || rec.created_at || new Date().toISOString()), W - pad - 36, y)
  y += 7; doc.setDrawColor(192, 0, 58); doc.setLineWidth(0.3); doc.line(pad, y, W - pad, y); y += 6

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Customer Details', pad, y); y += 5
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(`Name: ${rec.name}`, pad, y); y += 5
  doc.text(`Mobile: ${rec.mobile}`, pad, y); y += 5
  doc.line(pad, y, W - pad, y); y += 6

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Jewellery Details', pad, y); y += 5
  const rows: [string, string][] = [['Item', rec.jewellery || rec.item_type || ''], ['Metal', rec.metal || ''], ['Repair Work', rec.desc || rec.description || 'General repair'], ['Salesman', rec.salesman || ''], ['Received Date', fmtDate(rec.receivedDate || rec.created_at || new Date().toISOString())], ['Est. Delivery', fmtDate(rec.deliveryDate || addDays(new Date(), 7).toISOString())]]
  rows.forEach(([k, v]) => { doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, pad, y); doc.setFont('helvetica', 'normal'); doc.text(String(v), pad + 38, y); y += 5 })
  y += 2; doc.line(pad, y, W - pad, y); y += 6

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Charges', pad, y); y += 5
  if (type === 'final') {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Estimated Amount:', pad, y); doc.setFont('helvetica', 'normal'); doc.text(`&#8377; ${rec.amount}`, pad + 50, y); y += 5
    doc.setFont('helvetica', 'bold'); doc.text('Final Amount:', pad, y); doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(`&#8377; ${rec.finalAmount}`, pad + 50, y); y += 5
  } else {
    doc.setFont('helvetica', 'bold'); doc.text('Estimated Amount:', pad, y); doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(`&#8377; ${rec.amount}`, pad + 50, y); y += 5
    doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.text('(Final amount confirmed on delivery)', pad, y); doc.setTextColor(0, 0, 0); y += 5
  }
  y += 2; doc.line(pad, y, W - pad, y); y += 6

  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
  doc.text('Thank you for trusting Devi Jewellers.', pad, y, { maxWidth: W - 2 * pad }); y += 5
  doc.text('Anmol Kshananache Soneri Sakshidar', W / 2, y, { align: 'center' })

  doc.save(`Invoice-${rec.docNum}-${type === 'final' ? 'Final' : 'Receipt'}.pdf`)
  return { url: '', expDate: '' }
}

/* ─── Thermal Print for 3" Printer ─── */
function printThermalReceipt(rec: RepairRecord, type: 'received' | 'final', shopName: string, shopAddress: string) {
  // Use default address if not set
  const address = shopAddress || 'Nashik, Maharashtra'
  const isFinal = type === 'final'
  
  // Get data values
  const docNo = rec.docNum || rec.doc_num || ''
  const dateVal = fmtDate(rec.receivedDate || rec.created_at || new Date().toISOString())
  const customer = rec.name || rec.customer_name || ''
  const mobile = rec.mobile || ''
  const item = rec.jewellery || rec.item_type || ''
  const metal = rec.metal || ''
  const amount = rec.amount || rec.estimated_cost || 0
  const finalAmount = rec.finalAmount || rec.final_amount || 0
  
  // Create print-friendly HTML in current window
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Print Receipt</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @page { size: 76mm 150mm; margin: 0; }
        html, body {
          width: 72mm;
          margin: 0;
          padding: 1mm;
          font-family: Arial Black, Arial, Helvetica, sans-serif;
          font-size: 14px;
          line-height: 1.2;
          color: #000;
          background: #fff;
          -webkit-font-smoothing: none;
        }
        .header { text-align: center; font-weight: 900; font-size: 18px; margin-bottom: 2px; color: #000; }
        .address { text-align: center; font-weight: bold; font-size: 10px; margin-bottom: 4px; color: #000; }
        .divider { border-top: 2px solid #000; margin: 4px 0; }
        .title { text-align: center; font-weight: 900; font-size: 16px; margin: 4px 0; color: #000; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; color: #000; font-weight: bold; }
        .label { color: #000; font-weight: bold; }
        .value { font-weight: 900; color: #000; }
        .bold { font-weight: 900; }
        .big { font-size: 16px; }
        .footer { text-align: center; font-weight: bold; font-size: 10px; margin-top: 5px; color: #000; }
        .btn-row { display: flex; gap: 10px; justify-content: center; margin-top: 15px; }
        .btn { padding: 10px 20px; font-size: 14px; cursor: pointer; border: none; border-radius: 4px; }
        .btn-print { background: #25D366; color: white; }
        .btn-dash { background: #666; color: white; }
        @media print {
          .btn-row { display: none !important; }
          html, body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">${shopName}</div>
      <div class="address">${address}</div>
      <div class="divider"></div>
      <div class="title">${isFinal ? 'FINAL INVOICE' : 'REPAIR RECEIPT'}</div>
      <div class="divider"></div>
      <div class="row"><span class="label">Doc No:</span><span class="value">${docNo}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${dateVal}</span></div>
      <div class="row"><span class="label">Customer:</span><span class="value">${customer}</span></div>
      <div class="row"><span class="label">Mobile:</span><span class="value">${mobile}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Item:</span><span class="value">${item}</span></div>
      <div class="row"><span class="label">Metal:</span><span class="value">${metal}</span></div>
      <div class="divider"></div>
      ${isFinal ? `
      <div class="row"><span class="label">Estimated:</span><span class="value">Rs ${amount}</span></div>
      <div class="row bold big"><span class="label">Final:</span><span class="value">Rs ${finalAmount}</span></div>
      ` : `
      <div class="row bold big"><span class="label">Estimated:</span><span class="value">Rs ${amount}</span></div>
      `}
      <div class="divider"></div>
      <div class="footer">Thank you for trusting us!</div>
      <div class="btn-row">
        <button class="btn btn-print" onclick="window.print()">Print</button>
        <button class="btn btn-dash" onclick="window.location.href=window.location.href">Back</button>
      </div>
    </body>
    </html>
  `
  
  // Use current window
  document.open()
  document.write(printContent)
  document.close()
}

/* ─── Sub-components ─── */
function Msg({ text, ok }: { text: string; ok: boolean }) {
  if (!text) return null
  return <div className={`msg ${ok ? 'msg-ok' : 'msg-err'}`} dangerouslySetInnerHTML={{ __html: text }} />
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="tslider" />
    </label>
  )
}

function InvoicePanel({ rec, type, baseUrl, expDays, onMsg, onSendWhatsApp, shopName, shopAddress }: { rec: RepairRecord; type: 'received' | 'final'; baseUrl: string; expDays: number; onMsg: (m: string, ok: boolean) => void; onSendWhatsApp: () => Promise<void>; shopName?: string; shopAddress?: string }) {
  const { url, expDate } = generateInvoiceLink(rec.docNum || rec.doc_num, type, baseUrl, expDays)
  const waMsg = type === 'received'
    ? `Dear ${rec.name || rec.customer_name},\n\nYour ${rec.metal} jewellery (${rec.jewellery || rec.item_type}) has been received at *Devi Jewellers*.\n\n📋 *Document No:* ${rec.docNum || rec.doc_num}\n📅 *Est. Delivery:* ${fmtDate(rec.deliveryDate || addDays(new Date(), 7).toISOString())}\n💰 *Est. Charges:* &#8377; ${rec.amount || rec.estimated_cost}\n\n📄 *View your invoice:*\n${url}\n_(Link valid ${expDays} days — expires ${expDate})_\n\nThank you! *Devi Jewellers* 🌟`
    : `Dear ${rec.name || rec.customer_name},\n\nYour *${rec.metal}* jewellery is *ready for delivery* at *Devi Jewellers*! 🎉\n\n📋 *Document No:* ${rec.docNum || rec.doc_num}\n💰 *Final Charges:* &#8377; ${rec.finalAmount || rec.final_amount}\n\n📄 *View your final invoice:*\n${url}\n_(Link valid ${expDays} days — expires ${expDate})_\n\nPlease visit with your receipt.\nThank you! *Devi Jewellers* 🌟`

  const copy = () => navigator.clipboard.writeText(url).then(() => onMsg('Link copied!', true)).catch(() => onMsg('Copy failed', false))
  const download = () => buildAndDownloadPDF(rec, type, baseUrl, expDays, shopName || 'Devi Jewellers', shopAddress || '')
  const sendWA = async () => {
    try {
      await onSendWhatsApp()
      onMsg(`WhatsApp ${type === 'final' ? 'final invoice' : 'receipt'} sent to +91${rec.mobile} via Route Mobile!`, true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send WhatsApp message'
      onMsg(`WhatsApp send failed: ${message}`, false)
    }
  }

  return (
    <div className="invoice-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontWeight: 600, fontSize: 14 }}>
        <IcPdf /> {type === 'final' ? 'Final Invoice PDF generated' : 'Invoice PDF generated'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="expiry-badge"><IcClock /> Link expires in {expDays} days — {expDate}</span>
      </div>
      <div className="link-box">{url}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.04em', margin: '10px 0 6px' }}>WhatsApp message preview</div>
      <div className="wa-msg-box">{waMsg}</div>
      <div className="btn-row">
        <button className="btn" onClick={() => printThermalReceipt(rec, type, shopName || 'Devi Jewellers', shopAddress || '')}>🖨️ Thermal Print</button>
        <button className="btn btn-primary" onClick={download}><IcDown />Download PDF</button>
        <button className="btn btn-wa" onClick={sendWA}><IcWA />Send via WhatsApp</button>
        <button className="btn" onClick={copy}><IcCopy />Copy link</button>
      </div>
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [page, setPage] = useState('dashboard')
  const [records, setRecords] = useState<RepairRecord[]>([
    { id: 9999, doc_num: 'JR9999', customer_name: 'Test Customer', phone_number: '9876543210', item_type: 'Gold Ring', description: 'Gold Ring repair', estimated_cost: 500, status: 'ready', master_id: null, notes: '', images: [], metal: 'Gold 22K', weight: '5.5', jewellery: 'Gold Ring', salesman: 'Suresh', received_date: new Date().toISOString(), completed_date: new Date().toISOString(), final_amount: 500, name: 'Test Customer', docNum: 'JR9999' }
  ])
  const [docSeq, setDocSeq] = useState(1000)
  const [msg, setMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  // Masters
  const [salesmen, setSalesmen] = useState<Master[]>([{ id: 1, name: 'Suresh', mob: '9876500001', status: 'active', is_active: true }, { id: 2, name: 'Pooja', mob: '9876500002', status: 'active', is_active: true }, { id: 3, name: 'Amit', mob: '9876500003', status: 'active', is_active: true }])
  const [jewelleries, setJewelleries] = useState<Master[]>([{ id: 1, name: 'Gold Ring', cat: 'Ring', status: 'active', is_active: true }, { id: 2, name: 'Gold Necklace', cat: 'Necklace', status: 'active', is_active: true }, { id: 3, name: 'Gold Bracelet', cat: 'Bracelet', status: 'active', is_active: true }, { id: 4, name: 'Silver Anklet', cat: 'Anklet', status: 'active', is_active: true }, { id: 5, name: 'Silver Chain', cat: 'Chain', status: 'active', is_active: true }, { id: 6, name: 'Mangalsutra', cat: 'Necklace', status: 'active', is_active: true }])
  const [metals, setMetals] = useState<Master[]>([{ id: 1, name: 'Gold 22K', type: 'Gold', karat: '22K', status: 'active', is_active: true }, { id: 2, name: 'Gold 18K', type: 'Gold', karat: '18K', status: 'active', is_active: true }, { id: 3, name: 'Silver 925', type: 'Silver', karat: '925', status: 'active', is_active: true }])
  const [karagirs, setKaragirs] = useState<Master[]>([{ id: 1, name: 'Ganesh Soni', mob: '9765400001', spec: 'Gold repair', addr: 'Budhwar Peth', status: 'active', is_active: true }, { id: 2, name: 'Manoj Karekar', mob: '9765400002', spec: 'Silver polishing', addr: 'Laxmi Road', status: 'active', is_active: true }])
  const [masterTab, setMasterTab] = useState('salesman')

  // Receive form
  const [rName, setRName] = useState(''); const [rMobile, setRMobile] = useState(''); const [rMetal, setRMetal] = useState(''); const [rType, setRType] = useState(''); const [rWeight, setRWeight] = useState(''); const [rDays, setRDays] = useState(''); const [rAmount, setRAmount] = useState(''); const [rSalesman, setRSalesman] = useState(''); const [rDesc, setRDesc] = useState(''); const [savedRec, setSavedRec] = useState<RepairRecord | null>(null)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false); const [editingRecord, setEditingRecord] = useState<RepairRecord | null>(null)

  // Karagir out
  const [koDoc, setKoDoc] = useState(''); const [koKaragir, setKoKaragir] = useState(''); const [koNotes, setKoNotes] = useState(''); const [koLoaded, setKoLoaded] = useState(false); const [koEditing, setKoEditing] = useState(false)

  // Karagir in
  const [kiDoc, setKiDoc] = useState(''); const [kiAmount, setKiAmount] = useState(''); const [kiQuality, setKiQuality] = useState('Good'); const [kiLoaded, setKiLoaded] = useState(false); const [finalRec, setFinalRec] = useState<RepairRecord | null>(null); const [kiEditing, setKiEditing] = useState(false)

  // Track
  const [trackQ, setTrackQ] = useState(''); const [trackResults, setTrackResults] = useState<RepairRecord[]>([]); const [showAll, setShowAll] = useState(true)

  // Deliver to Customer
  const [deliverDoc, setDeliverDoc] = useState(''); const [deliverRec, setDeliverRec] = useState<RepairRecord | null>(null); const [deliverSelected, setDeliverSelected] = useState(false); const [deliverOtp, setDeliverOtp] = useState(''); const [deliverOtpSent, setDeliverOtpSent] = useState(false); const [deliverOtpVerified, setDeliverOtpVerified] = useState(false); const [deliverOtpInput, setDeliverOtpInput] = useState('')

  const deliverSendOtp = async () => {
    // First check if WhatsApp credentials are configured
    if (!rmToken) {
      showMessage('deliver', 'Please add WhatsApp API token in Settings → WhatsApp API → Credentials and click Save', false);
      return;
    }
    
    const otp = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit OTP
    const mobile = deliverRec?.mobile || deliverRec?.phone_number;
    const customerName = deliverRec?.name || deliverRec?.customer_name || 'Customer';
    
    // Validate mobile exists
    if (!mobile) {
      showMessage('deliver', 'Customer mobile number not found!', false);
      return;
    }
    
    // Check if WhatsApp is configured (has token and template)
    if (rmToken && rmApiUrl) {
      try {
        // Use server-side proxy to avoid CORS issues
        console.log('📱 Sending OTP via server proxy...', { mobile, customerName, otp, apiUrl: rmApiUrl });
        
        const response = await fetch('/api/send-whatsapp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile: mobile,
            customerName: 'mangesh', // Static name for OTP
            otp: otp,
            shopName: cfgShop || 'Devi Jewellers',
            expiry: '10 mins',
            token: rmToken,
            apiUrl: rmApiUrl,
            isOtp: true
          })
        });
        
        const result = await response.json();
        console.log('📱 Server proxy response:', response.status, result);
        
        if (response.ok && result.success) {
          setDeliverOtp(otp);
          setDeliverOtpSent(true);
          showMessage('deliver', '✅ OTP ' + otp + ' sent to customer via WhatsApp!', true);
        } else {
          // API failed - fall back to demo mode
          console.log('📱 WhatsApp API failed, using demo mode');
          setDeliverOtp(otp);
          setDeliverOtpSent(true);
          showMessage('deliver', '📱 WhatsApp API unreachable - showing OTP for demo: ' + otp, true);
        }
      } catch (err) {
        console.error('OTP send error:', err);
        // Fallback to demo mode
        setDeliverOtp(otp);
        setDeliverOtpSent(true);
        showMessage('deliver', '🔐 OTP: ' + otp + ' (demo - API unreachable)', true);
      }
    } else {
      // WhatsApp not configured - still generate OTP for demo
      setDeliverOtp(otp);
      setDeliverOtpSent(true);
      showMessage('deliver', 'OTP: ' + otp + ' (WhatsApp not configured)', true);
    }
  }

  // Settings
  const [cfgShop, setCfgShop] = useState('Devi Jewellers'); const [cfgOwner, setCfgOwner] = useState(''); const [cfgPhone, setCfgPhone] = useState(''); const [cfgGst, setCfgGst] = useState(''); const [cfgCity, setCfgCity] = useState(''); const [cfgAddr, setCfgAddr] = useState('')
  const [rmUser, setRmUser] = useState(''); const [rmPass, setRmPass] = useState(''); const [rmWaba, setRmWaba] = useState(''); const [rmPhoneid, setRmPhoneid] = useState(''); const [rmWaphone, setRmWaphone] = useState(''); const [rmToken, setRmToken] = useState(''); const [rmApiUrl, setRmApiUrl] = useState('https://api.rmlconnect.net/wba/v1/messages'); const [rmApiver, setRmApiver] = useState('v17.0')
  const [cfgLinkBase, setCfgLinkBase] = useState(''); const [cfgExpiry, setCfgExpiry] = useState(10)
  const [tpl1Name, setTpl1Name] = useState('repair_receive'); const [tpl2Name, setTpl2Name] = useState('padm_sales_final_update'); const [tpl3Name, setTpl3Name] = useState('2739573333095990'); const [tpl1Body, setTpl1Body] = useState(''); const [tpl2Body, setTpl2Body] = useState(''); const [tpl3Body, setTpl3Body] = useState(''); const [tpl1Lang, setTpl1Lang] = useState('en'); const [tpl2Lang, setTpl2Lang] = useState('en'); const [tpl3Lang, setTpl3Lang] = useState('en')
  const [connStatus, setConnStatus] = useState<'no' | 'ok' | 'checking'>('no')
  const [settingsTab, setSettingsTab] = useState('creds')
  const [trRecv, setTrRecv] = useState(true); const [trReady, setTrReady] = useState(true); const [trKaragir, setTrKaragir] = useState(false)
  const [testWa, setTestWa] = useState(''); const [testTpl, setTestTpl] = useState('received')
  const [printRec, setPrintRec] = useState<{rec: RepairRecord; type: 'received' | 'final'} | null>(null)

  // Save all settings (Shop Info + WhatsApp Credentials + Invoice Settings) - single button
  const saveAllSettings = async () => {
    console.log('💾 Saving all settings in ONE API call...');
    
    try {
      // Send ALL settings in ONE API call
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Shop Info
          businessName: cfgShop,
          shopOwner: cfgOwner,
          shopPhone: cfgPhone,
          shopGst: cfgGst,
          shopCity: cfgCity,
          shopAddress: cfgAddr,
          // WhatsApp + Invoice
          whatsappRmUser: rmUser,
          whatsappRmPass: rmPass,
          whatsappRmWaba: rmWaba,
          whatsappRmPhoneid: rmPhoneid,
          whatsappRmWaphone: rmWaphone,
          whatsappRmToken: rmToken,
          whatsappRmApiUrl: rmApiUrl,
          whatsappRmApiVersion: rmApiver,
          invoiceLinkBase: cfgLinkBase || 'https://jewellery-repair-management.vercel.app',
          invoiceExpiry: cfgExpiry,
          // Templates
          tpl1Name, tpl2Name, tpl3Name,
          tpl1Body: tpl1Body || null,
          tpl2Body: tpl2Body || null,
          tpl3Body: tpl3Body || null,
          tpl1Lang: tpl1Lang || 'en',
          tpl2Lang: tpl2Lang || 'en',
          tpl3Lang: tpl3Lang || 'en',
          // Doc sequence
          docSeq: docSeq
        })
      });
      
      const result = await res.json();
      console.log('✅ Settings save response:', res.status, result);
      
      if (res.ok) {
        showMessage('creds', '✅ All settings saved to database!', true);
        
        // Reload settings from DB
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.businessName) setCfgShop(settings.businessName);
          if (settings.shopOwner) setCfgOwner(settings.shopOwner);
          if (settings.shopPhone) setCfgPhone(settings.shopPhone);
          if (settings.shopGst) setCfgGst(settings.shopGst);
          if (settings.shopCity) setCfgCity(settings.shopCity);
          if (settings.shopAddress) setCfgAddr(settings.shopAddress);
          if (settings.whatsappRmToken) setRmToken(settings.whatsappRmToken);
          if (settings.whatsappRmApiUrl) setRmApiUrl(settings.whatsappRmApiUrl);
          if (settings.whatsappRmUser) setRmUser(settings.whatsappRmUser);
          if (settings.whatsappRmWaba) setRmWaba(settings.whatsappRmWaba);
          if (settings.whatsappRmPhoneid) setRmPhoneid(settings.whatsappRmPhoneid);
          if (settings.whatsappRmWaphone) setRmWaphone(settings.whatsappRmWaphone);
          if (settings.whatsappRmApiVersion) setRmApiver(settings.whatsappRmApiVersion);
          if (settings.invoiceLinkBase) setCfgLinkBase(settings.invoiceLinkBase);
          if (settings.invoiceExpiry) setCfgExpiry(settings.invoiceExpiry);
          if (settings.docSeq) setDocSeq(settings.docSeq);
        }
      } else {
        showMessage('creds', 'Failed to save: ' + (result.error || 'Unknown error'), false);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showMessage('creds', 'Error saving settings', false);
    }
  };

  const sendWhatsApp = async (rec: RepairRecord, type: 'received' | 'final') => {
    if (!rmToken && (!rmUser || !rmPass)) throw new Error('WhatsApp API key or username/password required.')
    if (!tpl1Name || !tpl2Name) throw new Error('WhatsApp template names are required.')

    const templateName = type === 'received' ? tpl1Name : tpl2Name
    const templateLang = type === 'received' ? tpl1Lang : tpl2Lang
    const templateBody = type === 'received' ? tpl1Body : tpl2Body
    // Default to Vercel URL for /api/invoice/, can switch to devi-jewellers.com for /r/
    const invoiceLinkBase = cfgLinkBase || 'https://jewellery-repair-management.vercel.app'
    // Use /api/invoice/ format for Vercel, or /r/ format for custom domain
    const isCustomDomain = invoiceLinkBase.includes('devi-jewellers')
    const token = randTok(8)
    const expDate = fmtDate(addDays(new Date(), cfgExpiry).toISOString()).replace(/ /g, '')
    const suffix = type === 'final' ? '-final' : ''
    const invoiceLink = isCustomDomain 
      ? `${invoiceLinkBase}/r/INV-JR${rec.docNum || rec.doc_num}${suffix}-${token}?exp=${expDate}`
      : `${invoiceLinkBase}/api/invoice/INV-${rec.docNum || rec.doc_num}${suffix}-${token}?exp=${expDate}`
    const params = type === 'received'
      ? [rec.name || rec.customer_name, rec.metal, rec.jewellery || rec.item_type, fmtDate(rec.deliveryDate || addDays(new Date(), 7).toISOString()), String(rec.amount || rec.estimated_cost), invoiceLink]
      : [rec.name || rec.customer_name, rec.metal, String(rec.finalAmount || rec.final_amount || rec.amount || rec.estimated_cost)]

    const toNumber = (rec.mobile || rec.phone_number || '').replace(/^\+/, '')
    
    // Build payload for Route Mobile - use all 6 params for repair_receive template
    const payload = {
      phone: toNumber,
      media: {
        type: 'media_template',
        template_name: templateName,
        lang_code: templateLang || 'en',
        body: params.filter(Boolean).map(p => ({ text: p }))
      }
    }
    
    console.log('WhatsApp: Calling Route Mobile directly from browser')
    
    // Call Route Mobile directly from browser!
    const response = await fetch('https://apis.rmlconnect.net/wba/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': rmToken
      },
      body: JSON.stringify(payload)
    })
    
    const responseText = await response.text()
    let json

    try {
      json = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse response:', responseText)
      throw new Error(`API returned invalid JSON: ${responseText}`)
    }

    console.log('WhatsApp API Response:', { status: response.status, json })

    if (!response.ok) {
      const errorMessage = json?.message || json?.error?.message || response.statusText
      throw new Error(errorMessage || 'WhatsApp API request failed')
    }

    return json
  }

  const sendTestWhatsApp = async () => {
    if (!rmToken && (!rmUser || !rmPass)) { showMessage('watest', 'API key or username/password required.', false); return }
    if (!testWa || !/^\+\d{10,15}$/.test(testWa)) { showMessage('watest', 'Enter valid number with country code.', false); return }

    try {
      // Create a test record
      const testRec: RepairRecord = {
        doc_num: 'TEST001',
        customer_name: 'Test Customer',
        phone_number: testWa.replace(/^\+/, ''),
        item_type: 'Gold Ring',
        description: 'Test repair',
        estimated_cost: 1500,
        status: testTpl === 'received' ? 'received' : 'ready',
        master_id: null,
        notes: '',
        images: [],
        received_date: new Date().toISOString(),
        delivery_date: addDays(new Date(), 7).toISOString(),
        final_amount: testTpl === 'ready' ? 1600 : null,
        completed_date: testTpl === 'ready' ? new Date().toISOString() : null,
        // Legacy fields for compatibility
        docNum: 'TEST001',
        name: 'Test Customer',
        mobile: testWa.replace(/^\+/, ''),
        metal: 'Gold 22K',
        jewellery: 'Gold Ring',
        weight: '5.0',
        amount: 1500,
        salesman: 'Test Salesman',
        desc: 'Test repair',
        receivedDate: new Date().toISOString(),
        deliveryDate: addDays(new Date(), 7).toISOString(),
        finalAmount: testTpl === 'ready' ? 1600 : null,
        completedDate: testTpl === 'ready' ? new Date().toISOString() : null
      }

      await sendWhatsApp(testRec, testTpl as 'received' | 'final')
      showMessage('watest', `Test WhatsApp with invoice link sent to ${testWa}.`, true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send test WhatsApp message'
      showMessage('watest', `Test WhatsApp failed: ${message}`, false)
    }
  }

  // Save templates only (separate button for Message templates tab)
  const saveTemplatesOnly = async () => {
    console.log('💾 Saving templates...', { tpl1Name, tpl2Name, tpl3Name, tpl1Body, tpl2Body, tpl3Body });
    try {
      const response = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tpl1Name, tpl2Name, tpl3Name,
          tpl1Body: tpl1Body || null,
          tpl2Body: tpl2Body || null,
          tpl3Body: tpl3Body || null,
          tpl1Lang: tpl1Lang || 'en',
          tpl2Lang: tpl2Lang || 'en',
          tpl3Lang: tpl3Lang || 'en'
        })
      });
      
      if (response.ok) {
        showMessage('templates', '✅ Templates saved to database!', true);
        console.log('✅ Templates saved successfully');
      } else {
        const err = await response.json();
        showMessage('templates', 'Failed to save: ' + (err.error || 'unknown'), false);
        console.error('❌ Template save failed:', err);
      }
    } catch (err) {
      console.error('❌ Template save error:', err);
      showMessage('templates', 'Error: ' + err, false);
    }
  }

  // Master form fields
  const [msName, setMsName] = useState(''); const [msMob, setMsMob] = useState(''); const [msStatus, setMsStatus] = useState('active')
  const [mjName, setMjName] = useState(''); const [mjCat, setMjCat] = useState('Necklace'); const [mjStatus, setMjStatus] = useState('active')
  const [mmName, setMmName] = useState(''); const [mmType, setMmType] = useState('Gold'); const [mmKarat, setMmKarat] = useState(''); const [mmStatus, setMmStatus] = useState('active')
  const [mkName, setMkName] = useState(''); const [mkMob, setMkMob] = useState(''); const [mkSpec, setMkSpec] = useState(''); const [mkAddr, setMkAddr] = useState(''); const [mkStatus, setMkStatus] = useState('active')
  const [editMasterId, setEditMasterId] = useState<number | null>(null)

  // Load data from APIs on mount
  useEffect(() => {
    // Listen for messages from print window
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'thermalDone') {
        setPage('dashboard')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])
  
  // Fresh fetch from Supabase when navigating to Settings page => ensures instant sync across all devices
  useEffect(() => {
    console.log('📋 useEffect triggered. page =', page, 'settingsTab =', settingsTab);
    if (page !== 'settings') {
      console.log('⏭️ Not settings page, skipping fetch');
      return;
    }
    
    console.log('🔄 Fetching fresh settings from Supabase for Settings page...');
    
    const fetchFreshSettings = async () => {
      console.log('⚡ Fetching fresh settings from Supabase...');
      try {
        // Fetch settings directly from API (Supabase) - no localStorage
        const settingsRes = await fetch('/api/settings');
        console.log('📥 /api/settings response:', settingsRes.status, settingsRes.ok);
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          console.log('⚡ Settings loaded from DB:', JSON.stringify(settings, null, 2));
          
          // Update all state from database directly
          console.log('🔄 Setting state from DB:');
          if (settings.businessName) { console.log('  - setCfgShop:', settings.businessName); setCfgShop(settings.businessName); }
          if (settings.shopOwner) setCfgOwner(settings.shopOwner);
          if (settings.shopPhone) setCfgPhone(settings.shopPhone);
          if (settings.shopGst) setCfgGst(settings.shopGst);
          if (settings.shopCity) setCfgCity(settings.shopCity);
          if (settings.shopAddress) setCfgAddr(settings.shopAddress);
          if (settings.invoiceLinkBase) setCfgLinkBase(settings.invoiceLinkBase);
          if (settings.invoiceExpiry) setCfgExpiry(settings.invoiceExpiry);
          
          // WhatsApp settings - load from multiple possible sources for robustness
          if (settings.whatsappRmToken) setRmToken(settings.whatsappRmToken);
          else if (settings.whatsappApiKey) setRmToken(settings.whatsappApiKey);
          if (settings.whatsappRmApiUrl) setRmApiUrl(settings.whatsappRmApiUrl);
          else if (settings.whatsappApiUrl) setRmApiUrl(settings.whatsappApiUrl);
          if (settings.whatsappRmUser) setRmUser(settings.whatsappRmUser);
          if (settings.whatsappRmApiVersion) setRmApiver(settings.whatsappRmApiVersion);
          
          console.log('📱 WhatsApp settings loaded:', { 
            hasToken: !!settings.whatsappRmToken || !!settings.whatsappApiKey, 
            apiUrl: settings.whatsappRmApiUrl || settings.whatsappApiUrl 
          });
        }
        
        // Also fetch fresh templates
        const tplRes = await fetch('/api/settings/templates');
        if (tplRes.ok) {
          const tpl = await tplRes.json();
          if (tpl.tpl1Name) setTpl1Name(tpl.tpl1Name);
          if (tpl.tpl2Name) setTpl2Name(tpl.tpl2Name);
          if (tpl.tpl3Name) setTpl3Name(tpl.tpl3Name);
          if (tpl.tpl1Body) setTpl1Body(tpl.tpl1Body);
          if (tpl.tpl2Body) setTpl2Body(tpl.tpl2Body);
          if (tpl.tpl3Body) setTpl3Body(tpl.tpl3Body);
        }
        
        // Also fetch fresh masters for dropdowns
        const mastersRes = await fetch('/api/masters');
        if (mastersRes.ok) {
          const masters = await mastersRes.json();
          setSalesmen(masters.filter((m: any) => m.type === 'salesman'));
          setJewelleries(masters.filter((m: any) => m.type === 'jewellery'));
          setMetals(masters.filter((m: any) => m.type === 'metal'));
          setKaragirs(masters.filter((m: any) => m.type === 'karagir'));
        }
        
        console.log('⚡ All data refreshed from Supabase!');
      } catch (err) {
        console.error('Error fetching fresh settings:', err);
      }
    };
    
    fetchFreshSettings();
  }, [page]) // Runs whenever page changes to 'settings'
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // FIRST: Load settings from API (Supabase) - no localStorage delay
        // This ensures settings load instantly on any device
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          // Load all settings from database immediately
          if (settings.businessName) setCfgShop(settings.businessName);
          if (settings.shopOwner) setCfgOwner(settings.shopOwner);
          if (settings.shopPhone) setCfgPhone(settings.shopPhone);
          if (settings.shopGst) setCfgGst(settings.shopGst);
          if (settings.shopCity) setCfgCity(settings.shopCity);
          if (settings.shopAddress) setCfgAddr(settings.shopAddress);
          if (settings.invoiceLinkBase) setCfgLinkBase(settings.invoiceLinkBase);
          if (settings.invoiceExpiry) setCfgExpiry(settings.invoiceExpiry);
          
          // WhatsApp settings
          if (settings.whatsappRmToken) setRmToken(settings.whatsappRmToken);
          else if (settings.whatsappApiKey) setRmToken(settings.whatsappApiKey);
          if (settings.whatsappRmApiUrl) setRmApiUrl(settings.whatsappRmApiUrl);
          else if (settings.whatsappApiUrl) setRmApiUrl(settings.whatsappApiUrl);
          if (settings.whatsappRmUser) setRmUser(settings.whatsappRmUser);
          if (settings.whatsappRmPass) setRmPass(settings.whatsappRmPass);
          if (settings.whatsappRmWaba) setRmWaba(settings.whatsappRmWaba);
          if (settings.whatsappRmPhoneid) setRmPhoneid(settings.whatsappRmPhoneid);
          if (settings.whatsappRmWaphone) setRmWaphone(settings.whatsappRmWaphone);
          if (settings.whatsappRmApiVersion) setRmApiver(settings.whatsappRmApiVersion);
          
          console.log('📱 WhatsApp settings loaded (initial):', { 
            hasToken: !!settings.whatsappRmToken || !!settings.whatsappApiKey, 
            apiUrl: settings.whatsappRmApiUrl || settings.whatsappApiUrl 
          });
          
          // Also save to localStorage as backup after loading from DB
          if (settings.businessName) localStorage.setItem('devi-jewellers-cfgShop', settings.businessName);
          if (settings.shopOwner) localStorage.setItem('devi-jewellers-cfgOwner', settings.shopOwner);
          if (settings.shopPhone) localStorage.setItem('devi-jewellers-cfgPhone', settings.shopPhone);
          if (settings.shopGst) localStorage.setItem('devi-jewellers-cfgGst', settings.shopGst);
          if (settings.shopCity) localStorage.setItem('devi-jewellers-cfgCity', settings.shopCity);
          if (settings.shopAddress) localStorage.setItem('devi-jewellers-cfgAddr', settings.shopAddress);
          if (settings.invoiceLinkBase) localStorage.setItem('devi-jewellers-cfgLinkBase', settings.invoiceLinkBase);
        }

        // Load WhatsApp template settings from API (Supabase)
        try {
          const tplResponse = await fetch('/api/settings/templates');
          if (tplResponse.ok) {
            const tplSettings = await tplResponse.json();
            if (tplSettings.tpl1Name) {
              setTpl1Name(tplSettings.tpl1Name);
              localStorage.setItem('devi-jewellers-tpl1Name', tplSettings.tpl1Name);
            }
            if (tplSettings.tpl2Name) {
              setTpl2Name(tplSettings.tpl2Name);
              localStorage.setItem('devi-jewellers-tpl2Name', tplSettings.tpl2Name);
            }
            if (tplSettings.tpl3Name) {
              setTpl3Name(tplSettings.tpl3Name);
              localStorage.setItem('devi-jewellers-tpl3Name', tplSettings.tpl3Name);
            }
            if (tplSettings.tpl1Body) setTpl1Body(tplSettings.tpl1Body);
            if (tplSettings.tpl2Body) setTpl2Body(tplSettings.tpl2Body);
            if (tplSettings.tpl3Body) setTpl3Body(tplSettings.tpl3Body);
            if (tplSettings.tpl1Lang) setTpl1Lang(tplSettings.tpl1Lang);
            if (tplSettings.tpl2Lang) setTpl2Lang(tplSettings.tpl2Lang);
            if (tplSettings.tpl3Lang) setTpl3Lang(tplSettings.tpl3Lang);
          }
        } catch (e) {
          console.error('Error loading template settings:', e);
        }

        // SECOND: Load records from API (Supabase)
        const recordsResponse = await fetch('/api/records');
        if (recordsResponse.ok) {
          const dbRecords = await recordsResponse.json();
          setRecords(dbRecords.map(convertFromDB));
          
          // Update docSeq based on existing records (get max doc_num)
          if (dbRecords.length > 0) {
            const docNums = dbRecords.map((r: any) => {
              const match = String(r.doc_num || r.docNum || '').match(/JR(\d+)/);
              return match ? parseInt(match[1]) : 0;
            });
            const maxSeq = Math.max(...docNums);
            if (maxSeq > 0) setDocSeq(maxSeq);
          }
        }

        // Load masters from API (Supabase)
        const mastersResponse = await fetch('/api/masters');
        if (mastersResponse.ok) {
          const dbMasters = await mastersResponse.json();
          const salesmen = dbMasters.filter((m: any) => m.type === 'salesman').map(convertMasterFromDB);
          const jewelleries = dbMasters.filter((m: any) => m.type === 'jewellery').map(convertMasterFromDB);
          const metals = dbMasters.filter((m: any) => m.type === 'metal').map(convertMasterFromDB);
          const karagirs = dbMasters.filter((m: any) => m.type === 'karagir').map(convertMasterFromDB);
          setSalesmen(salesmen);
          setJewelleries(jewelleries);
          setMetals(metals);
          setKaragirs(karagirs);
        }

        // Load docSeq from localStorage as fallback
        const savedDocSeq = localStorage.getItem('devi-jewellers-docSeq');
        if (savedDocSeq) setDocSeq(parseInt(savedDocSeq));

      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage if APIs fail completely
        try {
          const savedRecords = localStorage.getItem('devi-jewellers-records');
          if (savedRecords) setRecords(JSON.parse(savedRecords));

          const savedDocSeq = localStorage.getItem('devi-jewellers-docSeq');
          if (savedDocSeq) setDocSeq(parseInt(savedDocSeq));

          const savedSalesmen = localStorage.getItem('devi-jewellers-salesmen');
          if (savedSalesmen) setSalesmen(JSON.parse(savedSalesmen));

          const savedJewelleries = localStorage.getItem('devi-jewellers-jewelleries');
          if (savedJewelleries) setJewelleries(JSON.parse(savedJewelleries));

          const savedMetals = localStorage.getItem('devi-jewellers-metals');
          if (savedMetals) setMetals(JSON.parse(savedMetals));

          const savedKaragirs = localStorage.getItem('devi-jewellers-karagirs');
          if (savedKaragirs) setKaragirs(JSON.parse(savedKaragirs));
        } catch (fallbackError) {
          console.error('Error loading fallback data:', fallbackError);
        }
      }
    };

    loadData();
  }, []);

  // Save records to API whenever records change
  useEffect(() => {
    const saveRecords = async () => {
      if (records.length === 0) return; // Don't save empty array on initial load
      try {
        // For now, we'll save to localStorage as backup and plan to migrate existing data
        localStorage.setItem('devi-jewellers-records', JSON.stringify(records));
        // TODO: Implement API sync for records
      } catch (error) {
        console.error('Error saving records:', error);
      }
    };
    saveRecords();
  }, [records]);

  // Save docSeq to localStorage (keeping for now)
  useEffect(() => { localStorage.setItem('devi-jewellers-docSeq', docSeq.toString()) }, [docSeq])
  useEffect(() => { localStorage.setItem('devi-jewellers-salesmen', JSON.stringify(salesmen)) }, [salesmen])
  useEffect(() => { localStorage.setItem('devi-jewellers-jewelleries', JSON.stringify(jewelleries)) }, [jewelleries])
  useEffect(() => { localStorage.setItem('devi-jewellers-metals', JSON.stringify(metals)) }, [metals])
  useEffect(() => { localStorage.setItem('devi-jewellers-karagirs', JSON.stringify(karagirs)) }, [karagirs])

  // Settings persistence
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgShop', cfgShop) }, [cfgShop])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgOwner', cfgOwner) }, [cfgOwner])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgPhone', cfgPhone) }, [cfgPhone])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgGst', cfgGst) }, [cfgGst])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgCity', cfgCity) }, [cfgCity])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgAddr', cfgAddr) }, [cfgAddr])

  // WhatsApp settings persistence
  useEffect(() => { localStorage.setItem('devi-jewellers-rmUser', rmUser) }, [rmUser])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmPass', rmPass) }, [rmPass])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmWaba', rmWaba) }, [rmWaba])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmPhoneid', rmPhoneid) }, [rmPhoneid])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmWaphone', rmWaphone) }, [rmWaphone])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmToken', rmToken) }, [rmToken])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmApiUrl', rmApiUrl) }, [rmApiUrl])
  useEffect(() => { localStorage.setItem('devi-jewellers-rmApiver', rmApiver) }, [rmApiver])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgLinkBase', cfgLinkBase) }, [cfgLinkBase])
  useEffect(() => { localStorage.setItem('devi-jewellers-cfgExpiry', cfgExpiry.toString()) }, [cfgExpiry])
  useEffect(() => { localStorage.setItem('devi-jewellers-tpl1Name', tpl1Name) }, [tpl1Name])
  useEffect(() => { localStorage.setItem('devi-jewellers-tpl2Name', tpl2Name) }, [tpl2Name])
  useEffect(() => { localStorage.setItem('devi-jewellers-tpl3Name', tpl3Name) }, [tpl3Name])
  useEffect(() => { localStorage.setItem('devi-jewellers-trRecv', trRecv.toString()) }, [trRecv])
  useEffect(() => { localStorage.setItem('devi-jewellers-trReady', trReady.toString()) }, [trReady])
  useEffect(() => { localStorage.setItem('devi-jewellers-trKaragir', trKaragir.toString()) }, [trKaragir])

  const showMessage = useCallback((id: string, text: string, ok: boolean) => {
    setMsg(m => ({ ...m, [id]: { text, ok } }))
    setTimeout(() => setMsg(m => { const n = { ...m }; delete n[id]; return n }), 4500)
  }, [])

  const openPage = (p: string) => { setPage(p); window.scrollTo(0, 0) }
  const goBack = () => { setPage('dashboard'); window.scrollTo(0, 0) }

  const stats = {
    total: records.length,
    pending: records.filter(r => r.status === 'received' || r.status === 'with_karagir').length,
    ready: records.filter(r => r.status === 'ready').length,
    overdue: records.filter(r => effStatus(r) === 'overdue').length,
  }

  /* ── Save Receipt ── */
  const saveReceipt = async (): Promise<RepairRecord | null> => {
    if (!rName || !rMobile || !rMetal || !rType || !rWeight || !rDays || !rAmount || !rSalesman) { showMessage('receive', 'Please fill all required fields.', false); return null }
    if (!/^\d{10}$/.test(rMobile)) { showMessage('receive', 'Enter valid 10-digit mobile.', false); return null }

    try {
      const seq = docSeq + 1;
      const docNum = 'JR' + String(seq).padStart(4, '0');
      const receivedDate = new Date().toISOString();
      const deliveryDate = addDays(receivedDate, parseInt(rDays)).toISOString();

      const recordData = {
        doc_num: docNum,
        customer_name: rName,
        phone_number: rMobile,
        item_type: rType,
        description: rDesc || '',
        estimated_cost: parseFloat(rAmount),
        status: 'received',
        master_id: null, // Will be set when assigned to karagir
        notes: '',
        images: [],
        received_date: receivedDate,
        delivery_date: deliveryDate,
        metal: rMetal,
        weight: rWeight,
        salesman: rSalesman,
      };

      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save record');
      }

      const savedRecord = await response.json();
      setRecords(prev => [...prev, convertFromDB(savedRecord)]);
      setDocSeq(seq);
      setSavedRec(convertFromDB(savedRecord));
      showMessage('receive', `Saved! Document: ${docNum}`, true);
      return convertFromDB(savedRecord);
    } catch (error) {
      console.error('Error saving receipt:', error);
      showMessage('receive', 'Failed to save receipt. Please try again.', false);
      return null;
    }
  }

  /* ── Edit Receipt ── */
  const startEdit = (record: RepairRecord) => {
    setIsEditing(true);
    setEditingRecord(record);
    setRName(record.name || record.customer_name || '');
    setRMobile(record.mobile || record.phone_number || '');
    setRMetal(record.metal || '');
    setRType(record.jewellery || record.item_type || '');
    setRWeight(record.weight || '');
    setRDays(record.deliveryDate ? Math.ceil((new Date(record.deliveryDate).getTime() - new Date(record.receivedDate || record.received_date || new Date()).getTime()) / (1000 * 60 * 60 * 24)).toString() : '7');
    setRAmount((record.amount || record.estimated_cost || 0).toString());
    setRSalesman(record.salesman || '');
    setRDesc(record.desc || record.description || '');
    setPage('receive');
  }

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingRecord(null);
    setRName(''); setRMobile(''); setRMetal(''); setRType(''); setRWeight(''); setRDays(''); setRAmount(''); setRSalesman(''); setRDesc('');
  }

  const updateReceipt = async () => {
    if (!editingRecord) return;
    if (!rName || !rMobile || !rMetal || !rType || !rWeight || !rDays || !rAmount || !rSalesman) { showMessage('receive', 'Please fill all required fields.', false); return }
    if (!/^\d{10}$/.test(rMobile)) { showMessage('receive', 'Enter valid 10-digit mobile.', false); return }

    try {
      const deliveryDate = addDays(new Date(editingRecord.receivedDate || editingRecord.received_date || new Date()), parseInt(rDays)).toISOString();

      const updateData = {
        id: editingRecord.id,
        doc_num: editingRecord.docNum || editingRecord.doc_num,
        customer_name: rName,
        phone_number: rMobile,
        item_type: rType,
        description: rDesc || '',
        estimated_cost: parseFloat(rAmount),
        status: editingRecord.status,
        master_id: editingRecord.master_id,
        notes: editingRecord.notes || '',
        images: editingRecord.images || [],
        karagir: editingRecord.karagir,
        karagir_date: editingRecord.karagirDate || editingRecord.karagir_date,
        final_amount: editingRecord.finalAmount || editingRecord.final_amount,
        completed_date: editingRecord.completedDate || editingRecord.completed_date,
        quality: editingRecord.quality,
        received_date: editingRecord.receivedDate || editingRecord.received_date,
        delivery_date: deliveryDate,
        metal: rMetal,
        weight: rWeight,
        salesman: rSalesman,
      };

      const response = await fetch('/api/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update record');
      }

      const updatedRecord = await response.json();
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? convertFromDB(updatedRecord) : r));
      setSavedRec(convertFromDB(updatedRecord));
      setIsEditing(false);
      setEditingRecord(null);
      showMessage('receive', `Updated! Document: ${updatedRecord.doc_num}`, true);
    } catch (error) {
      console.error('Error updating receipt:', error);
      showMessage('receive', 'Failed to update receipt. Please try again.', false);
    }
  }

  const loadRecordForEdit = (r: RepairRecord) => {
    setIsEditing(true);
    setEditingRecord(r);
    setRName(r.name || r.customer_name || '');
    setRMobile(r.mobile || r.phone_number || '');
    setRMetal(r.metal || '');
    setRType(r.jewellery || r.item_type || '');
    setRWeight(r.weight || '');
    const days = r.deliveryDate && r.receivedDate ? Math.ceil((new Date(r.deliveryDate).getTime() - new Date(r.receivedDate).getTime()) / (1000 * 60 * 60 * 24)) : r.delivery_date && r.received_date ? Math.ceil((new Date(r.delivery_date).getTime() - new Date(r.received_date).getTime()) / (1000 * 60 * 60 * 24)) : 7;
    setRDays(String(days));
    setRAmount(String(r.amount || r.estimated_cost || ''));
    setRSalesman(r.salesman || '');
    setRDesc(r.description || r.desc || '');
    setSavedRec(r);
    setPage('receive');
  }

  const deleteRecord = async (docNum: string) => {
    if (!confirm(`Delete record ${docNum}? This cannot be undone.`)) return;
    try {
      const response = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_num: docNum }),
      });
      if (!response.ok) throw new Error('Failed to delete');
      setRecords(prev => prev.filter(r => (r.docNum || r.doc_num) !== docNum));
      showMessage('records', 'Record deleted.', true);
    } catch (error) {
      console.error('Error deleting record:', error);
      showMessage('records', 'Failed to delete record.', false);
    }
  }

  /* ── Karagir Out ── */
  const koRecord = records.find(r => r.docNum === koDoc)
  const saveKO = async () => {
    if (!koDoc || !koKaragir) { showMessage('ko', 'Select document and karagir.', false); return }

    try {
      const karagirMaster = karagirs.find(k => k.name === koKaragir);
      if (!karagirMaster) {
        showMessage('ko', 'Selected karagir not found.', false);
        return;
      }

      // Update local state
      setRecords(prev => prev.map(r => r.docNum === koDoc ? {
        ...r,
        karagir: koKaragir,
        karagirDate: koEditing && r.karagirDate ? r.karagirDate : new Date().toISOString(),
        status: 'with_karagir',
        master_id: karagirMaster.id,
        notes: koNotes || r.notes || ''
      } : r));

      // Save to database
      try {
        const response = await fetch('/api/records', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doc_num: koDoc,
            karagir: koKaragir,
            karagir_date: new Date().toISOString(),
            status: 'with_karagir',
            master_id: karagirMaster.id,
            notes: koNotes || ''
          })
        });
        if (!response.ok) console.error('Failed to save karagir to DB', response.status);
      } catch (e) { console.error('Error saving karagir to DB:', e); }

      showMessage('ko', koEditing ? `Updated: ${koDoc} → ${koKaragir}` : `Issued to ${koKaragir} for ${koDoc}`, true);
      setKoDoc(''); setKoLoaded(false); setKoKaragir(''); setKoNotes(''); setKoEditing(false);
      if (koEditing) { setPage('dashboard'); }
    } catch (error) {
      console.error('Error saving karagir out:', error);
      showMessage('ko', 'Failed to update record.', false);
    }
  }

  /* ── Karagir In ── */
  const kiRecord = records.find(r => r.docNum === kiDoc)
  const saveKI = async (): Promise<RepairRecord | null> => {
    if (!kiDoc || !kiAmount) { showMessage('ki', 'Enter final amount.', false); return null }

    try {
      const existing = records.find(r => r.docNum === kiDoc)
      const updated = records.map(r => r.docNum === kiDoc ? {
        ...r,
        finalAmount: parseFloat(kiAmount),
        completedDate: kiEditing && r.completedDate ? r.completedDate : new Date().toISOString(),
        quality: kiQuality,
        status: 'ready',
        final_amount: parseFloat(kiAmount),
        completed_date: kiEditing && r.completed_date ? r.completed_date : new Date().toISOString()
      } : r);

      setRecords(updated);
      setFinalRec(updated.find(r => r.docNum === kiDoc) || null);

      // Save to database
      try {
        const response = await fetch('/api/records', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doc_num: kiDoc,
            final_amount: parseFloat(kiAmount),
            completed_date: new Date().toISOString(),
            quality: kiQuality,
            status: 'ready'
          })
        });
        if (!response.ok) console.error('Failed to save final amount to DB', response.status);
      } catch (e) { console.error('Error saving final amount to DB:', e); }

      showMessage('ki', kiEditing ? `Updated final amount for ${kiDoc}` : `Updated! Final invoice generated for ${kiDoc}`, true);
      setKiDoc(''); setKiLoaded(false); setKiAmount(''); setKiEditing(false);
      if (kiEditing) { if (finalRec) { setPrintRec(null); } setPage('dashboard'); return null; }
      return updated.find(r => r.docNum === kiDoc) || null;
    } catch (error) {
      console.error('Error saving karagir in:', error);
      showMessage('ki', 'Failed to update record.', false);
      return null;
    }
  }

  /* ── Track ── */
  const doTrack = () => {
    const q = trackQ.trim().toLowerCase()
    if (!q) return
    setShowAll(false)
    setTrackResults(records.filter(r => (r.docNum || r.doc_num || '').toLowerCase() === q || (r.mobile || r.phone_number) === q || (r.docNum || r.doc_num || '').toLowerCase().includes(q)))
  }

  /* ── Masters ── */
  const idSeq = { salesman: salesmen.length + 10, jewellery: jewelleries.length + 10, metal: metals.length + 10, karagir: karagirs.length + 10 }
  const addMaster = async (type: string) => {
    try {
      let masterData: any = {};

      if (type === 'salesman') {
        if (!msName.trim()) { showMessage('master-salesman', 'Name required.', false); return }
        masterData = {
          id: editMasterId || undefined,
          name: msName.trim(),
          phone_number: msMob.trim(),
          type: 'salesman',
          is_active: true // Always save as active
        };
      } else if (type === 'jewellery') {
        if (!mjName.trim()) { showMessage('master-jewellery', 'Name required.', false); return }
        masterData = {
          id: editMasterId || undefined,
          name: mjName.trim(),
          category: mjCat,
          type: 'jewellery',
          is_active: true // Always save as active
        };
      } else if (type === 'metal') {
        if (!mmName.trim()) { showMessage('master-metal', 'Name required.', false); return }
        masterData = {
          id: editMasterId || undefined,
          name: mmName.trim(),
          type: 'metal',
          karat: mmKarat.trim(),
          is_active: true // Always save as active
        };
      } else if (type === 'karagir') {
        if (!mkName.trim() || !mkMob.trim()) { showMessage('master-karagir', 'Name and mobile required.', false); return }
        if (!/^\d{10}$/.test(mkMob)) { showMessage('master-karagir', 'Valid 10-digit mobile required.', false); return }
        masterData = {
          id: editMasterId || undefined,
          name: mkName.trim(),
          phone_number: mkMob.trim(),
          specialty: mkSpec.trim(),
          address: mkAddr.trim(),
          type: 'karagir',
          is_active: true // Always save as active
        };
      }

      const method = editMasterId ? 'PUT' : 'POST';
      const response = await fetch('/api/masters', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterData),
      });

      if (!response.ok) {
        throw new Error('Failed to save master');
      }

      const savedMaster = await response.json();
      const masterObj = convertMasterFromDB(savedMaster);

      // Update local state
      if (type === 'salesman') {
        if (editMasterId) {
          setSalesmen(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-salesman', 'Updated.', true);
        } else {
          setSalesmen(p => [...p, masterObj]);
          showMessage('master-salesman', 'Added.', true);
        }
        // Keep form values as they are (don't reset status)
        setMsName(''); setMsMob('');
      } else if (type === 'jewellery') {
        if (editMasterId) {
          setJewelleries(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-jewellery', 'Updated.', true);
        } else {
          setJewelleries(p => [...p, masterObj]);
          showMessage('master-jewellery', 'Added.', true);
        }
        setMjName(''); // Keep status as selected
      } else if (type === 'metal') {
        if (editMasterId) {
          setMetals(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-metal', 'Updated.', true);
        } else {
          setMetals(p => [...p, masterObj]);
          showMessage('master-metal', 'Added.', true);
        }
        setMmName(''); setMmKarat(''); // Keep status as selected
      } else if (type === 'karagir') {
        if (editMasterId) {
          setKaragirs(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-karagir', 'Updated.', true);
        } else {
          setKaragirs(p => [...p, masterObj]);
          showMessage('master-karagir', 'Added.', true);
        }
        setMkName(''); setMkMob(''); setMkSpec(''); setMkAddr(''); // Keep status as selected
      }
      setEditMasterId(null);
    } catch (error) {
      console.error('Error saving master:', error);
      showMessage(`master-${type}`, 'Failed to save master.', false);
    }
  }

  const editMaster = (master: { id?: number; name?: string; mob?: string; mobile?: string; category?: string; cat?: string; karat?: string; spec?: string; specialty?: string; address?: string; status?: string; type?: string }) => {
    if (!master.id) return;
    setEditMasterId(master.id);
    if (master.type === 'salesman') {
      setMsName(master.name || '');
      setMsMob(master.mob || master.mobile || '');
      setMsStatus(master.status || 'active');
    } else if (master.type === 'jewellery') {
      setMjName(master.name || '');
      setMjCat(master.category || master.cat || 'Necklace');
      setMjStatus(master.status || 'active');
    } else if (master.type === 'metal') {
      setMmName(master.name || '');
      setMmKarat(master.karat || '');
      setMmStatus(master.status || 'active');
    } else if (master.type === 'karagir') {
      setMkName(master.name || '');
      setMkMob(master.mob || master.mobile || '');
      setMkSpec(master.specialty || master.spec || '');
      setMkAddr(master.address || '');
      setMkStatus(master.status || 'active');
    }
  }

  const cancelEditMaster = () => {
    setEditMasterId(null);
    setMsName(''); setMsMob(''); setMsStatus('active');
    setMjName(''); setMjStatus('active');
    setMmName(''); setMmKarat(''); setMmStatus('active');
    setMkName(''); setMkMob(''); setMkSpec(''); setMkAddr(''); setMkStatus('active');
  }

  /* ── Tracker card ── */
  const TrackerCard = ({ r }: { r: RepairRecord }) => {
    const es = effStatus(r)
    const daysLeft = Math.ceil((new Date(r.deliveryDate || addDays(new Date(), 7).toISOString()).getTime() - Date.now()) / 86400000)
    const daysText = es === 'ready' ? 'Completed' : es === 'overdue' ? `${Math.abs(daysLeft)} day(s) overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} day(s) left`
    const steps = [
      { label: 'Jewellery received', sub: `${r.jewellery || r.item_type} · ${r.metal} · Est &#8377;${r.amount || r.estimated_cost}`, date: r.receivedDate || r.received_date, done: true },
      { label: r.karagir ? `Issued to karagir — ${r.karagir}` : 'Issued to karagir', sub: r.karagir ? 'In repair' : 'Pending', date: r.karagirDate || r.karagir_date, done: !!r.karagir },
      { label: 'Received from karagir', sub: r.finalAmount || r.final_amount ? `Final: &#8377;${r.finalAmount || r.final_amount}` : 'Awaiting', date: r.completedDate || r.completed_date, done: !!(r.completedDate || r.completed_date) },
      { label: 'Ready for delivery', sub: r.finalAmount || r.final_amount ? `Charges: &#8377;${r.finalAmount || r.final_amount}` : 'Pending', date: r.completedDate || r.completed_date, done: r.status === 'ready' },
    ]
    const ai = steps.filter(s => s.done).length
    return (
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div><div style={{ fontSize: 17, fontWeight: 700 }}>{r.docNum || r.doc_num}</div><div style={{ fontSize: 12, color: 'var(--text2)' }}>{r.name || r.customer_name} | {r.mobile || r.phone_number}</div></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-sm" onClick={() => startEdit(r)} title="Edit record">✏️ Edit</button>
            <span className={`badge ${bdgCls[es]}`}>{bdgLbl[es]}</span>
          </div>
        </div>
        <div className={`status-bar ${sbCls[es]}`}>{sbLbl[es]}</div>
        <div className="meta-grid">
          <div className="meta-item"><div className="meta-label">Item</div><div className="meta-val">{r.jewellery || r.item_type}</div></div>
          <div className="meta-item"><div className="meta-label">Est. delivery</div><div className="meta-val">{fmtDate(r.deliveryDate || r.delivery_date || addDays(new Date(), 7).toISOString())}</div></div>
          <div className="meta-item"><div className="meta-label">Status</div><div className="meta-val" style={{ color: es === 'overdue' ? '#A32D2D' : es === 'ready' ? '#3B6D11' : 'var(--text)' }}>{daysText}</div></div>
        </div>
        <div className="sec-label">Timeline</div>
        <div className="tl-wrap">
          <div className="tl-line" />
          {steps.map((s, i) => (
            <div key={i} className="tl-step">
              <div className={`tl-dot ${s.done ? 'done' : i === ai ? 'cur' : ''}`} />
              <div className="tl-title" style={{ color: s.done ? 'var(--text)' : 'var(--text2)' }}>{s.label}</div>
              <div className="tl-sub">{s.sub}</div>
              {s.date && <div className="tl-date">{fmtFull(s.date)}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* DEBUG LINE */
  const grp: any = {}
  // @ts-ignore
  grp.overdue = records.filter(r => effStatus(r) === 'overdue')
  // @ts-ignore
  grp.ready = records.filter(r => effStatus(r) === 'ready')
  // @ts-ignore
  grp.with_karagir = records.filter(r => effStatus(r) === 'with_karagir')
  // @ts-ignore
  grp.received = records.filter(r => effStatus(r) === 'received')

  return (
    <div className="app">
      {/* HEADER */}
      <div className="header">
        <div className="header-top">
          <div className="icon-box"><img src="/icon.png" alt="Devi Jewellers" /></div>
          <div className="header-text">
            <div className="shop-name">देवी ज्वेलर्स — Devi Jewellers</div>
            <div className="shop-sub">Jewellery Repair Management System</div>
            <div className="shop-tag">अनमोल क्षणांचे सोनेरी साक्षीदार</div>
          </div>
        </div>
        <div className="header-strip">
          <span>GOLD</span><span className="sep">|</span><span>SILVER</span><span className="sep">|</span><span>DIAMONDS</span><span className="sep">|</span><span>PEARLS</span>
        </div>
      </div>

      {/* ── THERMAL PRINT PREVIEW ── */}
      {printRec && (
        <div className="page active">
          <div className="card">
            <div className="card-title">🖨️ Thermal Print Preview</div>
            <div className="thermal-preview">
              <div className="shop-name">{cfgShop || 'Devi Jewellers'}</div>
              <div className="shop-addr">{cfgAddr || 'Nashik, Maharashtra'}</div>
              <div className="divider"></div>
              <div className="title">{printRec.type === 'final' ? 'FINAL INVOICE' : 'REPAIR RECEIPT'}</div>
              <div className="divider"></div>
              <div className="row"><span className="label">Doc No:</span><span className="value">{printRec.rec.docNum || printRec.rec.doc_num || ''}</span></div>
              <div className="row"><span className="label">Date:</span><span className="value">{fmtDate(printRec.rec.receivedDate || printRec.rec.created_at || new Date().toISOString())}</span></div>
              <div className="row"><span className="label">Customer:</span><span className="value">{printRec.rec.name || printRec.rec.customer_name || ''}</span></div>
              <div className="row"><span className="label">Mobile:</span><span className="value">{printRec.rec.mobile || ''}</span></div>
              <div className="divider"></div>
              <div className="row"><span className="label">Item:</span><span className="value">{printRec.rec.jewellery || printRec.rec.item_type || ''}</span></div>
              <div className="row"><span className="label">Metal:</span><span className="value">{printRec.rec.metal || ''}</span></div>
              <div className="divider"></div>
              {printRec.type === 'final' ? (
                <>
                  <div className="row"><span className="label">Estimated:</span><span className="value">Rs {printRec.rec.amount || 0}</span></div>
                  <div className="row bold big"><span className="label">Final:</span><span className="value">Rs {printRec.rec.finalAmount || printRec.rec.final_amount || 0}</span></div>
                </>
              ) : (
                <div className="row bold big"><span className="label">Estimated:</span><span className="value">Rs {printRec.rec.amount || printRec.rec.estimated_cost || 0}</span></div>
              )}
              <div className="divider"></div>
              <div className="footer">Thank you for trusting us!</div>
            </div>
            <div className="btn-row" style={{ marginTop: '15px' }}>
              <button className="btn btn-primary" onClick={() => { if (printRec) { const rec = printRec.rec; const type = printRec.type; const shopName = cfgShop || 'Devi Jewellers'; const address = cfgAddr || 'Nashik, Maharashtra'; const isFinal = type === 'final'; const docNo = rec.docNum || rec.doc_num || ''; const dateVal = fmtDate(rec.receivedDate || rec.created_at || new Date().toISOString()); const customer = rec.name || rec.customer_name || ''; const mobile = rec.mobile || ''; const item = rec.jewellery || rec.item_type || ''; const metal = rec.metal || ''; const amount = rec.amount || rec.estimated_cost || 0; const finalAmount = rec.finalAmount || rec.final_amount || 0; const printContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print Receipt</title><style>*{box-sizing:border-box;margin:0;padding:0}@page{size:76mm 150mm;margin:0}html,body{width:72mm;margin:0;padding:1mm;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.2;color:#000;background:#fff;-webkit-font-smoothing:none}.header{text-align:center;font-weight:900;font-size:18px;margin-bottom:2px;color:#000}.address{text-align:center;font-weight:bold;font-size:10px;margin-bottom:4px;color:#000}.divider{border-top:2px solid #000;margin:4px 0}.title{text-align:center;font-weight:900;font-size:16px;margin:4px 0;color:#000}.row{display:flex;justify-content:space-between;padding:2px 0;color:#000;font-weight:bold}.label{color:#000;font-weight:bold}.value{font-weight:900;color:#000}.bold{font-weight:900}.big{font-size:16px}.footer{text-align:center;font-weight:bold;font-size:10px;margin-top:5px;color:#000}</style></head><body><div class="header">${shopName}</div><div class="address">${address}</div><div class="divider"></div><div class="title">${isFinal ? 'FINAL INVOICE' : 'REPAIR RECEIPT'}</div><div class="divider"></div><div class="row"><span class="label">Doc No:</span><span class="value">${docNo}</span></div><div class="row"><span class="label">Date:</span><span class="value">${dateVal}</span></div><div class="row"><span class="label">Customer:</span><span class="value">${customer}</span></div><div class="row"><span class="label">Mobile:</span><span class="value">${mobile}</span></div><div class="divider"></div><div class="row"><span class="label">Item:</span><span class="value">${item}</span></div><div class="row"><span class="label">Metal:</span><span class="value">${metal}</span></div><div class="divider"></div>${isFinal ? `<div class="row"><span class="label">Estimated:</span><span class="value">Rs ${amount}</span></div><div class="row bold big"><span class="label">Final:</span><span class="value">Rs ${finalAmount}</span></div>` : `<div class="row bold big"><span class="label">Estimated:</span><span class="value">Rs ${amount}</span></div>`}<div class="divider"></div><div class="footer">Thank you for trusting us!</div><script>window.onload=function(){window.print();window.close()}</script></body></html>`; const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(printContent); printWindow.document.close(); } setPrintRec(null); setPage('dashboard') } }}>🖨️ Print</button>
              <button className="btn" style={{ backgroundColor: '#25D366', color: 'white' }} onClick={async () => { if (printRec) { try { await sendWhatsApp(printRec.rec, printRec.type); alert('WhatsApp sent!'); } catch { alert('Failed to send WhatsApp'); } } }}>💬 WhatsApp</button>
              <button className="btn" onClick={() => setPrintRec(null)}>🔙 Return to Dashboard</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      <div className={`page ${page === 'dashboard' ? 'active' : ''}`}>
        <div className="stats-row">
          <div className="stat-card"><div className="stat-label">Total orders</div><div className="stat-val">{stats.total}</div><div className="stat-sub">all time</div></div>
          <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-val" style={{ color: '#BA7517' }}>{stats.pending}</div><div className="stat-sub">in progress</div></div>
          <div className="stat-card"><div className="stat-label">Ready</div><div className="stat-val" style={{ color: '#3B6D11' }}>{stats.ready}</div><div className="stat-sub">for delivery</div></div>
          <div className="stat-card"><div className="stat-label">Overdue</div><div className="stat-val" style={{ color: '#A32D2D' }}>{stats.overdue}</div><div className="stat-sub">past est. date</div></div>
        </div>
        <div className="dash-grid">
          <div className="dash-tile" onClick={() => openPage('receive')}>
            <div className="tile-icon" style={{ background: '#FEE2E2' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c0003a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7-7 7 7" /><rect x="3" y="17" width="18" height="4" rx="1" /></svg></div>
            <div className="tile-label">Receive from Customer</div>
            <div className="tile-desc">Accept jewellery, generate receipt &amp; invoice PDF</div>
          </div>
          <div className="dash-tile" onClick={() => openPage('karagir-out')}>
            <div className="tile-icon" style={{ background: '#DBEAFE' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4" /><path d="M16 11l2 2 4-4" /></svg></div>
            <div className="tile-label">Give to Karagir</div>
            <div className="tile-desc">Issue jewellery for repair</div>
          </div>
          <div className="dash-tile" onClick={() => openPage('karagir-in')}>
            <div className="tile-icon" style={{ background: '#D1FAE5' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7 7 7-7" /><rect x="3" y="3" width="18" height="4" rx="1" /></svg></div>
            <div className="tile-label">Receive from Karagir</div>
            <div className="tile-desc">Collect repaired, send final invoice</div>
          </div>
          <div className="dash-tile" onClick={() => openPage('track')}>
            <div className="tile-icon" style={{ background: '#EDE9FE' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v3l2 2" /></svg></div>
            <div className="tile-label">Track Order</div>
            <div className="tile-desc">Search by doc number or mobile</div>
          </div>
          <div className="dash-tile" onClick={() => openPage('records')}>
            <div className="tile-icon" style={{ background: '#FEF3C7' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg></div>
            <div className="tile-label">All Records</div>
            <div className="tile-desc">View complete repair history</div>
          </div>
          <div className="dash-tile" onClick={() => openPage('masters')}>
            <div className="tile-icon" style={{ background: '#FCE7F3' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#993556" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg></div>
            <div className="tile-label">Masters</div>
            <div className="tile-desc">Salesman, jewellery, metal, karagir</div>
          </div>
          <div className="dash-tile" onClick={() => openPage('deliver')}>
            <div className="tile-icon" style={{ background: '#DCFCE7' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
            <div className="tile-label">Deliver to Customer</div>
            <div className="tile-desc">Deliver jewellery &amp; send OTP on WhatsApp</div>
          </div>
          <div className="dash-tile tile-wide" onClick={() => openPage('settings')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' }}>
              <div className="tile-icon" style={{ background: '#F0FDF4', flexShrink: 0 }}><IcWA size={28} color="#25D366" /></div>
              <div style={{ textAlign: 'left' }}>
                <div className="tile-label">Settings &amp; WhatsApp API</div>
                <div className="tile-desc">Shop info, Route Mobile config, invoice PDF &amp; templates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DELIVER TO CUSTOMER ── */}
      <div className={`page ${page === 'deliver' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title">📦 Deliver to Customer</div>
          
          {(!deliverSelected || !deliverDoc) && (
            <>
              <div className="field">
                <label>Select Invoice <span className="req">*</span></label>
                <select value={deliverDoc || ''} onChange={e => setDeliverDoc(e.target.value)}>
                  <option value="">Select ready invoice</option>
                  {records.filter(r => r.status === 'ready').map((r: RepairRecord) => (
                    <option key={r.docNum || r.doc_num} value={r.docNum || r.doc_num}>
                      {r.docNum || r.doc_num} — {r.name || r.customer_name} ({r.jewellery || r.item_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => { const rec = records.find(r => (r.docNum || r.doc_num) === deliverDoc); if (rec) { setDeliverRec(rec); setDeliverSelected(true); } else showMessage('deliver', 'Select an invoice first.', false) }}>Load Invoice</button>
              </div>
            </>
          )}
          
          {deliverSelected && deliverRec && (
            <>
              <div className="details-box">
                <div className="detail-row"><span className="detail-label">Doc No:</span><span className="detail-value">{deliverRec.docNum || deliverRec.doc_num}</span></div>
                <div className="detail-row"><span className="detail-label">Customer:</span><span className="detail-value">{deliverRec.name || deliverRec.customer_name}</span></div>
                <div className="detail-row"><span className="detail-label">Mobile:</span><span className="detail-value">{deliverRec.mobile || deliverRec.phone_number}</span></div>
                <div className="detail-row"><span className="detail-label">Item:</span><span className="detail-value">{deliverRec.jewellery || deliverRec.item_type}</span></div>
                <div className="detail-row"><span className="detail-label">Metal:</span><span className="detail-value">{deliverRec.metal}</span></div>
                <div className="detail-row"><span className="detail-label">Weight:</span><span className="detail-value">{deliverRec.weight} g</span></div>
                <div className="detail-row"><span className="detail-label">Final Amount:</span><span className="detail-value">&#8377; {deliverRec.finalAmount || deliverRec.final_amount}</span></div>
                <div className="detail-row"><span className="detail-label">Received:</span><span className="detail-value">{deliverRec.receivedDate ? fmtDate(deliverRec.receivedDate) : '-'}</span></div>
                <div className="detail-row"><span className="detail-label">Ready:</span><span className="detail-value">{deliverRec.completedDate ? fmtDate(deliverRec.completedDate) : '-'}</span></div>
              </div>
              
              {!deliverOtpSent && (
                <div className="btn-row">
                  <button className="btn" onClick={() => { setDeliverDoc(''); setDeliverRec(null); setDeliverSelected(false); setDeliverOtpSent(false); setDeliverOtpVerified(false); setDeliverOtp(''); }}>Change Invoice</button>
                  <button className="btn btn-wa" onClick={deliverSendOtp}>Send OTP</button>
                </div>
              )}
              
              {deliverOtpSent && !deliverOtpVerified && (
                <>
                  <div className="divider" />
                  <div className="field">
                    <label>Enter OTP <span className="req">*</span></label>
                    <input type="text" value={deliverOtpInput} onChange={e => setDeliverOtpInput(e.target.value)} placeholder="Enter 4-digit OTP" maxLength={4} style={{ letterSpacing: '0.3em', fontSize: '18px' }} />
                  </div>
                  <div className="btn-row">
                    <button className="btn" onClick={() => { setDeliverOtpSent(false); setDeliverOtp(''); setDeliverOtpInput(''); }}>Resend OTP</button>
                    <button className="btn btn-primary" onClick={() => { if (deliverOtpInput === deliverOtp) { setDeliverOtpVerified(true); showMessage('deliver', 'OTP Verified!', true); } else { showMessage('deliver', 'Invalid OTP', false); } }}>Verify OTP</button>
                  </div>
                </>
              )}
              
              {deliverOtpVerified && (
                <>
                  <div className="divider" />
                  <div className="success-box">✅ OTP Verified! Ready for delivery.</div>
                  <div className="btn-row">
                    <button className="btn" onClick={() => { setDeliverOtpSent(false); setDeliverOtpVerified(false); setDeliverOtp(''); setDeliverOtpInput(''); }}>Change Invoice</button>
                    <button className="btn btn-primary" onClick={async () => { 
                          printThermalReceipt(deliverRec, 'final', cfgShop || 'Devi Jewellers', cfgAddr || '');
                          // Update local state
                          setRecords((prev: RepairRecord[]) => prev.map((r: RepairRecord) => (r.docNum || r.doc_num) === (deliverRec?.docNum || deliverRec?.doc_num) ? { ...r, status: 'delivered', deliveryDate: new Date().toISOString() } : r));
                          // Save to database
                          try {
                            const docNum = deliverRec?.docNum || deliverRec?.doc_num;
                            const response = await fetch('/api/records', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ doc_num: docNum, status: 'delivered', delivery_date: new Date().toISOString() })
                            });
                            if (!response.ok) console.error('Failed to save delivery status to DB', response.status);
                          } catch (e) { console.error('Error saving delivery:', e); }
                          showMessage('deliver', 'Delivered successfully!', true); 
                          setTimeout(() => { setDeliverDoc(''); setDeliverRec(null); setDeliverSelected(false); setDeliverOtpSent(false); setDeliverOtpVerified(false); setDeliverOtp(''); setDeliverOtpInput(''); }, 2000); 
                        }}>🖨️ Print & Deliver</button>
                  </div>
                </>
              )}
              
              {/* Show deliver button even without OTP verification - makes OTP optional */}
              {!deliverOtpVerified && deliverSelected && (
                <>
                  <div className="divider" />
                  <div className="btn-row">
                    <button className="btn" onClick={() => { setDeliverDoc(''); setDeliverRec(null); setDeliverSelected(false); setDeliverOtpSent(false); setDeliverOtpVerified(false); setDeliverOtp(''); setDeliverOtpInput(''); }}>Cancel</button>
                    <button className="btn btn-primary" onClick={async () => { 
                          printThermalReceipt(deliverRec, 'final', cfgShop || 'Devi Jewellers', cfgAddr || '');
                          // Update local state
                          setRecords((prev: RepairRecord[]) => prev.map((r: RepairRecord) => (r.docNum || r.doc_num) === (deliverRec?.docNum || deliverRec?.doc_num) ? { ...r, status: 'delivered', deliveryDate: new Date().toISOString() } : r));
                          // Save to database
                          try {
                            const docNum = deliverRec?.docNum || deliverRec?.doc_num;
                            const response = await fetch('/api/records', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ doc_num: docNum, status: 'delivered', delivery_date: new Date().toISOString() })
                            });
                            if (!response.ok) console.error('Failed to save delivery status to DB', response.status);
                          } catch (e) { console.error('Error saving delivery:', e); }
                          showMessage('deliver', 'Delivered successfully!', true); 
                          setTimeout(() => { setDeliverDoc(''); setDeliverRec(null); setDeliverSelected(false); setDeliverOtpSent(false); setDeliverOtpVerified(false); setDeliverOtp(''); setDeliverOtpInput(''); }, 2000); 
                        }}>🖨️ Print & Deliver (Skip OTP)</button>
                  </div>
                </>
              )}
            </>
          )}
          
          {records.filter(r => r.status === 'ready').length === 0 && (
            <div className="info-box">No invoices ready for delivery.</div>
          )}
          
          <Msg text={msg['deliver']?.text || ''} ok={msg['deliver']?.ok || false} />
        </div>
      </div>

      {/* ── RECEIVE ── */}
      <div className={`page ${page === 'receive' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />{isEditing ? 'Edit repair record' : 'Receive from customer'}</div>
          <div className="grid2">
            <div className="field"><label>Mobile <span className="req">*</span></label><input value={rMobile} onChange={e => { setRMobile(e.target.value); // Auto-fill name if mobile exists in records
const existing = records.find(r => (r.mobile || r.phone_number) === e.target.value);
if (existing) { setRName(existing.name || existing.customer_name || ''); showMessage('receive', 'Customer found: ' + (existing.name || existing.customer_name), true); }
}} placeholder="10-digit" maxLength={10} /></div>
            <div className="field"><label>Customer name <span className="req">*</span></label><input value={rName} onChange={e => setRName(e.target.value)} placeholder="e.g. Ramesh Patil" /></div>
          </div>
          <div className="grid3">
            <div className="field"><label>Metal <span className="req">*</span></label><select value={rMetal} onChange={e => setRMetal(e.target.value)}><option value="">Select metal</option>{metals.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
            <div className="field"><label>Jewellery type <span className="req">*</span></label><select value={rType} onChange={e => setRType(e.target.value)}><option value="">Select type</option>{jewelleries.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
            <div className="field"><label>Weight (grams) <span className="req">*</span></label><input type="number" step="0.1" value={rWeight} onChange={e => setRWeight(e.target.value)} placeholder="e.g. 12.5" /></div>
          </div>
          <div className="grid3">
            <div className="field"><label>Est. days <span className="req">*</span></label><input type="number" min="1" value={rDays} onChange={e => setRDays(e.target.value)} placeholder="e.g. 7" /></div>
            <div className="field"><label>Est. amount (&#8377;) <span className="req">*</span></label><input type="number" value={rAmount} onChange={e => setRAmount(e.target.value)} placeholder="e.g. 500" /></div>
            <div className="field"><label>Salesman <span className="req">*</span></label><select value={rSalesman} onChange={e => setRSalesman(e.target.value)}><option value="">Select salesman</option>{salesmen.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
          </div>
          <div className="field"><label>Repair description</label><textarea rows={2} value={rDesc} onChange={e => setRDesc(e.target.value)} placeholder="Describe the repair work..." /></div>
          <div className="btn-row">
            {isEditing ? (
              <>
                <button className="btn btn-primary" onClick={updateReceipt}><IcPdf />Update Record</button>
                <button className="btn" onClick={() => savedRec && buildAndDownloadPDF(savedRec, 'received', cfgLinkBase || 'https://jewellery-repair-management.vercel.app', cfgExpiry, cfgShop, cfgAddr)}>Print PDF</button>
                <button className="btn" onClick={() => savedRec && printThermalReceipt(savedRec, 'received', cfgShop, cfgAddr)}>Thermal Print</button>
                <button className="btn" onClick={cancelEdit}>Cancel Edit</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={async () => { const rec = await saveReceipt(); if (rec) { if (trRecv) { sendWhatsApp(rec, 'received').catch(console.error); } setRName(''); setRMobile(''); setRMetal(''); setRType(''); setRWeight(''); setRDays(''); setRAmount(''); setRSalesman(''); setRDesc(''); setSavedRec(rec); setPrintRec(null); } }}><IcPdf />Save &amp; Print Thermal Invoice</button>
                <button className="btn" onClick={() => { setRName(''); setRMobile(''); setRMetal(''); setRType(''); setRWeight(''); setRDays(''); setRAmount(''); setRSalesman(''); setRDesc(''); setSavedRec(null) }}>Clear</button>
              </>
            )}
          </div>
          <Msg text={msg['receive']?.text || ''} ok={msg['receive']?.ok || false} />
        </div>
        {savedRec && (
          <div className="card">
            <div className="card-title"><IcPdf />Invoice PDF &amp; WhatsApp — <span style={{ color: 'var(--brand)' }}>{savedRec.docNum || savedRec.doc_num}</span></div>
            <InvoicePanel rec={savedRec} type="received" baseUrl={cfgLinkBase || 'https://jewellery-repair-management.vercel.app'} expDays={cfgExpiry} onMsg={(t, ok) => showMessage('wa-recv', t, ok)} onSendWhatsApp={() => sendWhatsApp(savedRec, 'received')} shopName={cfgShop} shopAddress={cfgAddr} />
            <Msg text={msg['wa-recv']?.text || ''} ok={msg['wa-recv']?.ok || false} />
          </div>
        )}
      </div>

      {/* ── KARAGIR OUT ── */}
      <div className={`page ${page === 'karagir-out' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span><img src="/icon.png" alt="" />{koEditing ? 'Edit Issued to Karagir' : 'Issue jewellery to karagir'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {koEditing && <button className="btn" style={{ fontSize: 11, padding: '4px 8px', background: '#6b7280' }} onClick={() => { setKoDoc(''); setKoLoaded(false); setKoEditing(false); setKoKaragir(''); setKoNotes('') }}>✕ Cancel</button>}
              {records.filter(r => r.status === 'with_karagir').length > 0 && !koEditing && (
                <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { const r = records.find(r => r.status === 'with_karagir'); if (r) { setKoDoc(r.docNum || ''); setKoLoaded(true); setKoEditing(true); setKoKaragir(r.karagir || ''); setKoNotes(r.notes || '') } }}>✏️ Edit Issued</button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Select document number</label>
              <select value={koDoc} onChange={e => { setKoDoc(e.target.value); setKoLoaded(false) }}>
                <option value="">-- Select received order --</option>
                {koEditing 
                  ? records.filter(r => r.status === 'with_karagir').map(r => <option key={r.docNum} value={r.docNum || ''}>{r.docNum} — {r.name} ({r.jewellery})</option>)
                  : records.filter(r => r.status === 'received').map(r => <option key={r.docNum} value={r.docNum || ''}>{r.docNum} — {r.name} ({r.jewellery})</option>)
                }
              </select>
            </div>
            <button className="btn" onClick={() => { if (koDoc && records.find(r => r.docNum === koDoc)) setKoLoaded(true); else showMessage('ko', 'Select a document.', false) }}>Load</button>
          </div>
          {koLoaded && koRecord && (
            <>
              <div className="meta-grid">
                <div className="meta-item"><div className="meta-label">Customer</div><div className="meta-val">{koRecord.name}</div></div>
                <div className="meta-item"><div className="meta-label">Item</div><div className="meta-val">{koRecord.metal} {koRecord.jewellery}</div></div>
                <div className="meta-item"><div className="meta-label">Est. delivery</div><div className="meta-val">{fmtDate(koRecord.deliveryDate || addDays(new Date(), 7).toISOString())}</div></div>
              </div>
              <div className="grid2">
                <div className="field"><label>Karagir <span className="req">*</span></label><select value={koKaragir} onChange={e => setKoKaragir(e.target.value)}><option value="">Select karagir</option>{karagirs.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
                <div className="field"><label>Notes</label><input value={koNotes} onChange={e => setKoNotes(e.target.value)} placeholder="Special instructions" /></div>
              </div>
              <div className="btn-row">
                {koEditing && records.find(r => r.docNum === koDoc && r.status === 'with_karagir') && (
                  <button className="btn" style={{ background: '#dc2626' }} onClick={() => { if (confirm('Unassign from karagir? This will change status back to "Received".')) { setRecords(prev => prev.map(r => r.docNum === koDoc ? { ...r, karagir: null, karagirDate: null, status: 'received', master_id: null } : r)); showMessage('ko', `Unassigned karagir for ${koDoc}`, true); setKoDoc(''); setKoLoaded(false); setKoKaragir(''); setKoNotes(''); setKoEditing(false) } }}>🗑️ Delete / Unassign</button>
                )}
                <button className="btn btn-primary" onClick={saveKO}>{koEditing ? '💾 Update' : 'Confirm issue to karagir'}</button>
              </div>
            </>
          )}
          <Msg text={msg['ko']?.text || ''} ok={msg['ko']?.ok || false} />
        </div>
      </div>

      {/* ── KARAGIR IN ── */}
      <div className={`page ${page === 'karagir-in' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span><img src="/icon.png" alt="" />{kiEditing ? 'Edit Final Amount' : 'Receive from karagir — Final invoice'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {kiEditing && <button className="btn" style={{ fontSize: 11, padding: '4px 8px', background: '#6b7280' }} onClick={() => { setKiDoc(''); setKiLoaded(false); setKiEditing(false); setKiAmount('') }}>✕ Cancel</button>}
              {records.filter(r => r.status === 'ready').length > 0 && !kiEditing && (
                <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => { const r = records.find(r => r.status === 'ready'); if (r) { setKiDoc(r.docNum || ''); setKiLoaded(true); setKiEditing(true); setKiAmount(String(r.finalAmount || r.final_amount || '')) } }}>✏️ Edit</button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Select document number</label>
              <select value={kiDoc} onChange={e => { setKiDoc(e.target.value); setKiLoaded(false); setFinalRec(null) }}>
                <option value="">-- Select --</option>
                {kiEditing 
                  ? records.filter(r => r.status === 'ready').map(r => <option key={r.docNum} value={r.docNum || ''}>{r.docNum} — {r.name} ({r.jewellery})</option>)
                  : records.filter(r => r.status === 'with_karagir').map(r => <option key={r.docNum} value={r.docNum || ''}>{r.docNum} — {r.name} ({r.jewellery})</option>)
                }
              </select>
            </div>
            <button className="btn" onClick={() => { if (kiDoc && records.find(r => r.docNum === kiDoc)) setKiLoaded(true); else showMessage('ki', 'Select a document.', false) }}>Load</button>
          </div>
          {kiLoaded && kiRecord && (kiEditing || !finalRec) && (
            <>
              <div className="meta-grid">
                <div className="meta-item"><div className="meta-label">Customer</div><div className="meta-val">{kiRecord.name}</div></div>
                <div className="meta-item"><div className="meta-label">Item</div><div className="meta-val">{kiRecord.metal} {kiRecord.jewellery}</div></div>
                <div className="meta-item"><div className="meta-label">Karagir</div><div className="meta-val">{kiRecord.karagir}</div></div>
              </div>
              <div className="grid2">
                <div className="field"><label>Final repair amount (&#8377;) <span className="req">*</span></label><input type="number" value={kiAmount} onChange={e => setKiAmount(e.target.value)} placeholder="Actual amount" /></div>
                <div className="field"><label>Quality</label><select value={kiQuality} onChange={e => setKiQuality(e.target.value)}><option>Good</option><option>Excellent</option><option>Needs touch-up</option></select></div>
              </div>
              <div className="btn-row">
                {kiEditing && records.find(r => r.docNum === kiDoc && r.status === 'ready') && (
                  <button className="btn" style={{ background: '#dc2626' }} onClick={() => { if (confirm('Reset final invoice? Status will change back to "With Karagir".')) { setRecords(prev => prev.map(r => r.docNum === kiDoc ? { ...r, finalAmount: 0, final_amount: 0, completedDate: null, completed_date: null, quality: '', status: 'with_karagir' } : r)); showMessage('ki', `Reset final invoice for ${kiDoc}`, true); setKiDoc(''); setKiLoaded(false); setKiAmount(''); setKiEditing(false) } }}>🗑️ Delete / Reset</button>
                )}
                <button className="btn btn-primary" onClick={async () => { const rec = await saveKI(); if (rec && !kiEditing) { if (trReady) { sendWhatsApp(rec, 'final').catch(console.error); } setSavedRec(rec); setPrintRec(null); } }}>{kiEditing ? '💾 Update' : <><IcPdf />Confirm & Print Thermal Invoice</>}</button>
              </div>
            </>
          )}
          <Msg text={msg['ki']?.text || ''} ok={msg['ki']?.ok || false} />
        </div>
        {!kiEditing && finalRec && (
          <div className="card">
            <div className="card-title"><IcPdf />Final Invoice — <span style={{ color: 'var(--brand)' }}>{finalRec.docNum}</span></div>
            <InvoicePanel rec={finalRec} type="final" baseUrl={cfgLinkBase || 'https://jewellery-repair-management.vercel.app'} expDays={cfgExpiry} onMsg={(t, ok) => showMessage('wa-final', t, ok)} onSendWhatsApp={() => sendWhatsApp(finalRec, 'final')} shopName={cfgShop} shopAddress={cfgAddr} />
            <Msg text={msg['wa-final']?.text || ''} ok={msg['wa-final']?.ok || false} />
          </div>
        )}
      </div>

      {/* ── TRACK ── */}
      <div className={`page ${page === 'track' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />Track repair order</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={{ flex: 1, padding: '8px 12px', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }} value={trackQ} onChange={e => setTrackQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doTrack()} placeholder="Document number or mobile..." />
            <button className="btn btn-primary" onClick={doTrack}>Track</button>
            <button className="btn" onClick={() => { setShowAll(true); setTrackQ(''); setTrackResults([]) }}>All</button>
          </div>
          {!showAll && trackResults.length === 0 && trackQ && <p style={{ color: 'var(--text2)', fontSize: 13, padding: '8px 0' }}>No order found.</p>}
          {!showAll && trackResults.map(r => <TrackerCard key={r.docNum} r={r} />)}
          {showAll && records.length === 0 && <p style={{ color: 'var(--text2)', fontSize: 13, padding: '8px 0' }}>No orders yet.</p>}
          {showAll && ['overdue', 'ready', 'with_karagir', 'received'].map(g => grp[g].length > 0 && (
            <div key={g}>
              <div className="sec-label" style={{ marginTop: 12 }}>{g === 'with_karagir' ? 'With karagir' : g.charAt(0).toUpperCase() + g.slice(1)}</div>
              {grp[g].map((r: RepairRecord) => (
                <div key={r.docNum || r.doc_num} className="list-row" onClick={() => { setShowAll(false); setTrackQ(r.docNum || r.doc_num || ''); setTrackResults([r]) }}>
                  <div><span style={{ fontWeight: 700 }}>{r.docNum}</span><span style={{ color: 'var(--text2)', margin: '0 8px' }}>|</span>{r.name}<span style={{ color: 'var(--text2)', margin: '0 8px' }}>|</span><span style={{ color: 'var(--text2)' }}>{r.metal} {r.jewellery}</span></div>
                  <span className={`badge ${bdgCls[effStatus(r)]}`}>{bdgLbl[effStatus(r)]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── RECORDS ── */}
      <div className={`page ${page === 'records' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />All repair records</div>
          {records.length === 0 && <p style={{ color: 'var(--text2)', fontSize: 13 }}>No records yet.</p>}
          {[...records].reverse().map(r => {
            const es = effStatus(r)
            return (
              <div key={r.docNum} className="list-row">
                <div><span style={{ fontWeight: 700 }}>{r.docNum}</span><span style={{ color: 'var(--text2)', margin: '0 8px' }}>|</span>{r.name}<span style={{ color: 'var(--text2)', margin: '0 8px' }}>|</span><span style={{ color: 'var(--text2)' }}>{r.metal} {r.jewellery}</span></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtDate(r.receivedDate || r.received_date || r.created_at || new Date().toISOString())}</span>
                  <span className={`badge ${bdgCls[es]}`}>{bdgLbl[es]}</span>
                  <button className="btn btn-sm" onClick={() => loadRecordForEdit(r)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => { loadRecordForEdit(r); }}>Reprint</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteRecord(r.docNum || r.doc_num || '')}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MASTERS ── */}
      <div className={`page ${page === 'masters' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['salesman', 'jewellery', 'metal', 'karagir'] as const).map(t => (
              <button key={t} className="btn" onClick={() => setMasterTab(t)} style={masterTab === t ? { borderColor: 'var(--brand)', color: 'var(--brand)' } : {}}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>
        {masterTab === 'salesman' && (
          <div className="card">
            <div className="card-title">Salesman master <span className="count-badge">{salesmen.length}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <div className="field" style={{ flex: 2, minWidth: 130, marginBottom: 0 }}><label>Name *</label><input value={msName} onChange={e => setMsName(e.target.value)} placeholder="Salesman name" /></div>
              <div className="field" style={{ flex: 1, minWidth: 110, marginBottom: 0 }}><label>Mobile</label><input value={msMob} onChange={e => setMsMob(e.target.value)} placeholder="Mobile" maxLength={10} /></div>
              {editMasterId ? (
                <>
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('salesman')}>Update</button>
                  <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={cancelEditMaster}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('salesman')}>Add</button>
              )}
            </div>
            <Msg text={msg['master-salesman']?.text || ''} ok={msg['master-salesman']?.ok || false} />
            {salesmen.map(s => (
              <div key={s.id} className="master-item">
                <div><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.mob}</div></div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${s.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{s.status}</span>
                  <button className="btn btn-sm" onClick={() => editMaster(s)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => setSalesmen(p => p.map(x => x.id === s.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x))}>{s.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setSalesmen(p => p.filter(x => x.id !== s.id))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {masterTab === 'jewellery' && (
          <div className="card">
            <div className="card-title">Jewellery type master <span className="count-badge">{jewelleries.length}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <div className="field" style={{ flex: 2, minWidth: 130, marginBottom: 0 }}><label>Type name *</label><input value={mjName} onChange={e => setMjName(e.target.value)} placeholder="e.g. Mangalsutra" /></div>
              <div className="field" style={{ flex: 1, minWidth: 100, marginBottom: 0 }}><label>Category</label><select value={mjCat} onChange={e => setMjCat(e.target.value)}>{['Necklace', 'Ring', 'Bracelet', 'Earring', 'Chain', 'Anklet', 'Bangle', 'Other'].map(c => <option key={c}>{c}</option>)}</select></div>
              {editMasterId ? (
                <>
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('jewellery')}>Update</button>
                  <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={cancelEditMaster}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('jewellery')}>Add</button>
              )}
            </div>
            <Msg text={msg['master-jewellery']?.text || ''} ok={msg['master-jewellery']?.ok || false} />
            {jewelleries.map(j => (
              <div key={j.id} className="master-item">
                <div><div style={{ fontWeight: 600 }}>{j.name}</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{j.cat}</div></div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${j.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{j.status}</span>
                  <button className="btn btn-sm" onClick={() => editMaster(j)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => setJewelleries(p => p.map(x => x.id === j.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x))}>{j.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setJewelleries(p => p.filter(x => x.id !== j.id))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {masterTab === 'metal' && (
          <div className="card">
            <div className="card-title">Metal master <span className="count-badge">{metals.length}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <div className="field" style={{ flex: 2, minWidth: 120, marginBottom: 0 }}><label>Metal name *</label><input value={mmName} onChange={e => setMmName(e.target.value)} placeholder="e.g. Gold 22K" /></div>
              <div className="field" style={{ flex: 1, minWidth: 90, marginBottom: 0 }}><label>Type</label><select value={mmType} onChange={e => setMmType(e.target.value)}><option>Gold</option><option>Silver</option><option>Platinum</option><option>Other</option></select></div>
              <div className="field" style={{ flex: 1, minWidth: 80, marginBottom: 0 }}><label>Purity</label><input value={mmKarat} onChange={e => setMmKarat(e.target.value)} placeholder="22K" /></div>
              {editMasterId ? (
                <>
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('metal')}>Update</button>
                  <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={cancelEditMaster}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('metal')}>Add</button>
              )}
            </div>
            <Msg text={msg['master-metal']?.text || ''} ok={msg['master-metal']?.ok || false} />
            {metals.map(m => (
              <div key={m.id} className="master-item">
                <div><div style={{ fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{m.type}{m.karat ? ' · ' + m.karat : ''}</div></div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${m.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{m.status}</span>
                  <button className="btn btn-sm" onClick={() => editMaster(m)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => setMetals(p => p.map(x => x.id === m.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x))}>{m.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setMetals(p => p.filter(x => x.id !== m.id))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {masterTab === 'karagir' && (
          <div className="card">
            <div className="card-title">Karagir master <span className="count-badge">{karagirs.length}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <div className="field" style={{ flex: 2, minWidth: 130, marginBottom: 0 }}><label>Name *</label><input value={mkName} onChange={e => setMkName(e.target.value)} placeholder="Karagir name" /></div>
              <div className="field" style={{ flex: 1, minWidth: 120, marginBottom: 0 }}><label>Mobile *</label><input value={mkMob} onChange={e => setMkMob(e.target.value)} placeholder="Mobile" maxLength={10} /></div>
              <div className="field" style={{ flex: 2, minWidth: 130, marginBottom: 0 }}><label>Specialisation</label><input value={mkSpec} onChange={e => setMkSpec(e.target.value)} placeholder="e.g. Gold repair" /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <div className="field" style={{ flex: 3, minWidth: 160, marginBottom: 0 }}><label>Address</label><input value={mkAddr} onChange={e => setMkAddr(e.target.value)} placeholder="Workshop address" /></div>
              {editMasterId ? (
                <>
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('karagir')}>Update</button>
                  <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={cancelEditMaster}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => addMaster('karagir')}>Add</button>
              )}
            </div>
            <Msg text={msg['master-karagir']?.text || ''} ok={msg['master-karagir']?.ok || false} />
            {karagirs.map(k => (
              <div key={k.id} className="master-item">
                <div><div style={{ fontWeight: 600 }}>{k.name}</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{k.mob}{k.spec ? ' · ' + k.spec : ''}</div></div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${k.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>{k.status}</span>
                  <button className="btn btn-sm" onClick={() => editMaster(k)}>Edit</button>
                  <button className="btn btn-sm" onClick={() => setKaragirs(p => p.map(x => x.id === k.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x))}>{k.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setKaragirs(p => p.filter(x => x.id !== k.id))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SETTINGS ── */}
      <div className={`page ${page === 'settings' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />Shop information</div>
          <div className="grid2">
            <div className="field"><label>Shop name</label><input value={cfgShop} onChange={e => setCfgShop(e.target.value)} /></div>
            <div className="field"><label>Owner name</label><input value={cfgOwner} onChange={e => setCfgOwner(e.target.value)} placeholder="Owner name" /></div>
          </div>
          <div className="grid3">
            <div className="field"><label>Phone</label><input value={cfgPhone} onChange={e => setCfgPhone(e.target.value)} placeholder="Shop phone" /></div>
            <div className="field"><label>GST number</label><input value={cfgGst} onChange={e => setCfgGst(e.target.value)} placeholder="GST number" /></div>
            <div className="field"><label>City</label><input value={cfgCity} onChange={e => setCfgCity(e.target.value)} placeholder="City" /></div>
          </div>
          <div className="field"><label>Address</label><input value={cfgAddr} onChange={e => setCfgAddr(e.target.value)} placeholder="Full address" /></div>
          
        </div>

        <div className="card">
          <div className="card-title">
            <div style={{ width: 20, height: 20, background: '#25D366', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IcWA size={13} /></div>
            WhatsApp API — Route Mobile
            <span className={`conn-badge ${connStatus === 'ok' ? 'conn-ok' : 'conn-no'}`} style={{ marginLeft: 'auto' }}>
              <span className={`status-dot ${connStatus === 'ok' ? 'dot-green' : 'dot-red'}`} />
              {connStatus === 'checking' ? 'Verifying...' : connStatus === 'ok' ? 'Connected' : 'Not configured'}
            </span>
          </div>
          <div className="info-wa">Route Mobile uses the official <strong>Meta WhatsApp Cloud API</strong>. You need Route Mobile credentials, WABA ID, Phone Number ID, Meta access token, and approved HSM templates.</div>
          <div className="stab-row">
            {(['creds', 'templates', 'triggers', 'watest'] as const).map(t => (
              <button key={t} className={`stab ${settingsTab === t ? 'active' : ''}`} onClick={() => setSettingsTab(t)}>{t === 'creds' ? 'Credentials' : t === 'templates' ? 'Message templates' : t === 'triggers' ? 'Triggers' : 'Test & verify'}</button>
            ))}
          </div>

          {settingsTab === 'creds' && (
            <>
              <div className="sec-label">Route Mobile account</div>
              <div className="grid2">
                <div className="field"><label>Username <span className="req">*</span></label><input value={rmUser} onChange={e => setRmUser(e.target.value)} placeholder="RM account username" autoComplete="off" /><div className="hint">Route Mobile dashboard → API credentials</div></div>
                <div className="field"><label>Password <span className="req">*</span></label><input type="password" value={rmPass} onChange={e => setRmPass(e.target.value)} placeholder="Account password" autoComplete="off" /></div>
              </div>
              <div className="divider" />
              <div className="sec-label">Meta / WhatsApp credentials</div>
              <div className="grid2">
                <div className="field"><label>WABA ID <span className="req">*</span></label><input value={rmWaba} onChange={e => setRmWaba(e.target.value)} placeholder="e.g. 123456789012345" /><div className="hint">Meta Business Manager → WhatsApp accounts</div></div>
                <div className="field"><label>Phone Number ID <span className="req">*</span></label><input value={rmPhoneid} onChange={e => setRmPhoneid(e.target.value)} placeholder="e.g. 987654321098765" /><div className="hint">Meta Business Manager → Phone numbers</div></div>
              </div>
              <div className="grid2">
                <div className="field"><label>WhatsApp business number <span className="req">*</span></label><input value={rmWaphone} onChange={e => setRmWaphone(e.target.value)} placeholder="+919876543210" /></div>
                <div className="field"><label>Permanent access token <span className="req">*</span></label><input type="password" value={rmToken} onChange={e => setRmToken(e.target.value)} placeholder="EAAxxxxxxxxxxxxxxx..." autoComplete="off" /></div>
              </div>
              <div className="divider" />
              <div className="sec-label">API endpoint</div>
              <div className="grid2">
                <div className="field"><label>API base URL</label><input value={rmApiUrl} onChange={e => setRmApiUrl(e.target.value)} /></div>
                <div className="field"><label>API version</label><select value={rmApiver} onChange={e => setRmApiver(e.target.value)}><option value="v17.0">v17.0 (recommended)</option><option value="v18.0">v18.0</option><option value="v19.0">v19.0</option><option value="v20.0">v20.0</option></select></div>
              </div>
              <div className="divider" />
              <div className="sec-label">Invoice PDF link settings</div>
              <div className="grid2">
                <div className="field" style={{ flex: 2 }}><label>Invoice link base URL</label><input value={cfgLinkBase} onChange={e => setCfgLinkBase(e.target.value)} placeholder="https://jewellery-repair-management.vercel.app" /><div className="hint">Vercel: /api/invoice/..., Custom domain: /r/ (e.g., https://www.devi-jewellers.com)</div></div>
                <div className="field" style={{ width: 100 }}><label>Days</label><input type="number" min="1" max="90" value={cfgExpiry} onChange={e => setCfgExpiry(parseInt(e.target.value) || 10)} /></div>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={saveAllSettings}>💾 Save All Settings</button>
                <button className="btn" onClick={() => setCfgLinkBase('https://jewellery-repair-management.vercel.app')}>Use Vercel URL</button>
                <button className="btn btn-wa" onClick={async () => { 
                  if (!rmToken) { showMessage('creds', 'API key required.', false); return }
                  setConnStatus('checking');
                  try {
                    // Actually verify by making a test API call
                    const response = await fetch('/api/send-whatsapp/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: '919999999999',
                        templateName: 'test_template',
                        templateId: 'test',
                        params: ['Test', 'Gold', 'Ring', 'Test Date', '100', 'https://test.in'],
                        apiKey: rmToken,
                        apiUrl: rmApiUrl
                      })
                    });
                    if (response.ok || response.status === 400) {
                      // 400 means auth passed but template not found - that's OK for verification
                      setConnStatus('ok');
                      showMessage('creds', 'Connection verified! API is reachable.', true);
                    } else {
                      const err = await response.json();
                      setConnStatus('no');
                      showMessage('creds', 'Connection failed: ' + (err.error || 'Invalid API key'), false);
                    }
                  } catch (e) {
                    setConnStatus('no');
                    showMessage('creds', 'Connection failed: Network error', false);
                  }
                }}><IcWA />Verify connection</button>
                <button className="btn btn-primary" onClick={async () => { 
                  if (!rmToken) { showMessage('creds', 'API key required.', false); return }
                  try {
                    // Save to localStorage immediately for backup
                    localStorage.setItem('devi-jewellers-rmToken', rmToken);
                    localStorage.setItem('devi-jewellers-rmApiUrl', rmApiUrl);
                    localStorage.setItem('devi-jewellers-cfgLinkBase', cfgLinkBase);
                    
                    // Try to save to API as well
                    const response = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        businessName: cfgShop,
                        whatsappApiKey: rmToken,
                        whatsappApiUrl: rmApiUrl,
                        invoiceLinkBase: cfgLinkBase,
                        currency: 'INR',
                        taxRate: 0,
                        // WhatsApp Route Mobile credentials
                        whatsappRmUser: rmUser,
                        whatsappRmPass: rmPass,
                        whatsappRmWaba: rmWaba,
                        whatsappRmPhoneid: rmPhoneid,
                        whatsappRmWaphone: rmWaphone,
                        whatsappRmToken: rmToken,
                        whatsappRmApiUrl: rmApiUrl,
                        whatsappRmApiVersion: rmApiver
                      })
                    });
                    if (response.ok) {
                      showMessage('creds', 'Credentials saved to database!', true);
                    } else {
                      // API failed but localStorage saved
                      const err = await response.json();
                      showMessage('creds', 'Saved locally. API error: ' + (err.error || 'failed'), false);
                    }
                  } catch (e) {
                    // Save to localStorage even on error
                    localStorage.setItem('devi-jewellers-rmToken', rmToken);
                    localStorage.setItem('devi-jewellers-rmApiUrl', rmApiUrl);
                    localStorage.setItem('devi-jewellers-cfgLinkBase', cfgLinkBase);
                    showMessage('creds', 'Saved locally.', true);
                  }
                }}>Save credentials</button>
              </div>
              <Msg text={msg['creds']?.text || ''} ok={msg['creds']?.ok || false} />
            </>
          )}

          {settingsTab === 'templates' && (
            <>
              <div className="info-blue">WhatsApp Business API requires pre-approved HSM templates. The invoice PDF link is embedded as <code>{'{{6}}'}</code> (received) and <code>{'{{4}}'}</code> (ready) variables.</div>
              <div className="sec-label">Template 1 — Jewellery received (with invoice link)</div>
              <div className="grid2">
                <div className="field"><label>Template name <span className="req">*</span></label><input value={tpl1Name} onChange={e => setTpl1Name(e.target.value)} /><div className="hint">Exact name as approved in Meta Business Manager</div></div>
                <div className="field"><label>Language</label><select value={tpl1Lang} onChange={e => setTpl1Lang(e.target.value)}><option value="en_IN">en_IN — English (India)</option><option value="en">en</option><option value="hi">hi — Hindi</option><option value="mr">mr — Marathi</option></select></div>
              </div>
              <div className="field"><label>Template body</label><textarea rows={3} value={tpl1Body} onChange={e => setTpl1Body(e.target.value)} placeholder={`Dear {{1}}, Your {{2}} jewellery ({{3}}) has been received at Devi Jewellers. Est. delivery: {{4}}. Est. charges: &#8377; {{5}}. View invoice: {{6}} (valid ${cfgExpiry} days). Thank you!`} /><div className="hint">{'{{1}}'} Name {'{{2}}'} Metal {'{{3}}'} Item {'{{4}}'} Delivery {'{{5}}'} Amount {'{{6}}'} Invoice link (auto-generated)</div></div>
              <div className="tpl-preview">Dear <strong>Ramesh Patil</strong>, Your <strong>Gold 22K</strong> jewellery (<strong>Gold Necklace</strong>) received at Devi Jewellers. Est. delivery: <strong>20 Apr 2026</strong>. Est. charges: &#8377; <strong>1200</strong>. View invoice: <span style={{ color: '#25D366' }}>https://jewellery-repair-management.vercel.app/api/invoice/INV-JR1001-xxx?exp=20Apr2026</span> (valid {cfgExpiry} days). Thank you!</div>
              <div className="divider" />
              <div className="sec-label">Template 2 — Ready for delivery (with final invoice link)</div>
              <div className="grid2">
                <div className="field"><label>Template name <span className="req">*</span></label><input value={tpl2Name} onChange={e => setTpl2Name(e.target.value)} /></div>
                <div className="field"><label>Language</label><select value={tpl2Lang} onChange={e => setTpl2Lang(e.target.value)}><option value="en_IN">en_IN</option><option value="en">en</option><option value="hi">hi</option><option value="mr">mr</option></select></div>
              </div>
              <div className="field"><label>Template body</label><textarea rows={3} value={tpl2Body} onChange={e => setTpl2Body(e.target.value)} placeholder={`Dear {{1}}, Your {{2}} jewellery is ready at Devi Jewellers. Final charges: &#8377; {{3}}. Please visit with receipt. Thank you!`} /><div className="hint">{'{{1}}'} Name {'{{2}}'} Metal {'{{3}}'} Final amount</div></div>
              <div className="divider" />
              <div className="sec-label">Template 3 — Delivery OTP (4-digit verification)</div>
              <div className="grid2">
                <div className="field"><label>Template name <span className="req">*</span></label><input value={tpl3Name} onChange={e => setTpl3Name(e.target.value)} /><div className="hint">For OTP verification on delivery</div></div>
                <div className="field"><label>Language</label><select value={tpl3Lang} onChange={e => setTpl3Lang(e.target.value)}><option value="en_IN">en_IN</option><option value="en">en</option><option value="hi">hi</option><option value="mr">mr</option></select></div>
              </div>
              <div className="field"><label>Template body</label><textarea rows={3} value={tpl3Body} onChange={e => setTpl3Body(e.target.value)} placeholder={`Dear {{1}}, Your OTP for jewellery delivery is {{2}}. Valid for 10 minutes. Thank you!`} /><div className="hint">{'{{1}}'} Name {'{{2}}'} OTP (4 digits)</div></div>
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={saveTemplatesOnly}>💾 Save Templates</button>
              </div>
              <Msg text={msg['templates']?.text || ''} ok={msg['templates']?.ok || false} />
            </>
          )}

          {settingsTab === 'triggers' && (
            <>
              <div className="info-warn">WhatsApp HSM templates can only be sent to customers who have opted in. Ensure customer consent.</div>
              <div className="toggle-row"><div><div style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp + invoice PDF link on receipt</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Template: <code>{tpl1Name}</code></div></div><Toggle checked={trRecv} onChange={setTrRecv} /></div>
              <div className="toggle-row"><div><div style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp + final invoice link when ready</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Template: <code>{tpl2Name}</code></div></div><Toggle checked={trReady} onChange={setTrReady} /></div>
              <div className="toggle-row" style={{ border: 'none' }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp when issued to karagir</div></div><Toggle checked={trKaragir} onChange={setTrKaragir} /></div>
              <Msg text={msg['triggers']?.text || ''} ok={msg['triggers']?.ok || false} />
            </>
          )}

          {settingsTab === 'watest' && (
            <>
              <div className="grid2">
                <div className="field"><label>Test WhatsApp number <span className="req">*</span></label><input value={testWa} onChange={e => setTestWa(e.target.value)} placeholder="+919876543210" /><div className="hint">Include country code.</div></div>
                <div className="field"><label>Template to test</label><select value={testTpl} onChange={e => setTestTpl(e.target.value)}><option value="received">Template 1 — {tpl1Name}</option><option value="ready">Template 2 — {tpl2Name}</option></select></div>
              </div>
              <div className="btn-row"><button className="btn btn-wa" onClick={sendTestWhatsApp}><IcWA />Send test WhatsApp</button></div>
              <Msg text={msg['watest']?.text || ''} ok={msg['watest']?.ok || false} />
              <div className="divider" />
              <div className="sec-label">Credential reference</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['RM username', 'Route Mobile dashboard → Account settings → API credentials'], ['WABA ID', 'Meta Business Manager → WhatsApp → WhatsApp accounts → Account ID'], ['Phone Number ID', 'Meta Business Manager → WhatsApp → Phone numbers → select number'], ['Access token', 'Meta Business Manager → System users → Generate token → WhatsApp permissions'], ['Invoice link URL', 'Your web hosting or cloud storage (AWS S3, Cloudflare R2, or own server)']].map(([k, v]) => (
                  <div key={k} className="param-row"><span className="param-key">{k}</span><span className="param-val">{v}</span></div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
