-- Migration 021: Add deleted_at column to users table for soft delete functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
