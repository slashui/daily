-- Migration: Add DailySummary table for daily task summaries
-- Created: 2025-09-25

CREATE TABLE IF NOT EXISTS "DailySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "summary_date" TEXT NOT NULL,
    "completed_todos" TEXT NOT NULL,
    "pending_todos" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on summary_date
CREATE UNIQUE INDEX IF NOT EXISTS "DailySummary_summary_date_key" ON "DailySummary"("summary_date");