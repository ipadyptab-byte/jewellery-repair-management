import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: PageProps) {
  const { id } = await params
  
  // Extract doc number from id (e.g., JR1077 or 1077)
  const docNum = id.replace(/^JR/, '')
  
  // Get the repair record
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
        <body style={{ fontFamily: 'Arial, sans-serif', padding: '40px', textAlign: 'center', background: '#f5f5f5' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#c62828' }}>Invoice Not Found</h2>
            <p>No record found for document: {docNum}</p>
            <p style={{ color: '#666', marginTop: '20px' }}>Please contact the shop for help.</p>
          </div>
        </body>
      </html>
    )
  }
  
  const rec = result.rows[0]
  const isFinal = rec.status === 'completed' || rec.final_amount
  
  // Get shop settings
  const settingsResult = await sql().query(`SELECT key, value FROM settings`)
  const settings: Record<string, string> = {}
  settingsResult.rows.forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value
  })
  
  const shopName = settings.shop_name || settings.business_name || 'Devi Jewellers'
  const shopAddress = settings.shop_address || settings.shop_addr || ''
  const shopPhone = settings.shop_phone || ''
  const shopGst = settings.shop_gst || ''
  
  const amount = isFinal ? (rec.final_amount || 0) : (rec.estimated_cost || rec.amount || 0)
  const docNumber = 'JR' + rec.doc_num
  
  return (
    <html>
      <head>
        <title>Invoice {docNumber}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
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
          .total { text-align: right; font-size: 24px; font-weight: bold; margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
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
          <div className="invoice-title">{isFinal ? 'FINAL INVOICE' : 'REPAIR RECEIPT'}</div>
          <div className="info-grid">
            <div className="info-box">
              <div className="info-label">Document Number</div>
              <div className="info-value">{docNumber}</div>
            </div>
            <div className="info-box">
              <div className="info-label">Date</div>
              <div className="info-value">{new Date(rec.created_at).toLocaleDateString('en-IN')}</div>
            </div>
            <div className="info-box">
              <div className="info-label">Customer Name</div>
              <div className="info-value">{rec.customer_name || rec.name || '-'}</div>
            </div>
            <div className="info-box">
              <div className="info-label">Mobile Number</div>
              <div className="info-value">{rec.mobile || rec.phone_number || '-'}</div>
            </div>
          </div>
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Details</th>
              </tr>
            </thead>
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
                  <td>{new Date(rec.delivery_date).toLocaleDateString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="total">
            {isFinal ? 'Final Amount: ' : 'Estimated Amount: '} ₹{amount.toLocaleString('en-IN')}
          </div>
          <div className="footer">
            <p>Thank you for trusting {shopName}!</p>
            <p>This is a computer-generated document. No signature required.</p>
          </div>
        </div>
      </body>
    </html>
  )
}