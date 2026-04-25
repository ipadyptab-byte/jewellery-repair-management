-- Migration: Add location fields to repair_records
-- Run this to add multi-location support

ALTER TABLE repair_records ADD COLUMN IF NOT EXISTS location VARCHAR(50) DEFAULT 'satara';
ALTER TABLE repair_records ADD COLUMN IF NOT EXISTS current_location VARCHAR(50) DEFAULT 'satara';
ALTER TABLE repair_records ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50);
ALTER TABLE repair_records ADD COLUMN IF NOT EXISTS received_invoice_expires_at TIMESTAMP;