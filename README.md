# Devi Jewellers — Repair Management System

**Jewellery Repair Management System** built with Next.js 14.

## Features
- Dashboard with touch-friendly tiles
- Customer jewellery intake with invoice PDF generation
- Karagir (artisan) workflow management
- Real-time order tracking by document number or mobile
- WhatsApp notifications via Route Mobile official API
- Invoice PDF with shareable link (10-day expiry)
- Masters: Salesman, Jewellery type, Metal, Karagir
- Settings: Shop info + Route Mobile WhatsApp API configuration

## Deploy on Vercel (Recommended)

### Option 1 — Vercel CLI (fastest)
```bash
npm install -g vercel
cd devi-jewellers
npm install
vercel
```
Follow prompts: confirm project name, select defaults, deploy!

### Option 2 — GitHub + Vercel Dashboard
1. Push this folder to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit — Devi Jewellers repair system"
git remote add origin https://github.com/YOUR_USERNAME/devi-jewellers.git
git push -u origin main
```
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Framework: Next.js (auto-detected)
5. Build command: `npm run build`
6. Output directory: `out`
7. Click **Deploy**

Your app will be live at: `https://devi-jewellers-YOUR_HASH.vercel.app`

## Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Database Setup (Neon PostgreSQL)

1. Create a Neon database and copy the connection string.
2. Set the environment variable in Vercel as `DATABASE_URL_repair` with that connection string.
3. In the Neon console, open the SQL editor and run the SQL in `schema.sql`.

If your database is missing tables, run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS repair_records (
  id SERIAL PRIMARY KEY,
  doc_num VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  metal VARCHAR(100) NOT NULL,
  jewellery VARCHAR(255) NOT NULL,
  weight VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  salesman VARCHAR(255) NOT NULL,
  description TEXT,
  received_date TIMESTAMP NOT NULL,
  delivery_date TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'received',
  karagir VARCHAR(255),
  karagir_date TIMESTAMP,
  final_amount DECIMAL(10,2),
  completed_date TIMESTAMP,
  quality VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS masters (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  mobile VARCHAR(15),
  category VARCHAR(100),
  metal_type VARCHAR(50),
  karat VARCHAR(20),
  speciality VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, name)
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Then deploy or redeploy the app.

## WhatsApp API Setup
1. Get Route Mobile account at routemobile.com
2. Set up WhatsApp Business Account in Meta Business Manager
3. Register HSM templates: `jewellery_received_invoice` and `jewellery_ready_invoice`
4. Enter credentials in app Settings → WhatsApp API tab

## Invoice PDF Links
Set your hosting base URL in Settings → Credentials → Invoice link base URL.
Use AWS S3, Cloudflare R2, or your own server to host the generated PDFs.
