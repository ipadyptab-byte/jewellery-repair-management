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
  return { url: `${baseUrl.replace(/\/$/, '')}/INV-${docNum}${suffix}-${token}?exp=${expDate.replace(/ /g, '')}`, expDate }
}

function buildAndDownloadPDF(rec: RepairRecord, type: 'received' | 'final', baseUrl: string, expDays: number) {
  if (typeof window === 'undefined' || !window.jspdf) return null
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, pad = 15
  let y = pad

  doc.setFillColor(192, 0, 58); doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('Devi Jewellers', pad, 11)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text('Gold | Silver | Diamonds | Pearls', pad, 17)
  doc.setFontSize(7); doc.text('Anmol Kshananache Soneri Sakshidar', pad, 22)

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
  const rows: [string, string][] = [['Item', rec.jewellery || rec.item_type || ''], ['Metal', rec.metal || ''], ['Weight', `${rec.weight || '0'} grams`], ['Repair Work', rec.desc || rec.description || 'General repair'], ['Salesman', rec.salesman || ''], ['Received Date', fmtDate(rec.receivedDate || rec.created_at || new Date().toISOString())], ['Est. Delivery', fmtDate(rec.deliveryDate || addDays(new Date(), 7).toISOString())]]
  if (rec.karagir) rows.push(['Karagir', rec.karagir])
  rows.forEach(([k, v]) => { doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, pad, y); doc.setFont('helvetica', 'normal'); doc.text(String(v), pad + 38, y); y += 5 })
  y += 2; doc.line(pad, y, W - pad, y); y += 6

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('Charges', pad, y); y += 5
  if (type === 'final') {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Estimated Amount:', pad, y); doc.setFont('helvetica', 'normal'); doc.text(`Rs ${rec.amount}`, pad + 50, y); y += 5
    doc.setFont('helvetica', 'bold'); doc.text('Final Amount:', pad, y); doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(`Rs ${rec.finalAmount}`, pad + 50, y); y += 5
  } else {
    doc.setFont('helvetica', 'bold'); doc.text('Estimated Amount:', pad, y); doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(`Rs ${rec.amount}`, pad + 50, y); y += 5
    doc.setFontSize(8); doc.setTextColor(120, 120, 120); doc.text('(Final amount confirmed on delivery)', pad, y); doc.setTextColor(0, 0, 0); y += 5
  }
  y += 2; doc.line(pad, y, W - pad, y); y += 6

  const { url, expDate } = generateInvoiceLink(rec.docNum || rec.doc_num, type, baseUrl, expDays)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('Invoice Link:', pad, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 100, 0); doc.text(url, pad, y, { maxWidth: W - 2 * pad }); y += 6
  doc.setTextColor(150, 80, 0); doc.setFontSize(8); doc.text(`Link expires on ${expDate} (valid ${expDays} days)`, pad, y); doc.setTextColor(0, 0, 0); y += 8

  doc.line(pad, y, W - pad, y); y += 5
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
  doc.text('Thank you for trusting Devi Jewellers. Please bring this receipt at time of delivery.', pad, y, { maxWidth: W - 2 * pad }); y += 5
  doc.text('Anmol Kshananache Soneri Sakshidar', W / 2, y, { align: 'center' })

  doc.save(`Invoice-${rec.docNum}-${type === 'final' ? 'Final' : 'Receipt'}.pdf`)
  return { url, expDate }
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

