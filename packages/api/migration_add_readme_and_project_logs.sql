-- Migration: Add readme field to Project table and create ProjectLog table
-- Date: 2025-10-17

-- Add readme column to Project table
ALTER TABLE Project ADD COLUMN readme TEXT;

-- Create ProjectLog table
CREATE TABLE ProjectLog (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  log_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES Project(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_projectlog_project_id ON ProjectLog(project_id);
CREATE INDEX idx_projectlog_log_date ON ProjectLog(log_date);
