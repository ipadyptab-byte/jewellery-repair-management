export const dynamic = 'force-dynamic'

import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ exp?: string }>
}

export default async function InvoicePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams || {}

  // ✅ Extract only numbers from ID (works for INV-JR1081, JR1081, 1081)
  const docNum = id.replace(/[^0-9]/g, '')

  // 🔐 Expiry check
  if (resolvedSearchParams?.exp) {
    const expiryStr = resolvedSearchParams.exp
    // Parse date like "26Apr2026" or "26 Apr 2026"
    const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
    const match = expiryStr.toLowerCase().match(/(\d+)([a-z]+)(\d+)/)
    if (match) {
      const day = parseInt(match[1])
      const month = months[match[2].substring(0, 3)]
      const year = parseInt(match[3])
      const expiryDate = new Date(year, month, day)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (today > expiryDate) {
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
  }

  try {
    // 📦 Fetch repair record
    const result = await sql().query(
      `SELECT * FROM repair_records WHERE doc_num = $1`,
      [docNum]
    )

    if (result.rows.length === 0) {
      return (
        <html>
          <head>
            <title>Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style={{ fontFamily: 'Arial', textAlign: 'center', padding: '40px', background: '#f5f5f5' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', maxWidth: '400px', margin: 'auto' }}>
              <h2 style={{ color: '#c62828' }}>Invoice Not Found</h2>
              <p>No record found for document: {docNum}</p>
              <p>Please contact the shop.</p>
            </div>
          </body>
        </html>
      )
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
            .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .shop-name { font-size: 28px; font-weight: bold; }
            .shop-address { font-size: 14px; color: #666; margin-top: 5px; }
            .shop-contact { font-size: 12px; color: #666; margin-top: 3px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-box { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            .info-label { font-size: 12px; color: #888; }
            .info-value { font-size: 16px; font-weight: bold; margin-top: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #333; color: white; padding: 12px; text-align: left; }
            .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
            .total { text-align: right; font-size: 22px; font-weight: bold; margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
            .btn { display:inline-block; margin-top:15px; padding:10px 15px; background:#333; color:#fff; text-decoration:none; border-radius:5px; }
          `}</style>
        </head>

        <body>
          <div className="invoice">
            <div className="header">
              <div className="shop-name">{shopName}</div>
              <div className="shop-address">{shopAddress}</div>
              {shopPhone && <div className="shop-contact">Phone: {shopPhone}</div>}
              {shopGst && <div className="shop-contact">GST: {shopGst}</div>}
            </div>

            <div className="invoice-title">
              {isFinal ? 'FINAL INVOICE' : 'REPAIR RECEIPT'}
            </div>

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