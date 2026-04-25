import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const { searchParams } = new URL(request.url)
    const expParam = searchParams.get('exp')
    
    // Extract doc number from ID (e.g., INV-JR1001-final-a3f9b2 -> JR1001, or INV-JR1001 -> JR1001, or INV-JR-KO-0001 -> JR-KO-0001)
    const docMatch = id.match(/^INV-(.+?)(?:-final)?(?:-(.+))?$/)
    if (!docMatch) {
      const errorHtml = `<!DOCTYPE html><html><head><title>Error</title></head><body style="font-family:Arial;padding:40px;text-align:center;"><h2>Invalid Invoice Link</h2><p>The invoice ID "${id}" is not valid.</p><p>Please contact the shop for help.</p></body></html>`
      return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' }, status: 400 })
    }
    
    const docNum = docMatch[1]
    
    // Get invoice expiry setting
    const expResult = await sql().query(`SELECT value FROM settings WHERE key = 'invoice_expiry'`)
    const expDays = expResult.rows.length > 0 ? parseInt(expResult.rows[0].value) || 10 : 10
    
    // Check expiry if exp parameter provided
    if (expParam) {
      // Handle formats like 26Apr2026, 26apr2026, 26-04-2026
      const normalizedExp = expParam.toLowerCase().replace(/-/g, '')
      const expDateStr = normalizedExp.replace(/(\d{2})(\d{2})(\d{4})/, '$3-$2-$1')
      const expDate = new Date(expDateStr)
      const now = new Date()
      if (now > expDate) {
        const expiredHtml = `<!DOCTYPE html><html><head><title>Expired</title></head><body style="font-family:Arial;padding:40px;text-align:center;"><h2>Invoice Link Expired</h2><p>This invoice link has expired. Please contact the shop for a new link.</p></body></html>`
        return new NextResponse(expiredHtml, { headers: { 'Content-Type': 'text/html' }, status: 410 })
      }
    }
    
    // Get the repair record
    const result = await sql().query(
      `SELECT * FROM repair_records WHERE doc_num = $1`,
      [docNum]
    )
    
    if (result.rows.length === 0) {
      const notFoundHtml = `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:Arial;padding:40px;text-align:center;"><h2>Invoice Not Found</h2><p>No invoice found for document: ${docNum}</p><p>Please contact the shop for help.</p></body></html>`
      return new NextResponse(notFoundHtml, { headers: { 'Content-Type': 'text/html' }, status: 404 })
    }
    
    const rec = result.rows[0]
    const isFinal = id.includes('-final')
    
    // Check if received invoice link should be expired (when final invoice was generated)
    if (!isFinal && rec.received_invoice_expires_at) {
      const linkExpiry = new Date(rec.received_invoice_expires_at)
      const now = new Date()
      if (now > linkExpiry) {
        const expiredHtml = `<!DOCTYPE html><html><head><title>Link Expired</title></head><body style="font-family:Arial;padding:40px;text-align:center;"><h2 style="color:#c62828">Link Expired</h2><p>This repair invoice link has expired.</p><p>Your final invoice is now available.</p><p>Please contact the shop.</p></body></html>`
        return new NextResponse(expiredHtml, { headers: { 'Content-Type': 'text/html' }, status: 410 })
      }
    }
    
    // Get settings
    const settingsResult = await sql().query(`SELECT key, value FROM settings`)
    const settings: any = {}
    settingsResult.rows.forEach((row: any) => {
      settings[row.key] = row.value
    })
    
    const shopName = settings.shop_name || settings.businessName || 'Devi Jewellers'
    const shopAddress = settings.shop_address || ''
    const shopPhone = settings.shop_phone || ''
    const shopGst = settings.shop_gst || ''
    
    // Generate HTML invoice (view-only, no print)
    const amount = isFinal ? (rec.final_amount || rec.amount || 0) : (rec.estimated_cost || rec.amount || 0)
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${docNum}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .shop-name { font-size: 28px; font-weight: bold; color: #333; }
    .shop-address { font-size: 14px; color: #666; margin-top: 5px; }
    .shop-contact { font-size: 12px; color: #666; margin-top: 3px; }
    .invoice-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .info-box { background: #f9f9f9; padding: 15px; border-radius: 5px; }
    .info-label { font-size: 12px; color: #888; margin-bottom: 5px; }
    .info-value { font-size: 16px; font-weight: bold; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #333; color: white; padding: 12px; text-align: left; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .items-table tr:last-child td { border-bottom: none; }
    .total { text-align: right; font-size: 24px; font-weight: bold; margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
    .expired-notice { background: #ffebee; color: #c62828; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
    .no-print { -webkit-user-select: none; user-select: none; }
    @media print { body { background: white; } .invoice { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="shop-name">${shopName}</div>
      <div class="shop-address">${shopAddress}</div>
      ${shopPhone ? `<div class="shop-contact">Phone: ${shopPhone}</div>` : ''}
      ${shopGst ? `<div class="shop-contact">GST: ${shopGst}</div>` : ''}
    </div>
    <div class="invoice-title">${isFinal ? 'FINAL INVOICE' : 'REPAIR RECEIPT'}</div>
    <div class="info-grid">
      <div class="info-box">
        <div class="info-label">Document Number</div>
        <div class="info-value">${docNum}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Date</div>
        <div class="info-value">${new Date(rec.created_at).toLocaleDateString('en-IN')}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Customer Name</div>
        <div class="info-value">${rec.customer_name || rec.name || '-'}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Mobile Number</div>
        <div class="info-value">${rec.mobile || rec.phone_number || '-'}</div>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jewellery Type</td>
          <td>${rec.item_type || rec.jewellery || '-'}</td>
        </tr>
        <tr>
          <td>Metal</td>
          <td>${rec.metal || '-'}</td>
        </tr>
        <tr>
          <td>Description</td>
          <td>${rec.description || '-'}</td>
        </tr>
        ${!isFinal ? `
        <tr>
          <td>Expected Delivery Date</td>
          <td>${rec.delivery_date ? new Date(rec.delivery_date).toLocaleDateString('en-IN') : '-'}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
    <div class="total">
      ${isFinal ? 'Final Amount: ' : 'Estimated Amount: '} &#8377;${amount.toLocaleString('en-IN')}
    </div>
    <div class="footer">
      <p>Thank you for trusting ${shopName}!</p>
      <p>This is a computer-generated document. No signature required.</p>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    const errorHtml = `<!DOCTYPE html><html><head><title>Error</title></head><body style="font-family:Arial;padding:40px;text-align:center;"><h2>Error Loading Invoice</h2><p>Something went wrong. Please try again later or contact the shop.</p></body></html>`
    return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' }, status: 500 })
  }
}