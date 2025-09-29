-- Add is_hidden column to Project table
ALTER TABLE Project ADD COLUMN is_hidden BOOLEAN DEFAULT false;