-- Database schema for Devi Jewellers Repair Management System

-- Create repair_records table
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

-- Create masters table (salesmen, jewelleries, metals, karagirs)
CREATE TABLE IF NOT EXISTS masters (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'salesman', 'jewellery', 'metal', 'karagir', 'whatsapp_api'
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  mobile VARCHAR(15),
  category VARCHAR(100), -- for jewellery
  metal_type VARCHAR(50), -- for metals
  karat VARCHAR(20), -- for metals
  speciality VARCHAR(255), -- for karagirs
  address TEXT, -- for karagirs
  api_token TEXT, -- for whatsapp_api (long tokens)
  api_url TEXT, -- for whatsapp_api
  template_name VARCHAR(100), -- for whatsapp_api
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, name)
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_records_doc_num ON repair_records(doc_num);
CREATE INDEX IF NOT EXISTS idx_repair_records_mobile ON repair_records(mobile);
CREATE INDEX IF NOT EXISTS idx_repair_records_status ON repair_records(status);
CREATE INDEX IF NOT EXISTS idx_masters_type ON masters(type);
CREATE INDEX IF NOT EXISTS idx_masters_status ON masters(status);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default master data
INSERT INTO masters (type, name, status, mobile) VALUES
('salesman', 'Suresh', 'active', '9876500001'),
('salesman', 'Pooja', 'active', '9876500002'),
('salesman', 'Amit', 'active', '9876500003')
ON CONFLICT (type, name) DO NOTHING;

INSERT INTO masters (type, name, category, status) VALUES
('jewellery', 'Gold Ring', 'Ring', 'active'),
('jewellery', 'Gold Necklace', 'Necklace', 'active'),
('jewellery', 'Gold Bracelet', 'Bracelet', 'active'),
('jewellery', 'Silver Anklet', 'Anklet', 'active'),
('jewellery', 'Silver Chain', 'Chain', 'active'),
('jewellery', 'Mangalsutra', 'Necklace', 'active')
ON CONFLICT (type, name) DO NOTHING;

INSERT INTO masters (type, name, metal_type, karat, status) VALUES
('metal', 'Gold 22K', 'Gold', '22K', 'active'),
('metal', 'Gold 18K', 'Gold', '18K', 'active'),
('metal', 'Silver 925', 'Silver', '925', 'active')
ON CONFLICT (type, name) DO NOTHING;

INSERT INTO masters (type, name, mobile, speciality, address, status) VALUES
('karagir', 'Ganesh Soni', '9765400001', 'Gold repair', 'Budhwar Peth', 'active'),
('karagir', 'Manoj Karekar', '9765400002', 'Silver polishing', 'Laxmi Road', 'active')
ON CONFLICT (type, name) DO NOTHING;

-- Default WhatsApp API configurations (will be populated by user)
INSERT INTO masters (type, name, api_token, api_url, template_name, status) VALUES
('whatsapp_api', 'Route Mobile', '', 'https://api.rmlconnect.net/wba/v1/messages', '', 'active')
ON CONFLICT (type, name) DO NOTHING;

-- Add new columns for WhatsApp API (run each separately if needed)
-- ALTER TABLE masters ADD COLUMN IF NOT EXISTS api_token TEXT;
-- ALTER TABLE masters ADD COLUMN IF NOT EXISTS api_url TEXT;
-- ALTER TABLE masters ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);

-- Try insert - will fail if already exists, which is fine
INSERT INTO masters (type, name, api_token, api_url, template_name, status)
VALUES ('whatsapp_api', 'Route Mobile', '', 'https://api.rmlconnect.net/wba/v1/messages', '', 'active')
ON CONFLICT (type, name) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('shop_name', 'Devi Jewellers'),
('shop_owner', ''),
('shop_phone', ''),
('shop_gst', ''),
('shop_city', ''),
('shop_address', ''),
('doc_sequence', '1000'),
('whatsapp_rm_user', ''),
('whatsapp_rm_pass', ''),
('whatsapp_rm_waba', ''),
('whatsapp_rm_phoneid', ''),
('whatsapp_rm_waphone', ''),
('whatsapp_rm_token', ''),
('whatsapp_rm_api_url', 'https://api.routemobile.com/whatsapp/v1'),
('whatsapp_rm_api_version', 'v17.0'),
('invoice_link_base', 'https://invoice.devijewellers.in'),
('invoice_expiry_days', '10'),
('template_1_name', 'jewellery_received_invoice'),
('template_2_name', 'jewellery_ready_invoice'),
('trigger_receive', 'true'),
('trigger_ready', 'true'),
('trigger_karagir', 'false')
ON CONFLICT (key) DO NOTHING;