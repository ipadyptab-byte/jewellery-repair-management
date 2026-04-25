-- Migration: Add received_invoice_expires_at column to repair_records
-- Run this to add the new column to existing databases

ALTER TABLE repair_records ADD COLUMN IF NOT EXISTS received_invoice_expires_at TIMESTAMP;