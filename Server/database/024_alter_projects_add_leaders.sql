-- Migration: Add leaders JSONB column to projects for Multi-Leader support
-- Tabel: projects

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS leaders JSONB DEFAULT '[]'::jsonb;
