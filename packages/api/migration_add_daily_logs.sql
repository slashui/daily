-- Add daily_logs and daily_log_ai columns to DailySummary table
ALTER TABLE DailySummary ADD COLUMN daily_logs TEXT;
ALTER TABLE DailySummary ADD COLUMN daily_log_ai TEXT;
