export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default function InvoicePage({ params }: PageProps) {
  const { id } = params
  const docNum = id.replace(/[^0-9]/g, '')
  
  return (
    <html>
      <head>
        <title>Invoice {id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'Arial', textAlign: 'center', padding: '40px', background: '#f5f5f5' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', margin: 'auto' }}>
          <h2 style={{ color: '#333' }}>Invoice Page</h2>
          <p><strong>ID received:</strong> {id}</p>
          <p><strong>Doc Number:</strong> {docNum}</p>
          <hr style={{ margin: '20px 0' }} />
          <p style={{ color: '#666' }}>Page is working!</p>
        </div>
      </body>
    </html>
  )
}
