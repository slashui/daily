-- Migration: Add KnowledgeBase table
-- Date: 2025-10-04
-- Description: Create work knowledge base table for storing knowledge entries

CREATE TABLE KnowledgeBase (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster querying by creation date
CREATE INDEX idx_knowledge_created_at ON KnowledgeBase(created_at DESC);
