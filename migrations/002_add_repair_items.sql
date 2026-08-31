-- Migration: Add repair_items table for multiple jewellery items per repair record
-- Run this to add support for multiple jewellery entries per customer

-- Create repair_items table for storing multiple jewellery items per repair record
CREATE TABLE IF NOT EXISTS repair_items (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES repair_records(id) ON DELETE CASCADE,
  metal VARCHAR(100) NOT NULL,
  jewellery VARCHAR(255) NOT NULL,
  weight VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_repair_items_record_id ON repair_items(record_id);