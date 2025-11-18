-- Migration: Add manual_summary field to DailySummary table
-- Date: 2025-10-04
-- Description: Add optional manual_summary field to allow users to write daily work summaries

ALTER TABLE DailySummary ADD COLUMN manual_summary TEXT;
