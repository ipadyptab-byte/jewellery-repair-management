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
            customerName: customerName,
            otp: otp,
            shopName: cfgShop || 'Devi Jewellers',
            expiry: '10 mins',
            token: rmToken,
            apiUrl: rmApiUrl
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
    // Show alert with values being sent - so user can see before page potentially redirects
    const shopData = {
      businessName: cfgShop,
      shopOwner: cfgOwner,
      shopPhone: cfgPhone,
      shopGst: cfgGst,
      shopCity: cfgCity,
      shopAddress: cfgAddr
    };
    alert('📦 Shop fields being sent to database:\n' + 
      'businessName: ' + cfgShop + '\n' +
      'shopOwner: ' + cfgOwner + '\n' +
      'shopPhone: ' + cfgPhone + '\n' +
      'shopGst: ' + cfgGst + '\n' +
      'shopCity: ' + cfgCity + '\n' +
      'shopAddress: ' + cfgAddr + '\n\nClick OK to save...');
    
    console.log('💾 Starting save all settings...');
    console.log('📦 Shop fields being sent:', shopData);
    
    try {
      // Save shop info
      const shopRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: cfgShop,
          shopOwner: cfgOwner,
          shopPhone: cfgPhone,
          shopGst: cfgGst,
          shopCity: cfgCity,
          shopAddress: cfgAddr
        })
      });
      const shopJson = await shopRes.json();
      console.log('🏪 Shop save response:', shopRes.status, shopJson);
      
      // Save WhatsApp + Invoice settings
      const waRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappRmUser: rmUser,
          whatsappRmPass: rmPass,
          whatsappRmWaba: rmWaba,
          whatsappRmPhoneid: rmPhoneid,
          whatsappRmWaphone: rmWaphone,
          whatsappRmToken: rmToken,
          whatsappRmApiUrl: rmApiUrl,
          whatsappRmApiVersion: rmApiver,
          invoiceLinkBase: cfgLinkBase || 'https://jewellery-repair-management.vercel.app',
          invoiceExpiry: cfgExpiry
        })
      });
      console.log('📱 WhatsApp save response:', waRes.status, waRes.ok);
      
      // Save templates
      const tplRes = await fetch('/api/settings/templates', {
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
      console.log('📝 Templates save response:', tplRes.status, tplRes.ok);
      
      if (shopRes.ok && waRes.ok && tplRes.ok) {
        showMessage('creds', '✅ All settings saved to database!', true);
        console.log('✅ All settings saved!');
        
        // Manually trigger settings reload without page redirect
        fetch('/api/settings').then(res => res.json()).then(settings => {
          console.log('🔄 Reloaded settings from DB:', settings);
          if (settings.businessName) setCfgShop(settings.businessName);
          if (settings.shopOwner) setCfgOwner(settings.shopOwner);
          if (settings.shopPhone) setCfgPhone(settings.shopPhone);
          if (settings.shopGst) setCfgGst(settings.shopGst);
          if (settings.shopCity) setCfgCity(settings.shopCity);
          if (settings.shopAddress) setCfgAddr(settings.shopAddress);
          showMessage('creds', '✅ Settings reloaded from database!', true);
        }).catch(err => {
          console.error('Failed to reload:', err);
        });
      } else {
        showMessage('creds', 'Some settings failed to save. Check console.', false);
        console.error('❌ Some saves failed');
      }
    } catch (err) {
      console.error('❌ Save error:', err);
      showMessage('creds', 'Failed to save settings: ' + err, false);
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