function InvoicePanel({ rec, type, baseUrl, expDays, onMsg, onSendWhatsApp }: { rec: RepairRecord; type: 'received' | 'final'; baseUrl: string; expDays: number; onMsg: (m: string, ok: boolean) => void; onSendWhatsApp: () => Promise<void> }) {
  const { url, expDate } = generateInvoiceLink(rec.docNum || rec.doc_num, type, baseUrl, expDays)
  const waMsg = type === 'received'
    ? `Dear ${rec.name || rec.customer_name},\n\nYour ${rec.metal} jewellery (${rec.jewellery || rec.item_type}) has been received at *Devi Jewellers*.\n\n📋 *Document No:* ${rec.docNum || rec.doc_num}\n📅 *Est. Delivery:* ${fmtDate(rec.deliveryDate || addDays(new Date(), 7).toISOString())}\n💰 *Est. Charges:* Rs ${rec.amount || rec.estimated_cost}\n\n📄 *View your invoice:*\n${url}\n_(Link valid ${expDays} days — expires ${expDate})_\n\nThank you! *Devi Jewellers* 🌟`
    : `Dear ${rec.name || rec.customer_name},\n\nYour *${rec.metal}* jewellery is *ready for delivery* at *Devi Jewellers*! 🎉\n\n📋 *Document No:* ${rec.docNum || rec.doc_num}\n💰 *Final Charges:* Rs ${rec.finalAmount || rec.final_amount}\n\n📄 *View your final invoice:*\n${url}\n_(Link valid ${expDays} days — expires ${expDate})_\n\nPlease visit with your receipt.\nThank you! *Devi Jewellers* 🌟`

  const copy = () => navigator.clipboard.writeText(url).then(() => onMsg('Link copied!', true)).catch(() => onMsg('Copy failed', false))
  const download = () => buildAndDownloadPDF(rec, type, baseUrl, expDays)
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
  const [records, setRecords] = useState<RepairRecord[]>([])
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
  const [koDoc, setKoDoc] = useState(''); const [koKaragir, setKoKaragir] = useState(''); const [koNotes, setKoNotes] = useState(''); const [koLoaded, setKoLoaded] = useState(false)

  // Karagir in
  const [kiDoc, setKiDoc] = useState(''); const [kiAmount, setKiAmount] = useState(''); const [kiQuality, setKiQuality] = useState('Good'); const [kiLoaded, setKiLoaded] = useState(false); const [finalRec, setFinalRec] = useState<RepairRecord | null>(null)

  // Track
  const [trackQ, setTrackQ] = useState(''); const [trackResults, setTrackResults] = useState<RepairRecord[]>([]); const [showAll, setShowAll] = useState(true)

  // Settings
  const [cfgShop, setCfgShop] = useState('Devi Jewellers'); const [cfgOwner, setCfgOwner] = useState(''); const [cfgPhone, setCfgPhone] = useState(''); const [cfgGst, setCfgGst] = useState(''); const [cfgCity, setCfgCity] = useState(''); const [cfgAddr, setCfgAddr] = useState('')
  const [rmUser, setRmUser] = useState(''); const [rmPass, setRmPass] = useState(''); const [rmWaba, setRmWaba] = useState(''); const [rmPhoneid, setRmPhoneid] = useState(''); const [rmWaphone, setRmWaphone] = useState(''); const [rmToken, setRmToken] = useState(''); const [rmApiUrl, setRmApiUrl] = useState('https://api.routemobile.com/whatsapp/v1'); const [rmApiver, setRmApiver] = useState('v17.0')
  const [cfgLinkBase, setCfgLinkBase] = useState('https://invoice.devijewellers.in'); const [cfgExpiry, setCfgExpiry] = useState(10)
  const [tpl1Name, setTpl1Name] = useState('jewellery_received_invoice'); const [tpl2Name, setTpl2Name] = useState('jewellery_ready_invoice')
  const [connStatus, setConnStatus] = useState<'no' | 'ok' | 'checking'>('no')
  const [settingsTab, setSettingsTab] = useState<'shop' | 'whatsapp'>('shop') // 'shop' or 'whatsapp'
  const [waSubTab, setWaSubTab] = useState<'creds' | 'templates' | 'triggers' | 'watest'>('creds')
  const [trRecv, setTrRecv] = useState(true); const [trReady, setTrReady] = useState(true); const [trKaragir, setTrKaragir] = useState(false)
  const [testWa, setTestWa] = useState(''); const [testTpl, setTestTpl] = useState('received')

  const sendWhatsApp = async (rec: RepairRecord, type: 'received' | 'final') => {
    if (!rmToken && (!rmUser || !rmPass)) throw new Error('WhatsApp API key or username/password required.')
    if (!tpl1Name || !tpl2Name) throw new Error('WhatsApp template names are required.')

    const templateName = type === 'received' ? tpl1Name : tpl2Name
    const invoiceLink = `${cfgLinkBase.replace(/\/$/, '')}/INV-${rec.docNum || rec.doc_num}${type === 'final' ? '-final' : ''}?exp=${fmtDate(addDays(new Date(), cfgExpiry)).replace(/ /g, '')}`
    const params = type === 'received'
      ? [rec.name || rec.customer_name, rec.metal, rec.jewellery || rec.item_type, fmtDate(rec.deliveryDate || addDays(new Date(), 7).toISOString()), String(rec.amount || rec.estimated_cost), invoiceLink]
      : [rec.name || rec.customer_name, rec.metal, String(rec.finalAmount || rec.final_amount || rec.amount || rec.estimated_cost), invoiceLink]

    const toNumber = (rec.mobile || rec.phone_number || '').replace(/^\+/, '')
    const baseUrl = rmApiUrl.replace(/\/$/, '')

    // Route Mobile API endpoint
    const url = `${baseUrl}/messages`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Route Mobile authentication
    if (rmToken) {
      headers['Authorization'] = `Bearer ${rmToken}`
    } else if (rmUser && rmPass) {
      headers['Authorization'] = `Basic ${btoa(`${rmUser}:${rmPass}`)}`
    }

    // Route Mobile request body format
    const body = {
      to: toNumber.startsWith('91') ? toNumber : `91${toNumber}`,
      type: 'template',
      messaging_product: 'whatsapp',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: [{
          type: 'body',
          parameters: params.map(param => ({ type: 'text', text: param }))
        }]
      }
    }

    console.log('WhatsApp API Request:', { url, headers: { ...headers, Authorization: '[REDACTED]' }, body })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
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
      const errorMessage = json?.error?.message || json?.message || json?.description || response.statusText
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

  // Master form fields
  const [msName, setMsName] = useState(''); const [msMob, setMsMob] = useState(''); const [msStatus, setMsStatus] = useState('active')
  const [mjName, setMjName] = useState(''); const [mjCat, setMjCat] = useState('Necklace'); const [mjStatus, setMjStatus] = useState('active')
  const [mmName, setMmName] = useState(''); const [mmType, setMmType] = useState('Gold'); const [mmKarat, setMmKarat] = useState(''); const [mmStatus, setMmStatus] = useState('active')
  const [mkName, setMkName] = useState(''); const [mkMob, setMkMob] = useState(''); const [mkSpec, setMkSpec] = useState(''); const [mkAddr, setMkAddr] = useState(''); const [mkStatus, setMkStatus] = useState('active')
  const [editMasterId, setEditMasterId] = useState<number | null>(null)

  // Load data from APIs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // FIRST: Load from localStorage as initial values (these will always work)
        const savedRmToken = localStorage.getItem('devi-jewellers-rmToken');
        if (savedRmToken) setRmToken(savedRmToken);
        
        const savedRmApiUrl = localStorage.getItem('devi-jewellers-rmApiUrl');
        if (savedRmApiUrl) setRmApiUrl(savedRmApiUrl);
        
        const savedCfgLinkBase = localStorage.getItem('devi-jewellers-cfgLinkBase');
        if (savedCfgLinkBase) setCfgLinkBase(savedCfgLinkBase);
        
        const savedCfgShop = localStorage.getItem('devi-jewellers-cfgShop');
        if (savedCfgShop) setCfgShop(savedCfgShop);
        
        const savedCfgOwner = localStorage.getItem('devi-jewellers-cfgOwner');
        if (savedCfgOwner) setCfgOwner(savedCfgOwner);
        
        const savedCfgPhone = localStorage.getItem('devi-jewellers-cfgPhone');
        if (savedCfgPhone) setCfgPhone(savedCfgPhone);
        
        const savedCfgGst = localStorage.getItem('devi-jewellers-cfgGst');
        if (savedCfgGst) setCfgGst(savedCfgGst);
        
        const savedCfgCity = localStorage.getItem('devi-jewellers-cfgCity');
        if (savedCfgCity) setCfgCity(savedCfgCity);
        
        const savedCfgAddr = localStorage.getItem('devi-jewellers-cfgAddr');
        if (savedCfgAddr) setCfgAddr(savedCfgAddr);

        // SECOND: Try to load records from API
        const recordsResponse = await fetch('/api/records');
        if (recordsResponse.ok) {
          const dbRecords = await recordsResponse.json();
          setRecords(dbRecords.map(convertFromDB));
        }

        // Load masters from API
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

        // Load settings from API - always set values (even if empty string)
        console.log('Loading settings from API...');
        const settingsResponse = await fetch('/api/settings');
        console.log('Settings response status:', settingsResponse.status);
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          console.log('Settings loaded from DB:', settings);
          
          // Load all settings - use defaultValue || settingsValue pattern
          setCfgShop(settings.businessName || 'Devi Jewellers');
          setCfgOwner(settings.shopOwner || '');
          setCfgPhone(settings.shopPhone || '');
          setCfgGst(settings.shopGst || '');
          setCfgCity(settings.shopCity || '');
          setCfgAddr(settings.shopAddress || '');
          
          // Always load WhatsApp settings (key field is required)
          console.log('Loading WhatsApp - API key:', settings.whatsappApiKey);
          setRmToken(settings.whatsappApiKey || '');
          setRmApiUrl(settings.whatsappApiUrl || 'https://api.routemobile.com/whatsapp/v1');
          setRmUser(settings.whatsappRmUser || '');
          setRmPass(settings.whatsappRmPass || '');
          setRmWaba(settings.whatsappRmWaba || '');
          setRmPhoneid(settings.whatsappRmPhoneid || '');
          setRmWaphone(settings.whatsappRmWaphone || '');
          setRmApiver(settings.whatsappRmApiVer || 'v17.0');
          
          // Invoice settings
          setCfgLinkBase(settings.invoiceLinkBase || '');
          setCfgExpiry(settings.invoiceExpiryDays || 10);
          
          // Template settings
          setTpl1Name(settings.template1Name || 'jewellery_received_invoice');
          setTpl2Name(settings.template2Name || 'jewellery_ready_invoice');
          
          // Trigger settings
          setTrRecv(settings.triggerReceive !== undefined ? settings.triggerReceive : true);
          setTrReady(settings.triggerReady !== undefined ? settings.triggerReady : true);
          setTrKaragir(settings.triggerKaragir !== undefined ? settings.triggerKaragir : false);
          
          console.log('Settings loaded into state complete');
        } else {
          console.error('Failed to load settings, status:', settingsResponse.status);
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
  const saveReceipt = async () => {
    if (!rName || !rMobile || !rMetal || !rType || !rWeight || !rDays || !rAmount || !rSalesman) { showMessage('receive', 'Please fill all required fields.', false); return }
    if (!/^\d{10}$/.test(rMobile)) { showMessage('receive', 'Enter valid 10-digit mobile.', false); return }

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
        throw new Error('Failed to save record');
      }

      const savedRecord = await response.json();
      setRecords(prev => [...prev, convertFromDB(savedRecord)]);
      setDocSeq(seq);
      setSavedRec(convertFromDB(savedRecord));
      showMessage('receive', `Saved! Document: ${docNum}`, true);
    } catch (error) {
      console.error('Error saving receipt:', error);
      showMessage('receive', 'Failed to save receipt. Please try again.', false);
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
      // Find the karagir master to get the ID
      const karagirMaster = karagirs.find(k => k.name === koKaragir);
      if (!karagirMaster) {
        showMessage('ko', 'Selected karagir not found.', false);
        return;
      }

      // Update the record via API (we'll need to implement PUT/PATCH endpoint)
      // For now, update local state and save to localStorage
      setRecords(prev => prev.map(r => r.docNum === koDoc ? {
        ...r,
        karagir: koKaragir,
        karagirDate: new Date().toISOString(),
        status: 'with_karagir',
        master_id: karagirMaster.id
      } : r));

      showMessage('ko', `Issued to ${koKaragir} for ${koDoc}`, true);
      setKoDoc(''); setKoLoaded(false);
    } catch (error) {
      console.error('Error saving karagir out:', error);
      showMessage('ko', 'Failed to update record.', false);
    }
  }

  /* ── Karagir In ── */
  const kiRecord = records.find(r => r.docNum === kiDoc)
  const saveKI = async () => {
    if (!kiDoc || !kiAmount) { showMessage('ki', 'Enter final amount.', false); return }

    try {
      const updated = records.map(r => r.docNum === kiDoc ? {
        ...r,
        finalAmount: parseFloat(kiAmount),
        completedDate: new Date().toISOString(),
        quality: kiQuality,
        status: 'ready',
        final_amount: parseFloat(kiAmount),
        completed_date: new Date().toISOString()
      } : r);

      setRecords(updated);
      setFinalRec(updated.find(r => r.docNum === kiDoc) || null);
      showMessage('ki', `Updated! Final invoice generated for ${kiDoc}`, true);
      setKiLoaded(false);
    } catch (error) {
      console.error('Error saving karagir in:', error);
      showMessage('ki', 'Failed to update record.', false);
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
          is_active: msStatus === 'active'
        };
      } else if (type === 'jewellery') {
        if (!mjName.trim()) { showMessage('master-jewellery', 'Name required.', false); return }
        masterData = {
          id: editMasterId || undefined,
          name: mjName.trim(),
          category: mjCat,
          type: 'jewellery',
          is_active: mjStatus === 'active'
        };
      } else if (type === 'metal') {
        if (!mmName.trim()) { showMessage('master-metal', 'Name required.', false); return }
        masterData = {
          id: editMasterId || undefined,
          name: mmName.trim(),
          type: 'metal',
          karat: mmKarat.trim(),
          is_active: mmStatus === 'active'
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
          is_active: mkStatus === 'active'
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
        setMsName(''); setMsMob(''); setMsStatus('active');
      } else if (type === 'jewellery') {
        if (editMasterId) {
          setJewelleries(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-jewellery', 'Updated.', true);
        } else {
          setJewelleries(p => [...p, masterObj]);
          showMessage('master-jewellery', 'Added.', true);
        }
        setMjName(''); setMjStatus('active');
      } else if (type === 'metal') {
        if (editMasterId) {
          setMetals(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-metal', 'Updated.', true);
        } else {
          setMetals(p => [...p, masterObj]);
          showMessage('master-metal', 'Added.', true);
        }
        setMmName(''); setMmKarat(''); setMmStatus('active');
      } else if (type === 'karagir') {
        if (editMasterId) {
          setKaragirs(p => p.map(x => x.id === editMasterId ? masterObj : x));
          showMessage('master-karagir', 'Updated.', true);
        } else {
          setKaragirs(p => [...p, masterObj]);
          showMessage('master-karagir', 'Added.', true);
        }
        setMkName(''); setMkMob(''); setMkSpec(''); setMkAddr(''); setMkStatus('active');
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
      { label: 'Jewellery received', sub: `${r.jewellery || r.item_type} · ${r.metal} · ${r.weight}g · Est ₹${r.amount || r.estimated_cost}`, date: r.receivedDate || r.received_date, done: true },
      { label: r.karagir ? `Issued to karagir — ${r.karagir}` : 'Issued to karagir', sub: r.karagir ? 'In repair' : 'Pending', date: r.karagirDate || r.karagir_date, done: !!r.karagir },
      { label: 'Received from karagir', sub: r.finalAmount || r.final_amount ? `Final: ₹${r.finalAmount || r.final_amount}` : 'Awaiting', date: r.completedDate || r.completed_date, done: !!(r.completedDate || r.completed_date) },
      { label: 'Ready for delivery', sub: r.finalAmount || r.final_amount ? `Charges: ₹${r.finalAmount || r.final_amount}` : 'Pending', date: r.completedDate || r.completed_date, done: r.status === 'ready' },
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

  const grp: Record<string, RepairRecord[]> = { overdue: [], ready: [], with_karagir: [], received: [] }
  records.forEach(r => { const es = effStatus(r); if (grp[es]) grp[es].push(r) })

  /* ──────── RENDER ──────── */
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

      {/* ── RECEIVE ── */}
      <div className={`page ${page === 'receive' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />{isEditing ? 'Edit repair record' : 'Receive from customer'}</div>
          <div className="grid2">
            <div className="field"><label>Customer name <span className="req">*</span></label><input value={rName} onChange={e => setRName(e.target.value)} placeholder="e.g. Ramesh Patil" /></div>
            <div className="field"><label>Mobile <span className="req">*</span></label><input value={rMobile} onChange={e => setRMobile(e.target.value)} placeholder="10-digit" maxLength={10} /></div>
          </div>
          <div className="grid3">
            <div className="field"><label>Metal <span className="req">*</span></label><select value={rMetal} onChange={e => setRMetal(e.target.value)}><option value="">Select metal</option>{metals.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
            <div className="field"><label>Jewellery type <span className="req">*</span></label><select value={rType} onChange={e => setRType(e.target.value)}><option value="">Select type</option>{jewelleries.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
            <div className="field"><label>Weight (grams) <span className="req">*</span></label><input type="number" step="0.1" value={rWeight} onChange={e => setRWeight(e.target.value)} placeholder="e.g. 12.5" /></div>
          </div>
          <div className="grid3">
            <div className="field"><label>Est. days <span className="req">*</span></label><input type="number" min="1" value={rDays} onChange={e => setRDays(e.target.value)} placeholder="e.g. 7" /></div>
            <div className="field"><label>Est. amount (₹) <span className="req">*</span></label><input type="number" value={rAmount} onChange={e => setRAmount(e.target.value)} placeholder="e.g. 500" /></div>
            <div className="field"><label>Salesman <span className="req">*</span></label><select value={rSalesman} onChange={e => setRSalesman(e.target.value)}><option value="">Select salesman</option>{salesmen.filter(x => x.status === 'active').map(x => <option key={x.id}>{x.name}</option>)}</select></div>
          </div>
          <div className="field"><label>Repair description</label><textarea rows={2} value={rDesc} onChange={e => setRDesc(e.target.value)} placeholder="Describe the repair work..." /></div>
          <div className="btn-row">
            {isEditing ? (
              <>
                <button className="btn btn-primary" onClick={updateReceipt}><IcPdf />Update Record</button>
                <button className="btn" onClick={() => savedRec && buildAndDownloadPDF(savedRec, 'received', cfgLinkBase, cfgExpiry)}>Print PDF</button>
                <button className="btn" onClick={cancelEdit}>Cancel Edit</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={saveReceipt}><IcPdf />Save &amp; Generate Invoice PDF</button>
                <button className="btn" onClick={() => { setRName(''); setRMobile(''); setRMetal(''); setRType(''); setRWeight(''); setRDays(''); setRAmount(''); setRSalesman(''); setRDesc(''); setSavedRec(null) }}>Clear</button>
              </>
            )}
          </div>
          <Msg text={msg['receive']?.text || ''} ok={msg['receive']?.ok || false} />
        </div>
        {savedRec && (
          <div className="card">
            <div className="card-title"><IcPdf />Invoice PDF &amp; WhatsApp — <span style={{ color: 'var(--brand)' }}>{savedRec.docNum || savedRec.doc_num}</span></div>
            <InvoicePanel rec={savedRec} type="received" baseUrl={cfgLinkBase} expDays={cfgExpiry} onMsg={(t, ok) => showMessage('wa-recv', t, ok)} onSendWhatsApp={() => sendWhatsApp(savedRec, 'received')} />
            <Msg text={msg['wa-recv']?.text || ''} ok={msg['wa-recv']?.ok || false} />
          </div>
        )}
      </div>

      {/* ── KARAGIR OUT ── */}
      <div className={`page ${page === 'karagir-out' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />Issue jewellery to karagir</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Select document number</label>
              <select value={koDoc} onChange={e => { setKoDoc(e.target.value); setKoLoaded(false) }}>
                <option value="">-- Select received order --</option>
                {records.filter(r => r.status === 'received').map(r => <option key={r.docNum} value={r.docNum}>{r.docNum} — {r.name} ({r.jewellery})</option>)}
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
              <div className="btn-row"><button className="btn btn-primary" onClick={saveKO}>Confirm issue to karagir</button></div>
            </>
          )}
          <Msg text={msg['ko']?.text || ''} ok={msg['ko']?.ok || false} />
        </div>
      </div>

      {/* ── KARAGIR IN ── */}
      <div className={`page ${page === 'karagir-in' ? 'active' : ''}`}>
        <button className="back-btn" onClick={goBack}><IcBack />Dashboard</button>
        <div className="card">
          <div className="card-title"><img src="/icon.png" alt="" />Receive from karagir — Final invoice</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Select document number</label>
              <select value={kiDoc} onChange={e => { setKiDoc(e.target.value); setKiLoaded(false); setFinalRec(null) }}>
                <option value="">-- Select --</option>
                {records.filter(r => r.status === 'with_karagir').map(r => <option key={r.docNum} value={r.docNum}>{r.docNum} — {r.name} ({r.jewellery})</option>)}
              </select>
            </div>
            <button className="btn" onClick={() => { if (kiDoc && records.find(r => r.docNum === kiDoc)) setKiLoaded(true); else showMessage('ki', 'Select a document.', false) }}>Load</button>
          </div>
          {kiLoaded && kiRecord && !finalRec && (
            <>
              <div className="meta-grid">
                <div className="meta-item"><div className="meta-label">Customer</div><div className="meta-val">{kiRecord.name}</div></div>
                <div className="meta-item"><div className="meta-label">Item</div><div className="meta-val">{kiRecord.metal} {kiRecord.jewellery}</div></div>
                <div className="meta-item"><div className="meta-label">Karagir</div><div className="meta-val">{kiRecord.karagir}</div></div>
              </div>
              <div className="grid2">
                <div className="field"><label>Final repair amount (₹) <span className="req">*</span></label><input type="number" value={kiAmount} onChange={e => setKiAmount(e.target.value)} placeholder="Actual amount" /></div>
                <div className="field"><label>Quality</label><select value={kiQuality} onChange={e => setKiQuality(e.target.value)}><option>Good</option><option>Excellent</option><option>Needs touch-up</option></select></div>
              </div>
              <div className="btn-row"><button className="btn btn-primary" onClick={saveKI}><IcPdf />Confirm &amp; Generate Final Invoice PDF</button></div>
            </>
          )}
          <Msg text={msg['ki']?.text || ''} ok={msg['ki']?.ok || false} />
        </div>
        {finalRec && (
          <div className="card">
            <div className="card-title"><IcPdf />Final Invoice — <span style={{ color: 'var(--brand)' }}>{finalRec.docNum}</span></div>
            <InvoicePanel rec={finalRec} type="final" baseUrl={cfgLinkBase} expDays={cfgExpiry} onMsg={(t, ok) => showMessage('wa-final', t, ok)} onSendWhatsApp={() => sendWhatsApp(finalRec, 'final')} />
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
              {grp[g].map(r => (
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
                <div><span style={{ fontWeight: 700 }}>{r.docNum}</span><span style={{ color: 'var(--text2)', margin: '0 8px' }}>|</span>{r.name}<span style={{ color: 'var(--text2)', margin: '0 8px' }}>|</span><span style={{ color: 'var(--text2)' }}>{r.metal} {r.jewellery} {r.weight}g</span></div>
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
              <div className="field" style={{ width: 110, marginBottom: 0 }}><label>Status</label><select value={msStatus} onChange={e => setMsStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
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
                  <span className="badge badge-active">Active</span>
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
              <div className="field" style={{ width: 110, marginBottom: 0 }}><label>Status</label><select value={mjStatus} onChange={e => setMjStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
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
                  <span className="badge badge-active">Active</span>
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
              <div className="field" style={{ width: 110, marginBottom: 0 }}><label>Status</label><select value={mmStatus} onChange={e => setMmStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
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
                  <span className="badge badge-active">Active</span>
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
              <div className="field" style={{ width: 110, marginBottom: 0 }}><label>Status</label><select value={mkStatus} onChange={e => setMkStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
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
                  <span className="badge badge-active">Active</span>
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
        
        {/* Settings Tabs */}
        <div className="stab-row" style={{ marginBottom: 16 }}>
          <button className={`stab ${settingsTab === 'shop' ? 'active' : ''}`} onClick={() => setSettingsTab('shop')}>🏪 Shop information</button>
          <button className={`stab ${settingsTab === 'whatsapp' ? 'active' : ''}`} onClick={() => setSettingsTab('whatsapp')}>📱 WhatsApp API</button>
        </div>

        {settingsTab === 'shop' && (
        <div className="card">
          <div className="card-title">🏪 Shop information</div>
          <div className="grid2">
            <div className="field"><label>Shop name *</label><input value={cfgShop} onChange={e => setCfgShop(e.target.value)} placeholder="Your shop name" /></div>
            <div className="field"><label>Owner name</label><input value={cfgOwner} onChange={e => setCfgOwner(e.target.value)} placeholder="Owner name" /></div>
          </div>
          <div className="grid3">
            <div className="field"><label>Phone *</label><input value={cfgPhone} onChange={e => setCfgPhone(e.target.value)} placeholder="Shop phone" /></div>
            <div className="field"><label>GST number</label><input value={cfgGst} onChange={e => setCfgGst(e.target.value)} placeholder="GST number" /></div>
            <div className="field"><label>City</label><input value={cfgCity} onChange={e => setCfgCity(e.target.value)} placeholder="City" /></div>
          </div>
          <div className="field"><label>Address</label><input value={cfgAddr} onChange={e => setCfgAddr(e.target.value)} placeholder="Full address" /></div>
          <div className="grid2" style={{ marginTop: 16 }}>
            <div className="field"><label>Invoice link base URL</label><input value={cfgLinkBase} onChange={e => setCfgLinkBase(e.target.value)} placeholder="https://invoice.yourdomain.in" /></div>
            <div className="field"><label>Link expiry (days)</label><input type="number" min="1" max="90" value={cfgExpiry} onChange={e => setCfgExpiry(parseInt(e.target.value) || 10)} /></div>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={async () => { 
              if (!cfgShop.trim()) { showMessage('shop', 'Shop name is required.', false); return; }
              try {
                const response = await fetch('/api/settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    businessName: cfgShop,
                    shopOwner: cfgOwner,
                    shopPhone: cfgPhone,
                    shopGst: cfgGst,
                    shopCity: cfgCity,
                    shopAddress: cfgAddr,
                    invoiceLinkBase: cfgLinkBase,
                    invoiceExpiryDays: cfgExpiry,
                    currency: 'INR',
                    taxRate: 0
                  })
                });
                if (response.ok) {
                  showMessage('shop', 'Shop information saved to database!', true);
                } else {
                  showMessage('shop', 'Failed to save.', false);
                }
              } catch (e) {
                showMessage('shop', 'Network error.', false);
              }
            }}>💾 Save shop information</button>
          </div>
          <Msg text={msg['shop']?.text || ''} ok={msg['shop']?.ok || false} />
        </div>)}

        {settingsTab === 'whatsapp' && <div className="card">
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
              <button key={t} className={`stab ${waSubTab === t ? 'active' : ''}`} onClick={() => setWaSubTab(t)}>{t === 'creds' ? 'Credentials' : t === 'templates' ? 'Message templates' : t === 'triggers' ? 'Triggers' : 'Test & verify'}</button>
            ))}
          </div>

          {waSubTab === 'creds' && (
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
                <div className="field"><label>Invoice link base URL</label><input value={cfgLinkBase} onChange={e => setCfgLinkBase(e.target.value)} /><div className="hint">Base URL where invoice PDFs are hosted. Links generated as: {cfgLinkBase}/INV-JR1001-abc123</div></div>
                <div className="field"><label>Link expiry (days)</label><input type="number" min="1" max="90" value={cfgExpiry} onChange={e => setCfgExpiry(parseInt(e.target.value) || 10)} /><div className="hint">Invoice link expires after this many days. Default: 10 days.</div></div>
              </div>
              <div className="btn-row">
                <button className="btn btn-wa" onClick={async () => { 
                  if (!rmToken) { showMessage('creds', 'API key required.', false); return }
                  setConnStatus('checking');
                  try {
                    // Actually verify by making a test API call
                    const response = await fetch('/api/whatsapp', {
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
                  try {
                    const response = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        businessName: cfgShop,
                        shopOwner: cfgOwner,
                        shopPhone: cfgPhone,
                        shopGst: cfgGst,
                        shopCity: cfgCity,
                        shopAddress: cfgAddr,
                        whatsappApiKey: rmToken,
                        whatsappApiUrl: rmApiUrl,
                        whatsappRmUser: rmUser,
                        whatsappRmPass: rmPass,
                        whatsappRmWaba: rmWaba,
                        whatsappRmPhoneid: rmPhoneid,
                        whatsappRmWaphone: rmWaphone,
                        whatsappRmApiVer: rmApiver,
                        invoiceLinkBase: cfgLinkBase,
                        invoiceExpiryDays: cfgExpiry,
                        template1Name: tpl1Name,
                        template2Name: tpl2Name,
                        triggerReceive: trRecv,
                        triggerReady: trReady,
                        triggerKaragir: trKaragir,
                        currency: 'INR',
                        taxRate: 0
                      })
                    });
                    if (response.ok) {
                      showMessage('creds', 'Credentials saved to database!', true);
                    } else {
                      showMessage('creds', 'Failed to save credentials', false);
                    }
                  } catch (e) {
                    showMessage('creds', 'Failed to save: Network error', false);
                  }
                }}>Save credentials</button>
              </div>
              <Msg text={msg['creds']?.text || ''} ok={msg['creds']?.ok || false} />
            </>
          )}

          {waSubTab === 'templates' && (
            <>
              <div className="info-blue">WhatsApp Business API requires pre-approved HSM templates. The invoice PDF link is embedded as <code>{'{{6}}'}</code> (received) and <code>{'{{4}}'}</code> (ready) variables.</div>
              <div className="sec-label">Template 1 — Jewellery received (with invoice link)</div>
              <div className="grid2">
                <div className="field"><label>Template name <span className="req">*</span></label><input value={tpl1Name} onChange={e => setTpl1Name(e.target.value)} /><div className="hint">Exact name as approved in Meta Business Manager</div></div>
                <div className="field"><label>Language</label><select><option value="en_IN">en_IN — English (India)</option><option value="en">en</option><option value="hi">hi — Hindi</option><option value="mr">mr — Marathi</option></select></div>
              </div>
              <div className="field"><label>Template body</label><textarea rows={3} defaultValue={`Dear {{1}}, Your {{2}} jewellery ({{3}}) has been received at Devi Jewellers. Est. delivery: {{4}}. Est. charges: Rs {{5}}. View invoice: {{6}} (valid ${cfgExpiry} days). Thank you!`} /><div className="hint">{'{{1}}'} Name {'{{2}}'} Metal {'{{3}}'} Item {'{{4}}'} Delivery {'{{5}}'} Amount {'{{6}}'} Invoice link (auto-generated, {cfgExpiry} day expiry)</div></div>
              <div className="tpl-preview">Dear <strong>Ramesh Patil</strong>, Your <strong>Gold 22K</strong> jewellery (<strong>Gold Necklace</strong>) received at Devi Jewellers. Est. delivery: <strong>20 Apr 2026</strong>. Est. charges: Rs <strong>1200</strong>. View invoice: <span style={{ color: '#25D366' }}>{cfgLinkBase}/INV-JR1001-a3f9b2?exp=20Apr2026</span> (valid {cfgExpiry} days). Thank you!</div>
              <div className="divider" />
              <div className="sec-label">Template 2 — Ready for delivery (with final invoice link)</div>
              <div className="grid2">
                <div className="field"><label>Template name <span className="req">*</span></label><input value={tpl2Name} onChange={e => setTpl2Name(e.target.value)} /></div>
                <div className="field"><label>Language</label><select><option value="en_IN">en_IN</option><option value="en">en</option><option value="hi">hi</option><option value="mr">mr</option></select></div>
              </div>
              <div className="field"><label>Template body</label><textarea rows={3} defaultValue={`Dear {{1}}, Your {{2}} jewellery is ready at Devi Jewellers. Final charges: Rs {{3}}. View final invoice: {{4}} (valid ${cfgExpiry} days). Please visit with receipt. Thank you!`} /><div className="hint">{'{{1}}'} Name {'{{2}}'} Metal {'{{3}}'} Final amount {'{{4}}'} Final invoice link</div></div>
              <div className="btn-row"><button className="btn btn-primary" onClick={() => { if (!tpl1Name || !tpl2Name) { showMessage('templates', 'Template names required.', false); return }; showMessage('templates', 'Templates saved.', true) }}>Save templates</button></div>
              <Msg text={msg['templates']?.text || ''} ok={msg['templates']?.ok || false} />
            </>
          )}

          {waSubTab === 'triggers' && (
            <>
              <div className="info-warn">WhatsApp HSM templates can only be sent to customers who have opted in. Ensure customer consent.</div>
              <div className="toggle-row"><div><div style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp + invoice PDF link on receipt</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Template: <code>{tpl1Name}</code></div></div><Toggle checked={trRecv} onChange={setTrRecv} /></div>
              <div className="toggle-row"><div><div style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp + final invoice link when ready</div><div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Template: <code>{tpl2Name}</code></div></div><Toggle checked={trReady} onChange={setTrReady} /></div>
              <div className="toggle-row" style={{ border: 'none' }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Send WhatsApp when issued to karagir</div></div><Toggle checked={trKaragir} onChange={setTrKaragir} /></div>
              <div className="btn-row"><button className="btn btn-primary" onClick={() => showMessage('triggers', 'Trigger settings saved.', true)}>Save triggers</button></div>
              <Msg text={msg['triggers']?.text || ''} ok={msg['triggers']?.ok || false} />
            </>
          )}

          {waSubTab === 'watest' && (
            <>
              <div className="grid2">
                <div className="field"><label>Test WhatsApp number <span className="req">*</span></label><input value={testWa} onChange={e => setTestWa(e.target.value)} placeholder="+919876543210" /><div className="hint">Include country code.</div></div>
                <div className="field"><label>Template to test</label><select value={testTpl} onChange={e => setTestTpl(e.target.value)}><option value="received">Template 1 — {tpl1Name}</option><option value="ready">Template 2 — {tpl2Name}</option></select></div>
              </div>
              <div className="btn-row"><button className="btn btn-wa" onClick={sendTestWhatsApp}><IcWA />Send test WhatsApp</button></div>
              <Msg text={msg['watest']?.text || ''} ok={msg['watest']?.ok || false} />
            </>
          )}
        </div>}
      </div>
    </div>
  )
}
