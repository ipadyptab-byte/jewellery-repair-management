export const dynamic = 'force-dynamic'

import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'

interface PageProps {
  params: { id: string }
  searchParams?: { exp?: string }
}

export default async function InvoicePage({ params, searchParams }: PageProps) {
  const { id } = params

  // ✅ Extract doc_num from ID (handles INV-JR1107, INV-JR1107-final-abc, etc.)
  // Format: INV-{docNum}[-suffix][-token]
  const idParts = id.split('-')
  // Remove 'INV' prefix, get first part which should be doc_num (e.g., 'JR1107')
  const docNum = idParts[0] === 'INV' ? idParts[1] : idParts[0]

  // 🔐 Expiry check
  if (searchParams?.exp) {
    const expStr = searchParams.exp
    // Parse formats: "05May2026", "05may2026", "05May2026", "2026-05-05"
    let expDate: Date
    const normalizedExp = expStr.toLowerCase()
    
    // Try parsing "05may2026" format
    if (/^\d{2}[a-z]+\d{4}$/.test(normalizedExp)) {
      const day = normalizedExp.slice(0, 2)
      const monthStr = normalizedExp.slice(2, 5)
      const year = normalizedExp.slice(5, 9)
      const monthMap: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }
      const month = monthMap[monthStr] || '01'
      expDate = new Date(`${year}-${month}-${day}`)
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(expStr)) {
      // ISO format "2026-05-05"
      expDate = new Date(expStr)
    } else {
      // Fallback: try direct parsing
      expDate = new Date(expStr)
    }
    
    const today = new Date()
    if (isNaN(expDate.getTime()) || today > expDate) {
      return (
        <html>
          <head>
            <title>Link Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style={{ fontFamily: 'Arial', textAlign: 'center', padding: '40px', background: '#f5f5f5' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', maxWidth: '400px', margin: 'auto' }}>
              <h2 style={{ color: '#c62828' }}>Link Expired</h2>
              <p>This invoice link is no longer valid.</p>
              <p>Please contact the shop.</p>
            </div>
          </body>
        </html>
      )
    }
  }

  try {
    // 📦 Fetch repair record
    const result = await sql().query(
      `SELECT * FROM repair_records WHERE doc_num = $1`,
      [docNum]
    )

    if (result.rows.length === 0) {
      notFound()
    }

    const rec = result.rows[0]
    const isFinal = rec.status === 'completed' || rec.final_amount

    // 🏪 Fetch shop settings
    const settingsResult = await sql().query(`SELECT key, value FROM settings`)
    const settings: Record<string, string> = {}

    settingsResult.rows.forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value
    })

    const shopName = settings.shop_name || settings.business_name || 'Devi Jewellers'
    const shopAddress = settings.shop_address || settings.shop_addr || ''
    const shopPhone = settings.shop_phone || ''
    const shopGst = settings.shop_gst || ''

    const amount = isFinal
      ? (rec.final_amount || 0)
      : (rec.estimated_cost || rec.amount || 0)

    const docNumber = 'JR' + rec.doc_num

    return (
      <html>
        <head>
          <title>Invoice {docNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>{`
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .brand-header { background: #c0003a; padding: 30px; text-align: center; }
            .brand-header img { max-width: 250px; height: auto; }
            .type-label { background: #a8007e; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; }
            .content { padding: 30px 40px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-box { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 12px; color: #888; }
            .info-value { font-size: 16px; font-weight: bold; margin-top: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #333; color: white; padding: 12px; text-align: left; }
            .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
            .total { text-align: right; font-size: 22px; font-weight: bold; margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; padding-bottom: 30px; }
          `}</style>
        </head>

        <body>
          <div className="invoice">
            <div className="brand-header" style={{ textAlign: 'center' }}>
              <img src="/logo.png" alt="Brand Logo" style={{ width: '200px', maxWidth: '80%', height: 'auto' }} />
            </div>
            <div className="type-label">{isFinal ? 'FINAL REPAIR INVOICE' : 'REPAIR RECEIPT / ESTIMATE'}</div>
            <div className="content">
              <div className="info-grid">
                <div className="info-box">
                  <div className="info-label">Document Number</div>
                  <div className="info-value">{docNumber}</div>
                </div>
                <div className="info-box">
                  <div className="info-label">Date</div>
                  <div className="info-value">
                    {new Date(rec.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="info-box">
                  <div className="info-label">Customer Name</div>
                  <div className="info-value">
                    {rec.customer_name || rec.name || '-'}
                  </div>
                </div>
                <div className="info-box">
                  <div className="info-label">Mobile Number</div>
                  <div className="info-value">
                    {rec.mobile || rec.phone_number || '-'}
                  </div>
                </div>
              </div>

              <table className="items-table">
                <tbody>
                  <tr>
                    <td>Jewellery Type</td>
                    <td>{rec.item_type || rec.jewellery || '-'}</td>
                  </tr>
                  <tr>
                    <td>Metal</td>
                    <td>{rec.metal || '-'}</td>
                  </tr>
                  <tr>
                    <td>Description</td>
                    <td>{rec.description || '-'}</td>
                  </tr>
                  {!isFinal && rec.delivery_date && (
                    <tr>
                      <td>Expected Delivery Date</td>
                      <td>
                        {new Date(rec.delivery_date).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="total">
                {isFinal ? 'Final Amount: ' : 'Estimated Amount: '} ₹
                {amount.toLocaleString('en-IN')}
              </div>

              <div className="footer">
                <p>Thank you for trusting {shopName}!</p>
                <p>This is a computer-generated document.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  } catch (err) {
    return (
      <html>
        <body style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Server Error</h2>
          <p>Please try again later.</p>
        </body>
      </html>
    )
  }
}
